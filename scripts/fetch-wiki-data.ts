#!/usr/bin/env ts-node
/**
 * Craftdle Wiki Data Fetcher
 *
 * Queries the minecraft.wiki MediaWiki API to resolve real image and sound URLs,
 * then generates comprehensive game data JSON files.
 *
 * Usage: cd scripts && npx ts-node fetch-wiki-data.ts
 */

import * as https from "https";
import * as fs from "fs";
import * as path from "path";

const WIKI_API = "https://minecraft.wiki/api.php";

// ─── HTTP Helpers ───────────────────────────────────────────────

function httpsGet(url: string, maxRedirects = 5): Promise<string> {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error("Too many redirects"));
    https
      .get(
        url,
        { headers: { "User-Agent": "Craftdle/1.0 (game data fetcher)" } },
        (res) => {
          if (
            (res.statusCode === 301 ||
              res.statusCode === 302 ||
              res.statusCode === 308) &&
            res.headers.location
          ) {
            return httpsGet(res.headers.location, maxRedirects - 1)
              .then(resolve)
              .catch(reject);
          }
          if (res.statusCode !== 200) {
            res.resume();
            return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          }
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve(data));
          res.on("error", reject);
        },
      )
      .on("error", reject);
  });
}

async function wikiQuery(params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams({ ...params, format: "json" }).toString();
  const url = `${WIKI_API}?${qs}`;
  const data = await httpsGet(url);
  return JSON.parse(data);
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Wiki API Functions ─────────────────────────────────────────

/**
 * Batch-query imageinfo for multiple File: titles.
 * Returns a map of filename → CDN URL.
 */
async function batchGetImageUrls(
  filenames: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  for (let i = 0; i < filenames.length; i += 50) {
    const batch = filenames.slice(i, i + 50);
    const titles = batch.map((f) => `File:${f}`).join("|");

    try {
      const json = await wikiQuery({
        action: "query",
        titles,
        prop: "imageinfo",
        iiprop: "url",
      });

      if (json.query?.pages) {
        for (const page of Object.values(json.query.pages) as any[]) {
          if (page.imageinfo?.[0]?.url) {
            const name = page.title.replace("File:", "");
            result.set(name, page.imageinfo[0].url);
          }
        }
      }
    } catch (e) {
      console.error(
        `  Batch query failed for chunk ${i}: ${(e as Error).message}`,
      );
    }

    if (i + 50 < filenames.length) await delay(200); // rate limit
  }

  return result;
}

/**
 * Search allimages by prefix, optionally filtering by MIME type.
 */
async function searchImages(
  prefix: string,
  mimeType?: string,
  limit = 5,
): Promise<{ name: string; url: string }[]> {
  const params: Record<string, string> = {
    action: "query",
    list: "allimages",
    aiprefix: prefix,
    ailimit: String(limit),
    aiprop: "url",
    aisort: "name",
  };
  if (mimeType) params.aimimetype = mimeType;

  try {
    const json = await wikiQuery(params);
    return (json.query?.allimages || []).map((img: any) => ({
      name: img.name,
      url: img.url,
    }));
  } catch {
    return [];
  }
}

// ─── Data Definitions ───────────────────────────────────────────

interface ItemDef {
  id: string;
  name: string;
  type: "Block" | "Item" | "Tool" | "Weapon" | "Armor" | "Food";
  dimension: string[];
  stackable: boolean;
  renewable: boolean;
  versionAdded: string;
  inviconFile: string; // wiki filename for Invicon
}

interface MobDef {
  id: string;
  name: string;
  dimension: string[];
  behavior: "Hostile" | "Passive" | "Neutral";
  renewable: boolean;
  versionAdded: string;
  imageSearchPrefix: string; // prefix to search wiki for render
}

interface RecipeDef {
  itemId: string;
  name: string;
  grid: (string | null)[][];
  shapeless: boolean;
}

interface SoundDef {
  id: string;
  entityId: string;
  name: string;
  searchPrefix: string;
  category: string;
}

// ─── Items ──────────────────────────────────────────────────────

const ITEMS: ItemDef[] = [
  // Weapons
  {
    id: "diamond_sword",
    name: "Diamond Sword",
    type: "Weapon",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Diamond_Sword.png",
  },
  {
    id: "iron_sword",
    name: "Iron Sword",
    type: "Weapon",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Iron_Sword.png",
  },
  {
    id: "stone_sword",
    name: "Stone Sword",
    type: "Weapon",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Stone_Sword.png",
  },
  {
    id: "wooden_sword",
    name: "Wooden Sword",
    type: "Weapon",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Wooden_Sword.png",
  },
  {
    id: "netherite_sword",
    name: "Netherite Sword",
    type: "Weapon",
    dimension: ["Nether"],
    stackable: false,
    renewable: false,
    versionAdded: "1.16",
    inviconFile: "Invicon_Netherite_Sword.png",
  },
  {
    id: "bow",
    name: "Bow",
    type: "Weapon",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Bow.png",
  },
  {
    id: "crossbow",
    name: "Crossbow",
    type: "Weapon",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.14",
    inviconFile: "Invicon_Crossbow.png",
  },
  {
    id: "trident",
    name: "Trident",
    type: "Weapon",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.13",
    inviconFile: "Invicon_Trident.png",
  },

  // Tools
  {
    id: "diamond_pickaxe",
    name: "Diamond Pickaxe",
    type: "Tool",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Diamond_Pickaxe.png",
  },
  {
    id: "iron_pickaxe",
    name: "Iron Pickaxe",
    type: "Tool",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Iron_Pickaxe.png",
  },
  {
    id: "stone_pickaxe",
    name: "Stone Pickaxe",
    type: "Tool",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Stone_Pickaxe.png",
  },
  {
    id: "wooden_pickaxe",
    name: "Wooden Pickaxe",
    type: "Tool",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Wooden_Pickaxe.png",
  },
  {
    id: "netherite_pickaxe",
    name: "Netherite Pickaxe",
    type: "Tool",
    dimension: ["Nether"],
    stackable: false,
    renewable: false,
    versionAdded: "1.16",
    inviconFile: "Invicon_Netherite_Pickaxe.png",
  },
  {
    id: "diamond_axe",
    name: "Diamond Axe",
    type: "Tool",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Diamond_Axe.png",
  },
  {
    id: "iron_axe",
    name: "Iron Axe",
    type: "Tool",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Iron_Axe.png",
  },
  {
    id: "diamond_shovel",
    name: "Diamond Shovel",
    type: "Tool",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Diamond_Shovel.png",
  },
  {
    id: "diamond_hoe",
    name: "Diamond Hoe",
    type: "Tool",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Diamond_Hoe.png",
  },
  {
    id: "shield",
    name: "Shield",
    type: "Tool",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.9",
    inviconFile: "Invicon_Shield.png",
  },
  {
    id: "fishing_rod",
    name: "Fishing Rod",
    type: "Tool",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Fishing_Rod.png",
  },
  {
    id: "shears",
    name: "Shears",
    type: "Tool",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Shears.png",
  },
  {
    id: "flint_and_steel",
    name: "Flint and Steel",
    type: "Tool",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Flint_and_Steel.png",
  },

  // Armor
  {
    id: "diamond_helmet",
    name: "Diamond Helmet",
    type: "Armor",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Diamond_Helmet.png",
  },
  {
    id: "diamond_chestplate",
    name: "Diamond Chestplate",
    type: "Armor",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Diamond_Chestplate.png",
  },
  {
    id: "diamond_leggings",
    name: "Diamond Leggings",
    type: "Armor",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Diamond_Leggings.png",
  },
  {
    id: "diamond_boots",
    name: "Diamond Boots",
    type: "Armor",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Diamond_Boots.png",
  },
  {
    id: "iron_helmet",
    name: "Iron Helmet",
    type: "Armor",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Iron_Helmet.png",
  },
  {
    id: "iron_chestplate",
    name: "Iron Chestplate",
    type: "Armor",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Iron_Chestplate.png",
  },
  {
    id: "iron_leggings",
    name: "Iron Leggings",
    type: "Armor",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Iron_Leggings.png",
  },
  {
    id: "iron_boots",
    name: "Iron Boots",
    type: "Armor",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Iron_Boots.png",
  },
  {
    id: "netherite_chestplate",
    name: "Netherite Chestplate",
    type: "Armor",
    dimension: ["Nether"],
    stackable: false,
    renewable: false,
    versionAdded: "1.16",
    inviconFile: "Invicon_Netherite_Chestplate.png",
  },

  // Blocks
  {
    id: "oak_planks",
    name: "Oak Planks",
    type: "Block",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Oak_Planks.png",
  },
  {
    id: "spruce_planks",
    name: "Spruce Planks",
    type: "Block",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Spruce_Planks.png",
  },
  {
    id: "birch_planks",
    name: "Birch Planks",
    type: "Block",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Birch_Planks.png",
  },
  {
    id: "stone",
    name: "Stone",
    type: "Block",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Stone.png",
  },
  {
    id: "cobblestone",
    name: "Cobblestone",
    type: "Block",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Cobblestone.png",
  },
  {
    id: "dirt",
    name: "Dirt",
    type: "Block",
    dimension: ["Overworld"],
    stackable: true,
    renewable: false,
    versionAdded: "1.0",
    inviconFile: "Invicon_Dirt.png",
  },
  {
    id: "grass_block",
    name: "Grass Block",
    type: "Block",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Grass_Block.png",
  },
  {
    id: "sand",
    name: "Sand",
    type: "Block",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Sand.png",
  },
  {
    id: "gravel",
    name: "Gravel",
    type: "Block",
    dimension: ["Overworld", "Nether"],
    stackable: true,
    renewable: false,
    versionAdded: "1.0",
    inviconFile: "Invicon_Gravel.png",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    type: "Block",
    dimension: ["Overworld", "Nether", "End"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Obsidian.png",
  },
  {
    id: "tnt",
    name: "TNT",
    type: "Block",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_TNT.png",
  },
  {
    id: "crafting_table",
    name: "Crafting Table",
    type: "Block",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Crafting_Table.png",
  },
  {
    id: "furnace",
    name: "Furnace",
    type: "Block",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Furnace.png",
  },
  {
    id: "chest",
    name: "Chest",
    type: "Block",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Chest.png",
  },
  {
    id: "enchanting_table",
    name: "Enchanting Table",
    type: "Block",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Enchanting_Table.png",
  },
  {
    id: "anvil",
    name: "Anvil",
    type: "Block",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Anvil.png",
  },
  {
    id: "bookshelf",
    name: "Bookshelf",
    type: "Block",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Bookshelf.png",
  },
  {
    id: "piston",
    name: "Piston",
    type: "Block",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.7",
    inviconFile: "Invicon_Piston.png",
  },
  {
    id: "netherrack",
    name: "Netherrack",
    type: "Block",
    dimension: ["Nether"],
    stackable: true,
    renewable: false,
    versionAdded: "1.0",
    inviconFile: "Invicon_Netherrack.png",
  },
  {
    id: "glowstone",
    name: "Glowstone",
    type: "Block",
    dimension: ["Nether"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Glowstone.png",
  },
  {
    id: "end_stone",
    name: "End Stone",
    type: "Block",
    dimension: ["End"],
    stackable: true,
    renewable: false,
    versionAdded: "1.0",
    inviconFile: "Invicon_End_Stone.png",
  },
  {
    id: "glass",
    name: "Glass",
    type: "Block",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Glass.png",
  },
  {
    id: "soul_sand",
    name: "Soul Sand",
    type: "Block",
    dimension: ["Nether"],
    stackable: true,
    renewable: false,
    versionAdded: "1.0",
    inviconFile: "Invicon_Soul_Sand.png",
  },

  // Items
  {
    id: "diamond",
    name: "Diamond",
    type: "Item",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Diamond.png",
  },
  {
    id: "emerald",
    name: "Emerald",
    type: "Item",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.3",
    inviconFile: "Invicon_Emerald.png",
  },
  {
    id: "gold_ingot",
    name: "Gold Ingot",
    type: "Item",
    dimension: ["Overworld", "Nether"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Gold_Ingot.png",
  },
  {
    id: "iron_ingot",
    name: "Iron Ingot",
    type: "Item",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Iron_Ingot.png",
  },
  {
    id: "coal",
    name: "Coal",
    type: "Item",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Coal.png",
  },
  {
    id: "redstone",
    name: "Redstone Dust",
    type: "Item",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Redstone_Dust.png",
  },
  {
    id: "lapis_lazuli",
    name: "Lapis Lazuli",
    type: "Item",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Lapis_Lazuli.png",
  },
  {
    id: "netherite_ingot",
    name: "Netherite Ingot",
    type: "Item",
    dimension: ["Nether"],
    stackable: true,
    renewable: false,
    versionAdded: "1.16",
    inviconFile: "Invicon_Netherite_Ingot.png",
  },
  {
    id: "ender_pearl",
    name: "Ender Pearl",
    type: "Item",
    dimension: ["Overworld", "End"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Ender_Pearl.png",
  },
  {
    id: "blaze_rod",
    name: "Blaze Rod",
    type: "Item",
    dimension: ["Nether"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Blaze_Rod.png",
  },
  {
    id: "eye_of_ender",
    name: "Eye of Ender",
    type: "Item",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Eye_of_Ender.png",
  },
  {
    id: "stick",
    name: "Stick",
    type: "Item",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Stick.png",
  },
  {
    id: "torch",
    name: "Torch",
    type: "Item",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Torch.png",
  },
  {
    id: "bucket",
    name: "Bucket",
    type: "Item",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Bucket.png",
  },
  {
    id: "compass",
    name: "Compass",
    type: "Item",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Compass.png",
  },
  {
    id: "clock",
    name: "Clock",
    type: "Item",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Clock.png",
  },
  {
    id: "bone",
    name: "Bone",
    type: "Item",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Bone.png",
  },
  {
    id: "string",
    name: "String",
    type: "Item",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_String.png",
  },
  {
    id: "gunpowder",
    name: "Gunpowder",
    type: "Item",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Gunpowder.png",
  },
  {
    id: "flint",
    name: "Flint",
    type: "Item",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Flint.png",
  },
  {
    id: "book",
    name: "Book",
    type: "Item",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Book.png",
  },

  // Food
  {
    id: "golden_apple",
    name: "Golden Apple",
    type: "Food",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Golden_Apple.png",
  },
  {
    id: "bread",
    name: "Bread",
    type: "Food",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Bread.png",
  },
  {
    id: "cookie",
    name: "Cookie",
    type: "Food",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Cookie.png",
  },
  {
    id: "cooked_beef",
    name: "Steak",
    type: "Food",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Steak.png",
  },
  {
    id: "apple",
    name: "Apple",
    type: "Food",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Apple.png",
  },
  {
    id: "cake",
    name: "Cake",
    type: "Food",
    dimension: ["Overworld"],
    stackable: false,
    renewable: true,
    versionAdded: "1.2",
    inviconFile: "Invicon_Cake.png",
  },
  {
    id: "cooked_porkchop",
    name: "Cooked Porkchop",
    type: "Food",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Cooked_Porkchop.png",
  },
  {
    id: "melon_slice",
    name: "Melon Slice",
    type: "Food",
    dimension: ["Overworld"],
    stackable: true,
    renewable: true,
    versionAdded: "1.0",
    inviconFile: "Invicon_Melon_Slice.png",
  },
];

// ─── Mobs ───────────────────────────────────────────────────────

const MOBS: MobDef[] = [
  {
    id: "creeper",
    name: "Creeper",
    dimension: ["Overworld"],
    behavior: "Hostile",
    renewable: true,
    versionAdded: "1.0",
    imageSearchPrefix: "Creeper_JE",
  },
  {
    id: "zombie",
    name: "Zombie",
    dimension: ["Overworld"],
    behavior: "Hostile",
    renewable: true,
    versionAdded: "1.0",
    imageSearchPrefix: "Zombie_JE",
  },
  {
    id: "skeleton",
    name: "Skeleton",
    dimension: ["Overworld", "Nether"],
    behavior: "Hostile",
    renewable: true,
    versionAdded: "1.0",
    imageSearchPrefix: "Skeleton_JE",
  },
  {
    id: "spider",
    name: "Spider",
    dimension: ["Overworld"],
    behavior: "Hostile",
    renewable: true,
    versionAdded: "1.0",
    imageSearchPrefix: "Spider_JE",
  },
  {
    id: "enderman",
    name: "Enderman",
    dimension: ["Overworld", "Nether", "End"],
    behavior: "Neutral",
    renewable: true,
    versionAdded: "1.0",
    imageSearchPrefix: "Enderman_JE",
  },
  {
    id: "blaze",
    name: "Blaze",
    dimension: ["Nether"],
    behavior: "Hostile",
    renewable: true,
    versionAdded: "1.0",
    imageSearchPrefix: "Blaze_JE",
  },
  {
    id: "ghast",
    name: "Ghast",
    dimension: ["Nether"],
    behavior: "Hostile",
    renewable: true,
    versionAdded: "1.0",
    imageSearchPrefix: "Ghast_JE",
  },
  {
    id: "wither_skeleton",
    name: "Wither Skeleton",
    dimension: ["Nether"],
    behavior: "Hostile",
    renewable: true,
    versionAdded: "1.4",
    imageSearchPrefix: "Wither_Skeleton_JE",
  },
  {
    id: "magma_cube",
    name: "Magma Cube",
    dimension: ["Nether"],
    behavior: "Hostile",
    renewable: true,
    versionAdded: "1.0",
    imageSearchPrefix: "Magma_Cube_JE",
  },
  {
    id: "wolf",
    name: "Wolf",
    dimension: ["Overworld"],
    behavior: "Neutral",
    renewable: true,
    versionAdded: "1.0",
    imageSearchPrefix: "Wolf_JE",
  },
  {
    id: "cat",
    name: "Cat",
    dimension: ["Overworld"],
    behavior: "Passive",
    renewable: true,
    versionAdded: "1.14",
    imageSearchPrefix: "Tuxedo_Cat_JE",
  },
  {
    id: "pig",
    name: "Pig",
    dimension: ["Overworld"],
    behavior: "Passive",
    renewable: true,
    versionAdded: "1.0",
    imageSearchPrefix: "Pig_JE",
  },
  {
    id: "cow",
    name: "Cow",
    dimension: ["Overworld"],
    behavior: "Passive",
    renewable: true,
    versionAdded: "1.0",
    imageSearchPrefix: "Cow_JE",
  },
  {
    id: "sheep",
    name: "Sheep",
    dimension: ["Overworld"],
    behavior: "Passive",
    renewable: true,
    versionAdded: "1.0",
    imageSearchPrefix: "White_Sheep_JE",
  },
  {
    id: "chicken",
    name: "Chicken",
    dimension: ["Overworld"],
    behavior: "Passive",
    renewable: true,
    versionAdded: "1.0",
    imageSearchPrefix: "Chicken_JE",
  },
  {
    id: "villager",
    name: "Villager",
    dimension: ["Overworld"],
    behavior: "Passive",
    renewable: true,
    versionAdded: "1.0",
    imageSearchPrefix: "Plains_Villager_Base_JE",
  },
  {
    id: "iron_golem",
    name: "Iron Golem",
    dimension: ["Overworld"],
    behavior: "Neutral",
    renewable: true,
    versionAdded: "1.2",
    imageSearchPrefix: "Iron_Golem_JE",
  },
  {
    id: "ender_dragon",
    name: "Ender Dragon",
    dimension: ["End"],
    behavior: "Hostile",
    renewable: true,
    versionAdded: "1.0",
    imageSearchPrefix: "Ender_Dragon_JE",
  },
  {
    id: "wither",
    name: "Wither",
    dimension: ["Overworld", "Nether", "End"],
    behavior: "Hostile",
    renewable: true,
    versionAdded: "1.4",
    imageSearchPrefix: "Wither_JE",
  },
  {
    id: "phantom",
    name: "Phantom",
    dimension: ["Overworld"],
    behavior: "Hostile",
    renewable: true,
    versionAdded: "1.13",
    imageSearchPrefix: "Phantom_JE",
  },
  {
    id: "warden",
    name: "Warden",
    dimension: ["Overworld"],
    behavior: "Hostile",
    renewable: true,
    versionAdded: "1.19",
    imageSearchPrefix: "Warden_JE",
  },
  {
    id: "slime",
    name: "Slime",
    dimension: ["Overworld"],
    behavior: "Hostile",
    renewable: true,
    versionAdded: "1.0",
    imageSearchPrefix: "Slime_JE",
  },
];

// ─── Recipes ────────────────────────────────────────────────────

const RECIPES: RecipeDef[] = [
  // Swords
  {
    itemId: "diamond_sword",
    name: "Diamond Sword",
    grid: [
      [null, "diamond", null],
      [null, "diamond", null],
      [null, "stick", null],
    ],
    shapeless: false,
  },
  {
    itemId: "iron_sword",
    name: "Iron Sword",
    grid: [
      [null, "iron_ingot", null],
      [null, "iron_ingot", null],
      [null, "stick", null],
    ],
    shapeless: false,
  },
  {
    itemId: "stone_sword",
    name: "Stone Sword",
    grid: [
      [null, "cobblestone", null],
      [null, "cobblestone", null],
      [null, "stick", null],
    ],
    shapeless: false,
  },
  {
    itemId: "wooden_sword",
    name: "Wooden Sword",
    grid: [
      [null, "oak_planks", null],
      [null, "oak_planks", null],
      [null, "stick", null],
    ],
    shapeless: false,
  },

  // Pickaxes
  {
    itemId: "diamond_pickaxe",
    name: "Diamond Pickaxe",
    grid: [
      ["diamond", "diamond", "diamond"],
      [null, "stick", null],
      [null, "stick", null],
    ],
    shapeless: false,
  },
  {
    itemId: "iron_pickaxe",
    name: "Iron Pickaxe",
    grid: [
      ["iron_ingot", "iron_ingot", "iron_ingot"],
      [null, "stick", null],
      [null, "stick", null],
    ],
    shapeless: false,
  },
  {
    itemId: "stone_pickaxe",
    name: "Stone Pickaxe",
    grid: [
      ["cobblestone", "cobblestone", "cobblestone"],
      [null, "stick", null],
      [null, "stick", null],
    ],
    shapeless: false,
  },
  {
    itemId: "wooden_pickaxe",
    name: "Wooden Pickaxe",
    grid: [
      ["oak_planks", "oak_planks", "oak_planks"],
      [null, "stick", null],
      [null, "stick", null],
    ],
    shapeless: false,
  },

  // Axes
  {
    itemId: "diamond_axe",
    name: "Diamond Axe",
    grid: [
      ["diamond", "diamond", null],
      ["diamond", "stick", null],
      [null, "stick", null],
    ],
    shapeless: false,
  },
  {
    itemId: "iron_axe",
    name: "Iron Axe",
    grid: [
      ["iron_ingot", "iron_ingot", null],
      ["iron_ingot", "stick", null],
      [null, "stick", null],
    ],
    shapeless: false,
  },

  // Shovels
  {
    itemId: "diamond_shovel",
    name: "Diamond Shovel",
    grid: [
      [null, "diamond", null],
      [null, "stick", null],
      [null, "stick", null],
    ],
    shapeless: false,
  },

  // Other tools
  {
    itemId: "bow",
    name: "Bow",
    grid: [
      [null, "stick", "string"],
      ["stick", null, "string"],
      [null, "stick", "string"],
    ],
    shapeless: false,
  },
  {
    itemId: "shield",
    name: "Shield",
    grid: [
      ["oak_planks", "iron_ingot", "oak_planks"],
      ["oak_planks", "oak_planks", "oak_planks"],
      [null, "oak_planks", null],
    ],
    shapeless: false,
  },
  {
    itemId: "fishing_rod",
    name: "Fishing Rod",
    grid: [
      [null, null, "stick"],
      [null, "stick", "string"],
      ["stick", null, "string"],
    ],
    shapeless: false,
  },
  {
    itemId: "shears",
    name: "Shears",
    grid: [
      [null, "iron_ingot", null],
      ["iron_ingot", null, null],
      [null, null, null],
    ],
    shapeless: false,
  },
  {
    itemId: "flint_and_steel",
    name: "Flint and Steel",
    grid: [
      ["iron_ingot", null, null],
      [null, "flint", null],
      [null, null, null],
    ],
    shapeless: true,
  },

  // Blocks/Utility
  {
    itemId: "crafting_table",
    name: "Crafting Table",
    grid: [
      ["oak_planks", "oak_planks", null],
      ["oak_planks", "oak_planks", null],
      [null, null, null],
    ],
    shapeless: false,
  },
  {
    itemId: "furnace",
    name: "Furnace",
    grid: [
      ["cobblestone", "cobblestone", "cobblestone"],
      ["cobblestone", null, "cobblestone"],
      ["cobblestone", "cobblestone", "cobblestone"],
    ],
    shapeless: false,
  },
  {
    itemId: "chest",
    name: "Chest",
    grid: [
      ["oak_planks", "oak_planks", "oak_planks"],
      ["oak_planks", null, "oak_planks"],
      ["oak_planks", "oak_planks", "oak_planks"],
    ],
    shapeless: false,
  },
  {
    itemId: "enchanting_table",
    name: "Enchanting Table",
    grid: [
      [null, "book", null],
      ["diamond", "obsidian", "diamond"],
      ["obsidian", "obsidian", "obsidian"],
    ],
    shapeless: false,
  },
  {
    itemId: "bookshelf",
    name: "Bookshelf",
    grid: [
      ["oak_planks", "oak_planks", "oak_planks"],
      ["book", "book", "book"],
      ["oak_planks", "oak_planks", "oak_planks"],
    ],
    shapeless: false,
  },
  {
    itemId: "piston",
    name: "Piston",
    grid: [
      ["oak_planks", "oak_planks", "oak_planks"],
      ["cobblestone", "iron_ingot", "cobblestone"],
      ["cobblestone", "redstone", "cobblestone"],
    ],
    shapeless: false,
  },
  {
    itemId: "tnt",
    name: "TNT",
    grid: [
      ["gunpowder", "sand", "gunpowder"],
      ["sand", "gunpowder", "sand"],
      ["gunpowder", "sand", "gunpowder"],
    ],
    shapeless: false,
  },

  // Food
  {
    itemId: "golden_apple",
    name: "Golden Apple",
    grid: [
      ["gold_ingot", "gold_ingot", "gold_ingot"],
      ["gold_ingot", "apple", "gold_ingot"],
      ["gold_ingot", "gold_ingot", "gold_ingot"],
    ],
    shapeless: false,
  },
  {
    itemId: "bread",
    name: "Bread",
    grid: [
      ["wheat", "wheat", "wheat"],
      [null, null, null],
      [null, null, null],
    ],
    shapeless: false,
  },
  {
    itemId: "cookie",
    name: "Cookie",
    grid: [
      ["wheat", "cocoa_beans", "wheat"],
      [null, null, null],
      [null, null, null],
    ],
    shapeless: false,
  },
  {
    itemId: "cake",
    name: "Cake",
    grid: [
      ["milk_bucket", "milk_bucket", "milk_bucket"],
      ["sugar", "egg", "sugar"],
      ["wheat", "wheat", "wheat"],
    ],
    shapeless: false,
  },

  // Items
  {
    itemId: "stick",
    name: "Stick",
    grid: [
      [null, "oak_planks", null],
      [null, "oak_planks", null],
      [null, null, null],
    ],
    shapeless: false,
  },
  {
    itemId: "torch",
    name: "Torch",
    grid: [
      [null, "coal", null],
      [null, "stick", null],
      [null, null, null],
    ],
    shapeless: false,
  },
  {
    itemId: "bucket",
    name: "Bucket",
    grid: [
      ["iron_ingot", null, "iron_ingot"],
      [null, "iron_ingot", null],
      [null, null, null],
    ],
    shapeless: false,
  },
  {
    itemId: "compass",
    name: "Compass",
    grid: [
      [null, "iron_ingot", null],
      ["iron_ingot", "redstone", "iron_ingot"],
      [null, "iron_ingot", null],
    ],
    shapeless: false,
  },
  {
    itemId: "clock",
    name: "Clock",
    grid: [
      [null, "gold_ingot", null],
      ["gold_ingot", "redstone", "gold_ingot"],
      [null, "gold_ingot", null],
    ],
    shapeless: false,
  },

  // Armor
  {
    itemId: "diamond_helmet",
    name: "Diamond Helmet",
    grid: [
      ["diamond", "diamond", "diamond"],
      ["diamond", null, "diamond"],
      [null, null, null],
    ],
    shapeless: false,
  },
  {
    itemId: "diamond_chestplate",
    name: "Diamond Chestplate",
    grid: [
      ["diamond", null, "diamond"],
      ["diamond", "diamond", "diamond"],
      ["diamond", "diamond", "diamond"],
    ],
    shapeless: false,
  },
  {
    itemId: "diamond_leggings",
    name: "Diamond Leggings",
    grid: [
      ["diamond", "diamond", "diamond"],
      ["diamond", null, "diamond"],
      ["diamond", null, "diamond"],
    ],
    shapeless: false,
  },
  {
    itemId: "diamond_boots",
    name: "Diamond Boots",
    grid: [
      ["diamond", null, "diamond"],
      ["diamond", null, "diamond"],
      [null, null, null],
    ],
    shapeless: false,
  },

  // Simple crafting
  {
    itemId: "oak_planks",
    name: "Oak Planks",
    grid: [
      ["oak_log", null, null],
      [null, null, null],
      [null, null, null],
    ],
    shapeless: true,
  },
];

// ─── Sounds ─────────────────────────────────────────────────────

const SOUNDS: SoundDef[] = [
  {
    id: "creeper_fuse",
    entityId: "creeper",
    name: "Creeper",
    searchPrefix: "Fuse",
    category: "Mob",
  },
  {
    id: "zombie_idle",
    entityId: "zombie",
    name: "Zombie",
    searchPrefix: "Zombie idle",
    category: "Mob",
  },
  {
    id: "skeleton_idle",
    entityId: "skeleton",
    name: "Skeleton",
    searchPrefix: "Skeleton idle",
    category: "Mob",
  },
  {
    id: "spider_idle",
    entityId: "spider",
    name: "Spider",
    searchPrefix: "Spider idle",
    category: "Mob",
  },
  {
    id: "enderman_idle",
    entityId: "enderman",
    name: "Enderman",
    searchPrefix: "Enderman idle",
    category: "Mob",
  },
  {
    id: "blaze_ambient",
    entityId: "blaze",
    name: "Blaze",
    searchPrefix: "Blaze breath",
    category: "Mob",
  },
  {
    id: "ghast_moan",
    entityId: "ghast",
    name: "Ghast",
    searchPrefix: "Ghast affectionate scream",
    category: "Mob",
  },
  {
    id: "wolf_bark",
    entityId: "wolf",
    name: "Wolf",
    searchPrefix: "Wolf bark",
    category: "Mob",
  },
  {
    id: "cat_meow",
    entityId: "cat",
    name: "Cat",
    searchPrefix: "Cat meow",
    category: "Mob",
  },
  {
    id: "pig_idle",
    entityId: "pig",
    name: "Pig",
    searchPrefix: "Pig idle",
    category: "Mob",
  },
  {
    id: "cow_idle",
    entityId: "cow",
    name: "Cow",
    searchPrefix: "Cow idle",
    category: "Mob",
  },
  {
    id: "sheep_idle",
    entityId: "sheep",
    name: "Sheep",
    searchPrefix: "Sheep say",
    category: "Mob",
  },
  {
    id: "chicken_idle",
    entityId: "chicken",
    name: "Chicken",
    searchPrefix: "Chicken idle",
    category: "Mob",
  },
  {
    id: "villager_idle",
    entityId: "villager",
    name: "Villager",
    searchPrefix: "Villager idle",
    category: "Mob",
  },
  {
    id: "ender_dragon_roar",
    entityId: "ender_dragon",
    name: "Ender Dragon",
    searchPrefix: "Ender Dragon growl",
    category: "Mob",
  },
];

// ─── Ingredient to Icon mapping ─────────────────────────────────
// Map ingredient IDs used in recipes to their Invicon file names

const INGREDIENT_ICON_MAP: Record<string, string> = {};
for (const item of ITEMS) {
  INGREDIENT_ICON_MAP[item.id] = item.inviconFile;
}
// Add extra ingredients not in the main items list
const EXTRA_INGREDIENTS: Record<string, string> = {
  wheat: "Invicon_Wheat.png",
  cocoa_beans: "Invicon_Cocoa_Beans.png",
  milk_bucket: "Invicon_Milk_Bucket.png",
  sugar: "Invicon_Sugar.png",
  egg: "Invicon_Egg.png",
  oak_log: "Invicon_Oak_Log.png",
  iron_block: "Invicon_Block_of_Iron.png",
  blaze_powder: "Invicon_Blaze_Powder.png",
};
Object.assign(INGREDIENT_ICON_MAP, EXTRA_INGREDIENTS);

// ═══════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log("🔨 Craftdle Wiki Data Fetcher");
  console.log("═".repeat(50));

  // 1. Resolve item Invicon URLs
  console.log("\n📦 Resolving item Invicon URLs...");
  const itemFiles = ITEMS.map((i) => i.inviconFile);
  const ingredientFiles = Object.values(EXTRA_INGREDIENTS);
  const allInviconFiles = [...new Set([...itemFiles, ...ingredientFiles])];
  const inviconUrls = await batchGetImageUrls(allInviconFiles);
  console.log(
    `  Found ${inviconUrls.size}/${allInviconFiles.length} Invicon URLs`,
  );

  // 2. Resolve mob render URLs
  console.log("\n🐾 Resolving mob render URLs...");
  const mobUrls = new Map<string, string>();
  for (const mob of MOBS) {
    const results = await searchImages(mob.imageSearchPrefix, undefined, 3);
    // Pick the first PNG result (skip .gif etc)
    const pngResult = results.find((r) => r.name.endsWith(".png"));
    if (pngResult) {
      mobUrls.set(mob.id, pngResult.url);
      console.log(`  ✓ ${mob.name}: ${pngResult.name}`);
    } else {
      console.log(
        `  ✗ ${mob.name}: no render found (prefix: ${mob.imageSearchPrefix})`,
      );
    }
    await delay(150);
  }

  // 3. Resolve sound URLs
  console.log("\n🔊 Resolving sound URLs...");
  const soundUrls = new Map<string, string>();
  for (const sound of SOUNDS) {
    const results = await searchImages(sound.searchPrefix, "audio/ogg", 3);
    const oggResult = results.find((r) => r.name.endsWith(".ogg"));
    if (oggResult) {
      soundUrls.set(sound.id, oggResult.url);
      console.log(`  ✓ ${sound.name}: ${oggResult.name}`);
    } else {
      // Try without "idle"/"ambient" - just the mob name + ogg filter
      const fallback = await searchImages(
        sound.name.replace(/ /g, "_"),
        "audio/ogg",
        10,
      );
      const oggFallback = fallback.find((r) => r.name.endsWith(".ogg"));
      if (oggFallback) {
        soundUrls.set(sound.id, oggFallback.url);
        console.log(`  ~ ${sound.name}: ${oggFallback.name} (fallback)`);
      } else {
        console.log(`  ✗ ${sound.name}: no sound found`);
      }
    }
    await delay(150);
  }

  // ─── Generate items.json ────────────────────────────────────
  console.log("\n📝 Generating items.json...");
  const itemsJson = ITEMS.map((item) => {
    const url = inviconUrls.get(item.inviconFile);
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      dimension: item.dimension,
      stackable: item.stackable,
      renewable: item.renewable,
      versionAdded: item.versionAdded,
      textureUrl:
        url || `https://minecraft.wiki/w/Special:FilePath/${item.inviconFile}`,
      wikiUrl: `https://minecraft.wiki/w/${item.name.replace(/ /g, "_")}`,
    };
  });

  // ─── Generate mobs.json ─────────────────────────────────────
  console.log("📝 Generating mobs.json...");
  const mobsJson = MOBS.map((mob) => ({
    id: mob.id,
    name: mob.name,
    type: "Mob" as const,
    dimension: mob.dimension,
    behavior: mob.behavior,
    stackable: false as const,
    renewable: mob.renewable,
    versionAdded: mob.versionAdded,
    textureUrl:
      mobUrls.get(mob.id) ||
      `https://minecraft.wiki/w/Special:FilePath/${mob.name.replace(/ /g, "_")}_JE2.png`,
    wikiUrl: `https://minecraft.wiki/w/${mob.name.replace(/ /g, "_")}`,
  }));

  // ─── Generate recipes.json ──────────────────────────────────
  console.log("📝 Generating recipes.json...");
  const recipesJson = RECIPES;

  // ─── Generate sounds.json ───────────────────────────────────
  console.log("📝 Generating sounds.json...");
  const soundsJson = SOUNDS.map((sound) => ({
    id: sound.id,
    entityId: sound.entityId,
    name: sound.name,
    soundFile: soundUrls.get(sound.id) || "",
    category: sound.category,
  })).filter((s) => s.soundFile !== "");

  // ─── Generate ingredient icons map ──────────────────────────
  console.log("📝 Generating ingredientIcons.json...");
  const ingredientIcons: Record<string, string> = {};
  for (const [id, filename] of Object.entries(INGREDIENT_ICON_MAP)) {
    const url = inviconUrls.get(filename);
    ingredientIcons[id] =
      url || `https://minecraft.wiki/w/Special:FilePath/${filename}`;
  }

  // ─── Write files ────────────────────────────────────────────
  const dataDir = path.join(process.cwd(), "server", "data");
  fs.writeFileSync(
    path.join(dataDir, "items.json"),
    JSON.stringify(itemsJson, null, 2),
  );
  fs.writeFileSync(
    path.join(dataDir, "mobs.json"),
    JSON.stringify(mobsJson, null, 2),
  );
  fs.writeFileSync(
    path.join(dataDir, "recipes.json"),
    JSON.stringify(recipesJson, null, 2),
  );
  fs.writeFileSync(
    path.join(dataDir, "sounds.json"),
    JSON.stringify(soundsJson, null, 2),
  );
  fs.writeFileSync(
    path.join(dataDir, "ingredientIcons.json"),
    JSON.stringify(ingredientIcons, null, 2),
  );

  console.log("\n═".repeat(50));
  console.log(`✅ Generated data files:`);
  console.log(`   items.json:  ${itemsJson.length} items`);
  console.log(`   mobs.json:   ${mobsJson.length} mobs`);
  console.log(`   recipes.json: ${recipesJson.length} recipes`);
  console.log(`   sounds.json: ${soundsJson.length} sounds`);
  console.log(
    `   ingredientIcons.json: ${Object.keys(ingredientIcons).length} icons`,
  );
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
