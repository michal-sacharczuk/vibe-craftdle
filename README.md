# Craftdle

A Minecraft-themed guessing game inspired by [Loldle](https://loldle.net). Identify items, blocks, and mobs across 7 different game modes. Fully static — no backend required.

Built with React, TypeScript, Tailwind CSS, and Vite. Deployable on GitHub Pages.

## Game Modes

| Mode                 | Description                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| **Classic**          | Guess an item/block/mob by attribute feedback (type, dimension, behavior, stackable, renewable, version) |
| **Crafting Grid**    | Identify a craftable item from its recipe — ingredients are revealed one by one                          |
| **Texture Close-up** | Recognize an item from a zoomed-in crop of its 16×16 texture                                             |
| **Sound**            | Identify a mob by its sound effect                                                                       |
| **Silhouette**       | Identify a mob from a blacked-out silhouette that gradually reveals                                      |
| **Timeline**         | Guess whether the next entity was added in a higher or lower Minecraft version                           |
| **Reverse Crafting** | Given the output item, reconstruct the 3×3 crafting grid                                                 |

All modes support configurable guess limits (unlimited, 5, 10, 15, or 20).

## Quick Start

```bash
# Install dependencies
npm run setup

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173/Craftdle/`.

## Scripts

| Script               | Description                               |
| -------------------- | ----------------------------------------- |
| `npm run setup`      | Install root and client dependencies      |
| `npm run dev`        | Start Vite dev server                     |
| `npm run build`      | Build for production                      |
| `npm run preview`    | Preview production build locally          |
| `npm test`           | Run all tests                             |
| `npm run fetch-data` | Fetch fresh game data from minecraft.wiki |

## Project Structure

```
Craftdle/
├── client/                    # React app (static site)
│   ├── public/
│   │   ├── data/              # Static JSON game data
│   │   ├── textures/          # Minecraft texture images
│   │   ├── sounds/            # Minecraft sound files
│   │   └── 404.html           # SPA fallback for GitHub Pages
│   └── src/
│       ├── engine/            # Client-side game engines
│       │   ├── dataStore.ts   # Loads JSON data, provides search
│       │   ├── sessionManager.ts
│       │   └── *Engine.ts     # One per game mode
│       ├── components/        # React components per mode
│       ├── hooks/             # useGame, useAutocomplete
│       ├── services/api.ts    # Thin wrapper over engines
│       └── types/             # TypeScript interfaces
├── scripts/
│   └── fetch-wiki-data.ts     # Wiki API data fetcher
├── tests/client/              # Jest + React Testing Library
├── changelog.md
└── package.json
```

## Architecture

All game logic runs client-side in the browser:

1. **Data Store** — Loads JSON files from `public/data/` via `fetch()` on startup
2. **Session Manager** — Tracks game sessions in memory (Map-based)
3. **Game Engines** — Each mode has `start()`, `guess()`, `getAnswer()` functions
4. **API Layer** — Async wrapper that ensures data is loaded, then delegates to engines

No server, no API calls — everything is self-contained in the browser.

## Data

Game data is sourced from [minecraft.wiki](https://minecraft.wiki) at build time via the `fetch-wiki-data.ts` script. Data files:

- `items.json` — Items and blocks with attributes (type, dimension, stackable, etc.)
- `mobs.json` — Mobs with behavior, dimension, sounds
- `recipes.json` — Crafting recipes (3×3 grids)
- `sounds.json` — Sound file references for mobs
- `biomes.json` — Biome data
- `ingredientIcons.json` — Texture URLs for crafting ingredients

Only the latest stable Minecraft version (1.21+) is included.

## Deployment

The app is configured for GitHub Pages with base path `/Craftdle/`.

```bash
# Build
npm run build

# Output is in client/dist/
# Deploy the contents of client/dist/ to GitHub Pages
```

The `404.html` SPA redirect handles client-side routing on GitHub Pages.

## Testing

```bash
npm test
```

Tests use Jest + React Testing Library. Test files are in `tests/client/`.

## Tech Stack

- **React 18** + **TypeScript** — UI framework
- **Vite** — Build tool and dev server
- **Tailwind CSS** — Styling (Minecraft-inspired dark theme)
- **Jest** + **React Testing Library** — Testing
- **GitHub Pages** — Static hosting

## Disclaimer

**This is an unofficial fan project. It is NOT affiliated with, endorsed by, or connected to Mojang Studios, Microsoft, or Minecraft in any way.**

- Minecraft is a registered trademark of Mojang Studios / Microsoft.
- This project is non-commercial — it is not monetized and generates no revenue.
- It is intended solely for personal, educational, and entertainment purposes.
- Game data (item names, crafting recipes, mob attributes, version history) is sourced from [minecraft.wiki](https://minecraft.wiki), which is licensed under [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/). Attribution is provided in the app footer.
- Texture images and sound files are linked from minecraft.wiki and are not redistributed by this project.
- If any rights holder has concerns, please open an issue and the content will be promptly removed.

This project follows [Microsoft's usage guidelines](https://www.minecraft.net/en-us/usage-guidelines) for fan projects to the best of our ability.
