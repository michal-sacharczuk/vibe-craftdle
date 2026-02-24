# Changelog

All notable changes to the Craftdle project are documented in this file.

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
