# Changelog

All notable changes to the Craftdle project are documented in this file.

---

## [2.0.0] - 2026-03-09

### Changed

- **Architecture**: Converted from client-server (React + Express) to a fully static client-only app. All game logic now runs in the browser — no backend server required.
- **Game engines**: All 7 game mode services (Classic, Crafting, Texture, Sound, Silhouette, Timeline, Reverse Crafting) ported to client-side engines in `client/src/engine/`.
- **Session management**: Sessions now stored in browser memory via `sessionManager.ts` instead of server-side.
- **Data loading**: Game data fetched from static JSON files in `client/public/data/` at runtime instead of loaded at server startup.
- **API layer**: `api.ts` rewritten to delegate to local engines instead of making HTTP calls.
- **Data fetcher**: `scripts/fetch-wiki-data.ts` now outputs to `client/public/data/` instead of `server/data/`.

### Removed

- **Backend server**: Entire `server/` directory removed (Express app, routes, services, types, utils).
- **Server tests**: All `tests/server/` test suites removed (126 tests).
- **Dependencies**: Removed `concurrently`, Express, and all server-side dependencies.

### Added

- **Client-side engines**: `classicEngine.ts`, `craftingEngine.ts`, `textureEngine.ts`, `soundEngine.ts`, `silhouetteEngine.ts`, `timelineEngine.ts`, `reverseCraftingEngine.ts`.
- **Data store**: `dataStore.ts` — client-side data loader with validation, mirroring the server's `dataLoader.ts`.
- **Session manager**: `sessionManager.ts` — in-memory session management for the browser.
- **GitHub Pages support**: Vite configured with `base: "/Craftdle/"`, SPA `404.html` redirect, and `BrowserRouter` basename.
- **Vite environment types**: Added `vite-env.d.ts` for `import.meta.env` support.

---

## [1.0.1] - 2026-03-09

### Fixed

- **Data validation**: Added `wikiUrl` to required fields in entity validation. Entities missing wiki URLs are now excluded from all game modes.
- **Silhouette visibility text overlap**: Moved the "Visibility: X%" indicator outside the image container so it no longer overlaps with the search bar on small screens.

### Security

- **Input validation hardened**: `guessLimit` is now sanitized (must be a positive integer ≤ 100, otherwise defaults to unlimited). Guess strings are type-checked and length-limited (200 chars). Session IDs are type-checked and length-limited (100 chars).
- **Request body size limit**: Express JSON body parser now enforces a 1MB limit.
- **Search query length limit**: Search input capped at 100 characters server-side.
- **Session memory management**: Added periodic session cleanup (every 10 minutes) and a cap of 10,000 concurrent sessions to prevent memory exhaustion under load.

---

## [1.0.0] - 2026-03-09

### Added

- **Silhouette Mode**: New game mode where players identify a mob from its blacked-out silhouette. Each wrong guess reduces the blackout opacity (100% → 85% → 70% → 55% → 40% → fully revealed), testing visual shape recognition. Uses mob render images from the existing data.
  - Backend: `silhouetteService.ts` with opacity-based progressive reveal.
  - Frontend: `SilhouetteGame.tsx` + `SilhouetteView.tsx` with CSS mix-blend-mode silhouette effect.
  - Routes: `POST /api/silhouette/start`, `POST /api/silhouette/guess`, `GET /api/silhouette/answer/:sessionId`.
  - Mob-only search filtering (`mode=silhouette`).

- **Timeline / Higher or Lower Mode**: Streak-based game mode where players see an entity and guess whether the next one was added in a higher or lower Minecraft version number. Game ends on the first wrong answer. Uses the `versionAdded` field present on all entities.
  - Backend: `timelineService.ts` with version comparison, streak tracking, and best-streak persistence.
  - Frontend: `TimelineGame.tsx` + `TimelineCard.tsx` with dedicated higher/lower UI (no autocomplete needed).
  - Routes: `POST /api/timeline/start`, `POST /api/timeline/guess`, `GET /api/timeline/answer/:sessionId`.

- **Reverse Crafting Mode**: The inverse of Crafting Grid — players see the output item and must place ingredients in the correct grid positions. On wrong placement, one correctly-placed ingredient locks in as progressive assist.
  - Backend: `reverseCraftingService.ts` with grid comparison, progressive slot locking, and ingredient validation.
  - Frontend: `ReverseCraftingGame.tsx` + `ReverseCraftingGrid.tsx` with interactive ingredient palette and click-to-place grid.
  - Routes: `POST /api/reverse-crafting/start`, `POST /api/reverse-crafting/guess`, `GET /api/reverse-crafting/answer/:sessionId`.

- **New tests**: 25 new server tests across 3 new service test files + route tests for all 3 new modes. Total: 177 tests (126 server + 51 client), all passing.
- **Mob search endpoint**: `searchMobs()` in dataLoader for silhouette mode filtering.

### Changed

- **Session types expanded**: `GameSession.mode` union now includes `"silhouette" | "timeline" | "reverse-crafting"`. New session interfaces: `SilhouetteSession`, `TimelineSession`, `ReverseCraftingSession`.
- **ModeSelector**: Now displays 7 game modes (was 4) in a responsive grid.
- **App routing**: Added routes for `/silhouette`, `/timeline`, `/reverse-crafting`.

---

## [0.5.0] - 2026-03-09

### Changed

- **Dynamic data fetching**: Replaced all hardcoded item/mob/recipe/sound arrays in `scripts/fetch-wiki-data.ts` with dynamic discovery from the minecraft.wiki MediaWiki API. The script now:
  - Discovers items, blocks, mobs, and biomes by recursively traversing wiki categories.
  - Parses infobox templates (`{{Infobox item`, `{{Infobox block`, `{{Infobox entity`) from page wikitext to extract attributes (renewable, stackable, versionAdded, type, dimension).
  - Extracts crafting recipes from `{{Crafting` templates embedded in item pages.
  - Resolves Invicon texture URLs, mob render URLs, and sound files via the wiki image API.
  - Classifies entity types (Weapon, Tool, Armor, Food, Block, Item) from both wiki categories and item names.
  - Parses version history from `{{HistoryLine` templates, mapping pre-1.0 versions to "1.0".
  - Automatically filters out removed features, Education Edition exclusives, joke items, redirects, and concept pages.
- **Comprehensive data validation**: Enhanced `dataLoader.ts` with per-game-mode filtering. Items missing required properties for a game mode are excluded from that mode's pool:
  - Classic mode: requires id, name, type, dimension, stackable, renewable, versionAdded, textureUrl (and behavior for mobs).
  - Crafting mode: requires a valid recipe with a 3×3 grid containing at least one ingredient, linked to an existing item.
  - Texture mode: requires a valid textureUrl.
  - Sound mode: requires a valid soundFile and a matching mob with a valid textureUrl.
- Data yields significantly more content: ~946 items/blocks (was ~245), ~83 mobs (was ~68), ~84 biomes (was 5), ~296 recipes (was ~80), ~51 sounds (was ~30).

---

## [0.4.1] - 2026-02-26

### Added

- **Crafting-only search**: The crafting game mode dropdown now only shows items that have crafting recipes (no mobs, no uncraftable items).
- **Mode-filtered search API**: `/api/items/search` accepts an optional `mode` query parameter; `mode=crafting` filters to craftable items only.
- **Data validation**: `dataLoader` now filters out entities with missing/empty texture URLs, recipes referencing invalid items, and sounds referencing invalid mobs at load time.
- **New tests**: Added `dataLoader.test.ts` with 11 tests for data validation, `searchEntities`, and `searchCraftableItems`. Added route test for `mode=crafting`. Added client tests for mode parameter in `searchItems` and `useAutocomplete`. Total: 133 tests (82 server + 51 client).

### Changed

- `searchItems()` API function now accepts an optional `mode` parameter.
- `useAutocomplete` hook now accepts an optional `mode` parameter, forwarded to `searchItems`.
- `AutocompleteSearch` and `GameLayout` components accept an optional `mode`/`searchMode` prop for mode-specific filtering.
- `CraftingGame` passes `searchMode="crafting"` to `GameLayout`.

---

## [0.4.0] - 2026-02-26

### Added

- **Massively expanded game data**: 222 items (was 82), 69 mobs (was 22), 140 recipes (was 35), 32 sounds (was 12), 235 ingredient icons (was 90).
- **New blocks**: Shulker Box, Hopper, Dispenser, Dropper, Observer, Beacon, Brewing Stand, Barrel, Smoker, Blast Furnace, Stonecutter, Grindstone, Smithing Table, Campfire, Lantern, Ender Chest, Iron Bars, Rails, Scaffolding, and 50+ more.
- **New tools/weapons/armor**: Full golden, leather, and stone tool/armor sets; Spyglass, Lead, Map, Turtle Shell.
- **New mobs**: Witch, Guardian, Elder Guardian, Shulker, Pillager, Evoker, Bee, Dolphin, Fox, Goat, Axolotl, Frog, Camel, Armadillo, Sniffer, and 30+ more.
- **New recipes**: 105 new crafting recipes including Shulker Box, Hopper, Dispenser, armor sets, tools, redstone components, and utility blocks.
- **New sounds**: 20 additional mob sounds (Witch, Guardian, Shulker, Bee, Dolphin, Horse, Fox, Goat, Frog, etc.).

---

## [0.3.3] - 2026-02-26

### Fixed

- **Crafting grid layout**: Added `grid-rows-3` and `aspect-square` to ensure all cells are perfectly square regardless of content.
- **Crafting grid slot color**: Changed revealed ingredient cell background from `bg-mc-wood` (#BC9862 beige) to `bg-[#373737]` (dark gray), matching Minecraft's actual crafting table slot appearance.
- **Flaky test**: Fixed `craftingService` "decrements guesses remaining" test that failed when a random guess happened to be correct.

---

## [0.3.2] - 2026-02-26

### Fixed

- **Image aspect ratio**: added `object-contain` to `<img>` tags in `AutocompleteSearch.tsx` and `GameOverModal.tsx` so non-square images (e.g., mob textures) are no longer stretched/squished.
- **Missing image on crafting win screen**: `getCraftingAnswer` now looks up the item's real `textureUrl` and `wikiUrl` from `items.json` instead of returning a nonexistent local `/textures/` path.

---

## [0.3.1] - 2026-02-26

### Changed

- **`npm run dev`** now uses colored, labeled output (`[server]` in blue, `[client]` in green) via `concurrently -n -c`.
- Added **`npm run start`** — builds both server and client, then runs them in production mode (Express + Vite preview) concurrently.
- Added **`npm run setup`** — one-command bootstrap: installs all dependencies (root, server, client) and fetches wiki data.
- Reordered `npm test` to run server tests before client tests.

---

## [0.3.0] - 2026-02-24

### Added

- **Comprehensive test suite**: 118 tests total (69 server + 49 client), all passing.
  - Server: `compare.test.ts` (6), `sessionService.test.ts` (14), `classicService.test.ts` (9), `craftingService.test.ts` (8), `textureService.test.ts` (8), `soundService.test.ts` (8), `routes.test.ts` (14 via supertest).
  - Client: `api.test.ts` (16), `useGame.test.ts` (14), `useAutocomplete.test.ts` (8), `components.test.tsx` (11 — GuessLimitSelector + GameLayout).
- **`useGame` generic hook** (`client/src/hooks/useGame.ts`): extracts all shared game state management (session, guesses, game over, error, answer) into a single reusable hook parameterized by `<TStartRes, TGuessRes>`. Used by all 4 game modes.
- **`GameLayout` component** (`client/src/components/common/GameLayout.tsx`): shared UI layout for start screen, in-game header, autocomplete, past guesses, and game over modal. Used by Crafting, Texture, and Sound modes.
- **`createGameRouter` factory** (`server/src/routes/createGameRouter.ts`): eliminates ~120 lines of duplicated Express route boilerplate across the 4 game mode route files.

### Changed

- **Server routes refactored**: `classicRoutes.ts`, `craftingRoutes.ts`, `soundRoutes.ts`, `textureRoutes.ts` each reduced from ~35 lines to ~12 lines by delegating to `createGameRouter`.
- **CraftingGame.tsx** refactored from ~170 lines to ~55 lines using `useGame` + `GameLayout`.
- **TextureGame.tsx** refactored from ~155 lines to ~57 lines using `useGame` + `GameLayout`.
- **SoundGame.tsx** refactored from ~130 lines to ~38 lines using `useGame` + `GameLayout`.
- **ClassicGame.tsx** refactored to use `useGame` hook (keeps custom layout for attribute feedback table).
- **`jest.config.cjs` (client)**: fixed typo `setupFilesAfterSetup` → `setupFilesAfterEnv`, added `moduleDirectories` for test resolution from `tests/client/`.
- **`jest.config.js` (server)**: added `moduleDirectories` for test resolution from `tests/server/`.
- **`fetch-data` npm script**: changed from `cd scripts && npx ts-node` to `npx ts-node scripts/fetch-wiki-data.ts` so `process.cwd()` resolves `server/data` correctly.

### Dependencies

- Added `supertest@7` and `mime@3` (server devDependencies) for HTTP route testing.

---

## [0.2.0] - 2026-02-24

### Added

- **Win animation**: confetti effect (canvas-confetti) fires from both sides with green/gold Minecraft-themed particles on correct guess. "🏆 You Win! 🏆" text with bounce animation.
- **Auto-redirect**: after winning, players automatically return to the home page after 4 seconds with a "Go Home Now" shortcut button.
- **Real wiki data**: `scripts/fetch-wiki-data.ts` fetches item/mob/recipe/sound data from the minecraft.wiki MediaWiki API (`api.php`).
  - 82 items with real Invicon texture URLs across 6 categories.
  - 22 mobs with wiki entity render images.
  - 37 real Minecraft crafting recipes.
  - 12 mob sounds with wiki OGG audio URLs.
  - 90 ingredient-to-icon URL mappings for crafting grid display.
- **Crafting Grid images**: 3×3 crafting grid now shows real Minecraft item Invicon images (from minecraft.wiki) instead of text labels when ingredients are revealed.
- **Texture Close-up real images**: uses CSS `background-image` cropping with real wiki texture URLs. Randomized crop center (centerX/centerY) for variety. Pixelated rendering for authentic Minecraft look.
- **Sound mode real audio**: plays actual mob sound OGG files from minecraft.wiki instead of placeholder descriptions.
- **Autocomplete thumbnails**: search dropdown shows 24×24 wiki Invicon thumbnails next to item names.
- **Mobile responsive design**:
  - Hamburger menu (☰/✕) for mobile navigation, auto-closes on link click.
  - Stacked guess limit selector on small screens.
  - Responsive crafting grid sizing.
  - Mobile-friendly scrollbar CSS.

### Changed

- `GameOverModal` redesigned: win state shows confetti + auto-redirect, loss state shows "Play Again" + "Back to Menu".
- `CraftingGrid` component accepts `ingredientIcons` prop for image display with text fallback.
- `TextureCrop` uses CSS background-position/background-size instead of canvas (avoids CORS issues).
- `SoundPlayer` uses `useRef` for persistent Audio element with play/stop toggle and pulse animation.
- `Header` component adds responsive mobile hamburger menu.
- Server `craftingService` includes `ingredientIcons` map in start/guess responses.
- Server `textureService` returns real `textureUrl` and random `centerX`/`centerY` in responses.
- `dataLoader` now loads `ingredientIcons.json` at startup.

### Dependencies

- Added `canvas-confetti` (client) for win animation effects.

---

## [0.1.0] - 2026-02-24

### Added

- **Full project scaffolding**: monorepo with `client/` (React + Vite) and `server/` (Node.js + Express), both TypeScript.
- **Backend API server** (port 3001):
  - Express app with CORS, JSON body parsing, health check endpoint.
  - Data loader reads JSON files (items, mobs, biomes, recipes, sounds) into memory at startup.
  - Session management service with UUID-based game sessions and auto-cleanup.
  - Attribute comparison utility for Classic mode feedback.
  - 4 game mode services: Classic, Crafting, Texture, Sound — each with start/guess/answer logic.
  - REST routes for all 4 modes + autocomplete search endpoint (`/api/items/search?q=`).
- **Sample data files**: 10 items, 8 mobs, 5 biomes, 5 recipes, 5 sounds in `server/data/`.
- **Frontend React app** (port 5173 with Vite proxy to backend):
  - Tailwind CSS with Minecraft-themed dark design (pixel font, stone/dirt/grass palette).
  - Home page with mode selector cards (Classic, Crafting Grid, Texture Close-up, Sound).
  - Navigation header with links to all modes + footer with wiki attribution.
  - Autocomplete search component with debounced API calls.
  - Guess limit selector (Unlimited, 5, 10, 15, 20) for all modes.
  - Game over modal with answer reveal, wiki link, and "Play Again" button.
  - **Classic Mode**: attribute table with match/no-match coloring, guess history, give up.
  - **Crafting Grid Mode**: 3×3 grid with hidden "?" slots, progressive ingredient reveal.
  - **Texture Close-up Mode**: crop size display (4×4 → 16×16), zoom-out on wrong guess.
  - **Sound Mode**: play button, guess input, past guesses list.
  - React Router for SPA navigation between modes.
- **Configuration files**: `.gitignore`, `tsconfig.json` (client & server), `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, Jest configs.
- **Playwright MCP testing**: verified all 4 modes work end-to-end (start game, autocomplete search, submit guess, progressive feedback, give up/game over, play again).

---

## [0.0.2] - 2026-02-24

### Changed

- Data source updated from HTML scraping to **minecraft.wiki MediaWiki API** (`https://minecraft.wiki/api.php`).
- Build-time scripts renamed from `scrape-*.ts` to `fetch-*.ts`.
- Data collection section rewritten with API endpoints, actions, and batch query approach.

---

## [0.0.1] - 2026-02-24

### Added

- Initial `model_instructions.md` created with full project plan.
- 4 game modes defined: Classic, Crafting Grid, Texture Close-up, Sound.
- Tech stack: React + Node.js (TypeScript), Tailwind CSS, Jest, Vite.
- Data model schemas for items, mobs, biomes, recipes, and sounds.
- API endpoint definitions for all game modes.
- Project folder structure.
- Implementation order (10 steps).
