#!/usr/bin/env ts-node
/**
 * Craftdle Wiki Data Fetcher v2 (Dynamic)
 *
 * Dynamically discovers and fetches game data from the minecraft.wiki
 * MediaWiki API. Queries categories for items, blocks, mobs, and biomes,
 * then parses infobox templates from page wikitext to extract structured
 * game attributes.
 *
 * All hardcoded data arrays have been removed. Entity discovery is driven
 * entirely by wiki category membership, so new items/mobs added to the
 * latest Minecraft version are picked up automatically.
 *
 * Usage: npx ts-node scripts/fetch-wiki-data.ts
 */

import * as https from "https";
import * as fs from "fs";
import * as path from "path";

const WIKI_API = "https://minecraft.wiki/api.php";
const USER_AGENT = "Craftdle/2.0 (game data fetcher)";
const RATE_LIMIT_MS = 200;

// ─── HTTP Helpers ───────────────────────────────────────────────

function httpsGet(url: string, maxRedirects = 5): Promise<string> {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error("Too many redirects"));
    https
      .get(url, { headers: { "User-Agent": USER_AGENT } }, (res) => {
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
        res.on("data", (chunk: string) => (data += chunk));
        res.on("end", () => resolve(data));
        res.on("error", reject);
      })
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

// ─── Wiki Image Helpers ─────────────────────────────────────────

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
        `  Batch imageinfo failed for chunk ${i}: ${(e as Error).message}`,
      );
    }

    if (i + 50 < filenames.length) await delay(RATE_LIMIT_MS);
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

// ─── Category Discovery ─────────────────────────────────────────

/** Categories to skip during recursive traversal */
function shouldSkipCategory(catName: string): boolean {
  const lower = catName.toLowerCase();
  return (
    lower.includes("removed") ||
    lower.includes("education edition") ||
    lower.includes("joke") ||
    lower.includes("april fools") ||
    lower.includes("unimplemented") ||
    lower.includes("unused") ||
    lower.includes("mentioned") ||
    lower.includes("debug") ||
    lower.includes("upcoming") ||
    lower.includes("planned") ||
    lower.includes("china") ||
    lower.includes("legacy console") ||
    lower.includes("bedrock edition") ||
    lower.includes("exclusive")
  );
}

/**
 * Fetch all page titles from a wiki category.
 * Handles pagination via cmcontinue.
 */
async function fetchCategoryMembers(
  category: string,
  type: "page" | "subcat" = "page",
): Promise<string[]> {
  const members: string[] = [];
  let cmcontinue: string | undefined;

  do {
    const params: Record<string, string> = {
      action: "query",
      list: "categorymembers",
      cmtitle: `Category:${category}`,
      cmlimit: "500",
      cmtype: type,
    };
    if (cmcontinue) params.cmcontinue = cmcontinue;

    try {
      const json = await wikiQuery(params);
      const cm = json.query?.categorymembers || [];
      for (const m of cm) {
        members.push(m.title);
      }
      cmcontinue = json.continue?.cmcontinue;
    } catch (e) {
      console.error(
        `  Error fetching Category:${category}: ${(e as Error).message}`,
      );
      break;
    }
    if (cmcontinue) await delay(RATE_LIMIT_MS);
  } while (cmcontinue);

  return members;
}

/**
 * Recursively discover all pages from a set of categories.
 * Traverses subcategories up to maxDepth levels.
 */
async function fetchPagesFromCategories(
  categories: string[],
  maxDepth = 2,
): Promise<Set<string>> {
  const allPages = new Set<string>();
  const visitedCats = new Set<string>();

  async function traverse(category: string, depth: number) {
    if (depth <= 0 || visitedCats.has(category)) return;
    visitedCats.add(category);

    const pages = await fetchCategoryMembers(category, "page");
    for (const p of pages) allPages.add(p);
    if (pages.length > 0) {
      console.log(`    Category:${category}: ${pages.length} pages`);
    }

    if (depth > 1) {
      const subcats = await fetchCategoryMembers(category, "subcat");
      for (const sc of subcats) {
        const catName = sc.replace("Category:", "");
        if (shouldSkipCategory(catName)) continue;
        await traverse(catName, depth - 1);
        await delay(RATE_LIMIT_MS);
      }
    }
  }

  for (const cat of categories) {
    await traverse(cat, maxDepth);
  }

  return allPages;
}

// ─── Wikitext Fetching ──────────────────────────────────────────

/**
 * Batch fetch raw wikitext for multiple pages.
 * Returns Map of title → wikitext content.
 */
async function batchFetchWikitext(
  titles: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const titleStr = batch.join("|");

    try {
      const json = await wikiQuery({
        action: "query",
        titles: titleStr,
        prop: "revisions",
        rvprop: "content",
        rvslots: "main",
      });

      if (json.query?.pages) {
        for (const page of Object.values(json.query.pages) as any[]) {
          if (page.missing !== undefined) continue;
          const content =
            page.revisions?.[0]?.slots?.main?.["*"] ||
            page.revisions?.[0]?.["*"];
          if (content && typeof content === "string") {
            result.set(page.title, content);
          }
        }
      }
    } catch (e) {
      console.error(
        `  Error fetching wikitext batch ${i}: ${(e as Error).message}`,
      );
    }
    if (i + 50 < titles.length) await delay(RATE_LIMIT_MS);
  }

  return result;
}

/**
 * Batch fetch categories for multiple pages.
 * Returns Map of title → array of category names (without "Category:" prefix).
 */
async function batchFetchCategories(
  titles: string[],
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();

  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const titleStr = batch.join("|");

    try {
      const json = await wikiQuery({
        action: "query",
        titles: titleStr,
        prop: "categories",
        cllimit: "max",
      });

      if (json.query?.pages) {
        for (const page of Object.values(json.query.pages) as any[]) {
          if (page.missing !== undefined) continue;
          const cats = (page.categories || []).map((c: any) =>
            c.title.replace("Category:", ""),
          );
          result.set(page.title, cats);
        }
      }
    } catch (e) {
      console.error(
        `  Error fetching categories batch ${i}: ${(e as Error).message}`,
      );
    }
    if (i + 50 < titles.length) await delay(RATE_LIMIT_MS);
  }

  return result;
}

// ─── Wikitext Parsing ───────────────────────────────────────────

/**
 * Extract a simple parameter value from an infobox template in wikitext.
 * Handles the common `| paramName = value` format and strips wiki markup.
 */
function extractParam(wikitext: string, paramName: string): string | undefined {
  const escaped = paramName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\|\\s*${escaped}\\s*=\\s*([^|}\\n]+)`, "i");
  const match = wikitext.match(regex);
  if (!match) return undefined;

  let value = match[1].trim();
  // Strip wiki links: [[link|text]] → text, [[link]] → link
  value = value.replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1");
  // Strip remaining templates
  value = value.replace(/\{\{[^}]*\}\}/g, "");
  // Strip HTML tags
  value = value.replace(/<[^>]*>/g, "");
  // Strip bold/italic markers
  value = value.replace(/'''?/g, "");
  return value.trim() || undefined;
}

/** Parse a Yes/No string to boolean, with a default fallback. */
function parseBoolean(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (!value) return defaultValue;
  const lower = value.toLowerCase().trim();
  if (lower.startsWith("yes") || lower === "true" || lower === "1") return true;
  if (lower.startsWith("no") || lower === "false" || lower === "0")
    return false;
  return defaultValue;
}

/** Parse stackable field (Yes/No/Yes (64)/etc.) to boolean. */
function parseStackable(value: string | undefined): boolean {
  if (!value) return true;
  const lower = value.toLowerCase().trim();
  if (lower.startsWith("no") || lower === "false" || lower === "0")
    return false;
  return true;
}

/**
 * Extract the first Java Edition version this entity was added in.
 * Searches the History section (HistoryLine templates) and infobox.
 */
function extractVersionAdded(wikitext: string): string {
  // Method 1: Find HistoryLine entries with numeric versions.
  // The wiki uses {{HistoryLine||VERSION|...}} for version-specific changes.
  // First grab the Java Edition section if present.
  const javaEdIdx = wikitext.indexOf("Java Edition");
  const searchArea = javaEdIdx !== -1 ? wikitext.slice(javaEdIdx) : wikitext;

  const versionMatch = searchArea.match(
    /\{\{HistoryLine\|\|(\d+\.\d+(?:\.\d+)?)/,
  );
  if (versionMatch) return normalizeVersion(versionMatch[1]);

  // Method 2: Look for HistoryLine with labelled sections like "java indev"
  // which means the item existed since pre-release → treat as 1.0
  if (
    /\{\{HistoryLine\|java\s+(classic|indev|infdev|alpha|beta)/i.test(wikitext)
  ) {
    return "1.0";
  }

  // Method 3: Look for any HistoryLine with a version anywhere on the page
  const anyMatch = wikitext.match(/\{\{HistoryLine\|\|(\d+\.\d+(?:\.\d+)?)/);
  if (anyMatch) return normalizeVersion(anyMatch[1]);

  // Method 4: Look for version in infobox parameters
  for (const param of ["added", "first", "firstver", "version"]) {
    const val = extractParam(wikitext, param);
    if (val) {
      const verMatch = val.match(/(\d+\.\d+(?:\.\d+)?)/);
      if (verMatch) return normalizeVersion(verMatch[1]);
    }
  }

  return "";
}

/**
 * Normalize a version string:
 * - Pre-1.0 versions (0.x) map to "1.0" (existed since first full release)
 * - Simplify to major.minor: "1.16.2" → "1.16"
 */
function normalizeVersion(version: string): string {
  const parts = version.split(".");
  const major = parseInt(parts[0], 10);
  if (major < 1) return "1.0";
  return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : version;
}

/** Check if a page has an item/block/entity infobox template */
function hasInfobox(wikitext: string): boolean {
  return /\{\{Infobox\s+(item|block|entity|biome)/i.test(wikitext);
}

/** Check if wikitext is a redirect page */
function isRedirect(wikitext: string): boolean {
  return /^#REDIRECT/i.test(wikitext.trim());
}

// ─── Entity Classification ──────────────────────────────────────

/** Classify an item/block's type based on its wiki categories and name. */
function classifyEntityType(
  pageCategories: string[],
  isFromBlockSource: boolean,
  itemName: string,
): string {
  const catStr = pageCategories.join("|").toLowerCase();
  const nameLower = itemName.toLowerCase();

  // Name-based checks (most specific)
  if (/sword|crossbow|trident|mace/.test(nameLower)) return "Weapon";
  if (/\bbow\b/.test(nameLower) && !nameLower.includes("bowl")) return "Weapon";
  if (/helmet|chestplate|legging|boots|cap\b|tunic\b/.test(nameLower))
    return "Armor";
  if (/pickaxe|shovel|hoe\b|shears|fishing rod|spyglass/.test(nameLower))
    return "Tool";

  // Category-based checks
  if (catStr.includes("combat")) return "Weapon";
  if (catStr.includes("armor")) return "Armor";
  if (/tool(?:s|$)/i.test(catStr)) return "Tool";
  if (catStr.includes("food") || catStr.includes("foodstuff")) return "Food";
  if (isFromBlockSource) return "Block";
  return "Item";
}

/** Determine mob behavior from wiki categories. */
function determineMobBehavior(pageCategories: string[]): string {
  const catStr = pageCategories.join("|").toLowerCase();
  if (catStr.includes("hostile")) return "Hostile";
  if (catStr.includes("passive")) return "Passive";
  if (catStr.includes("neutral")) return "Neutral";
  return "";
}

/** Determine which dimensions an entity belongs to from categories + infobox. */
function determineDimensions(
  pageCategories: string[],
  wikitext: string,
): string[] {
  const dims = new Set<string>();

  for (const cat of pageCategories) {
    const lower = cat.toLowerCase();
    if (lower.includes("nether")) dims.add("Nether");
    if (
      lower.includes("the end") ||
      lower.includes("end dimension") ||
      lower === "end mobs" ||
      lower === "end blocks"
    )
      dims.add("End");
  }

  // Check infobox for environment/dimension info
  const envParam =
    extractParam(wikitext, "environment") ||
    extractParam(wikitext, "dimension");
  if (envParam) {
    const lower = envParam.toLowerCase();
    if (lower.includes("nether")) dims.add("Nether");
    if (lower.includes("end")) dims.add("End");
    if (lower.includes("overworld")) dims.add("Overworld");
  }

  // Default to Overworld if no other dimensions found
  if (dims.size === 0) dims.add("Overworld");

  return Array.from(dims);
}

// ─── Recipe Extraction ──────────────────────────────────────────

interface RecipeJson {
  itemId: string;
  name: string;
  grid: (string | null)[][];
  shapeless: boolean;
}

/**
 * Extract all crafting recipes from a page's wikitext.
 * Parses {{Crafting templates with A1-C3 grid notation.
 */
function extractCraftingRecipes(
  wikitext: string,
  pageTitle: string,
): RecipeJson[] {
  const recipes: RecipeJson[] = [];
  let searchFrom = 0;

  while (true) {
    const idx = wikitext.indexOf("{{Crafting", searchFrom);
    if (idx === -1) break;

    // Find matching closing braces, tracking nesting depth
    let depth = 0;
    let endIdx = idx;
    for (let i = idx; i < wikitext.length - 1; i++) {
      if (wikitext[i] === "{" && wikitext[i + 1] === "{") {
        depth++;
        i++;
      } else if (wikitext[i] === "}" && wikitext[i + 1] === "}") {
        depth--;
        i++;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }

    const template = wikitext.slice(idx, endIdx + 1);
    searchFrom = endIdx + 1;

    const recipe = parseCraftingTemplate(template, pageTitle);
    if (recipe) recipes.push(recipe);
  }

  return recipes;
}

/** Parse a single {{Crafting template into a RecipeJson. */
function parseCraftingTemplate(
  template: string,
  pageTitle: string,
): RecipeJson | null {
  const grid: (string | null)[][] = [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];

  // Parse A1-C3 named grid parameters
  const cols = ["A", "B", "C"];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const paramName = `${cols[col]}${row + 1}`;
      const regex = new RegExp(`\\|\\s*${paramName}\\s*=\\s*([^|}\\n]*)`, "i");
      const match = template.match(regex);
      if (match) {
        let value = match[1]
          .trim()
          .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1")
          .replace(/\{\{[^}]*\}\}/g, "")
          .trim();
        if (value) {
          grid[row][col] = toId(value);
        }
      }
    }
  }

  // Must have at least one ingredient
  const hasIngredients = grid.some((row) => row.some((cell) => cell !== null));
  if (!hasIngredients) return null;

  // Get output item name
  const outputMatch = template.match(/\|\s*Output\s*=\s*([^|}\\n]+)/i);
  const outputName = outputMatch
    ? outputMatch[1]
        .trim()
        .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1")
        .trim()
    : pageTitle;

  // Check shapeless flag
  const shapeless = /\|\s*shapeless\s*=\s*(true|1|yes)/i.test(template);

  return {
    itemId: toId(outputName),
    name: outputName,
    grid,
    shapeless,
  };
}

/** Convert a display name to an ID: "Diamond Sword" → "diamond_sword" */
function toId(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

/**
 * Convert an ID back to a likely Invicon filename.
 * "diamond_sword" → "Invicon_Diamond_Sword.png"
 */
function idToInviconFile(id: string): string {
  const name = id
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("_");
  return `Invicon_${name}.png`;
}

// ═══════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log("🔨 Craftdle Wiki Data Fetcher v2 (Dynamic)");
  console.log("═".repeat(50));

  // ── Step 1: Discover pages from wiki categories ──

  console.log("\n📂 Discovering entities from wiki categories...");

  console.log("\n  Items:");
  const itemPages = await fetchPagesFromCategories(["Items"], 2);
  console.log(`  → Total item pages: ${itemPages.size}`);

  console.log("\n  Blocks:");
  const blockPages = await fetchPagesFromCategories(["Blocks"], 2);
  console.log(`  → Total block pages: ${blockPages.size}`);

  console.log("\n  Mobs:");
  const mobPages = await fetchPagesFromCategories(["Mobs"], 2);
  console.log(`  → Total mob pages: ${mobPages.size}`);

  console.log("\n  Biomes:");
  const biomePages = await fetchPagesFromCategories(["Biomes"], 2);
  console.log(`  → Total biome pages: ${biomePages.size}`);

  // Combine items + blocks; mobs and biomes handled separately
  const allItemBlockTitles = new Set([...itemPages, ...blockPages]);
  const allTitles = new Set([
    ...allItemBlockTitles,
    ...mobPages,
    ...biomePages,
  ]);

  // ── Step 2: Fetch wikitext and categories for all pages ──

  const allTitleArray = Array.from(allTitles);
  console.log(`\n📄 Fetching wikitext for ${allTitleArray.length} pages...`);
  const wikitexts = await batchFetchWikitext(allTitleArray);
  console.log(`  Got wikitext for ${wikitexts.size} pages`);

  console.log(`\n🏷️  Fetching categories for classification...`);
  const pageCategories = await batchFetchCategories(allTitleArray);
  console.log(`  Got categories for ${pageCategories.size} pages`);

  // ── Step 3: Filter out invalid/unwanted pages ──

  const excludeNamespaces =
    /^(Template|Module|Category|User|Talk|File|MediaWiki|Help):/;

  /** Pages that are meta/concept articles, not actual game items */
  const metaPages = new Set([
    "Item (entity)",
    "Block",
    "Item",
    "Mob",
    "Entity",
    "Biome",
    "Tool",
    "Armor",
    "Food",
    "Weapon",
  ]);

  function isValidGamePage(title: string, wikitext: string): boolean {
    if (excludeNamespaces.test(title)) return false;
    if (/\(disambiguation\)/i.test(title)) return false;
    if (metaPages.has(title)) return false;
    if (isRedirect(wikitext)) return false;

    const cats = pageCategories.get(title) || [];
    const catStr = cats.join("|").toLowerCase();
    if (
      catStr.includes("removed features") ||
      catStr.includes("education edition") ||
      catStr.includes("joke features") ||
      catStr.includes("april fools") ||
      catStr.includes("unimplemented") ||
      catStr.includes("unused")
    )
      return false;

    return true;
  }

  // ── Step 4: Process items and blocks ──

  console.log("\n📦 Processing items and blocks...");

  interface ItemJson {
    id: string;
    name: string;
    type: string;
    dimension: string[];
    stackable: boolean;
    renewable: boolean;
    versionAdded: string;
    textureUrl: string;
    wikiUrl: string;
  }

  const itemsJson: ItemJson[] = [];
  const allRecipes: RecipeJson[] = [];
  const seenRecipeOutputs = new Set<string>();
  const ingredientIdSet = new Set<string>();
  let skippedItems = 0;

  for (const title of allItemBlockTitles) {
    const wikitext = wikitexts.get(title);
    if (!wikitext) continue;
    if (!isValidGamePage(title, wikitext)) continue;
    if (!hasInfobox(wikitext)) continue;

    const cats = pageCategories.get(title) || [];
    const id = toId(title);
    const isBlock = blockPages.has(title);

    const renewable = parseBoolean(extractParam(wikitext, "renewable"), true);
    const stackable = parseStackable(extractParam(wikitext, "stackable"));
    const versionAdded = extractVersionAdded(wikitext);
    const type = classifyEntityType(cats, isBlock, title);
    const dimensions = determineDimensions(cats, wikitext);

    if (!versionAdded) {
      skippedItems++;
      continue;
    }

    itemsJson.push({
      id,
      name: title,
      type,
      dimension: dimensions,
      stackable,
      renewable,
      versionAdded,
      textureUrl: "", // Resolved in step 7
      wikiUrl: `https://minecraft.wiki/w/${encodeURIComponent(title.replace(/ /g, "_"))}`,
    });

    // Extract crafting recipes from this page's wikitext
    const recipes = extractCraftingRecipes(wikitext, title);
    for (const recipe of recipes) {
      if (!seenRecipeOutputs.has(recipe.itemId)) {
        seenRecipeOutputs.add(recipe.itemId);
        allRecipes.push(recipe);
        for (const row of recipe.grid) {
          for (const cell of row) {
            if (cell) ingredientIdSet.add(cell);
          }
        }
      }
    }
  }
  console.log(
    `  Found ${itemsJson.length} valid items/blocks (${skippedItems} skipped — missing versionAdded)`,
  );
  console.log(`  Found ${allRecipes.length} crafting recipes`);

  // ── Step 5: Process mobs ──

  console.log("\n🐾 Processing mobs...");

  interface MobJson {
    id: string;
    name: string;
    type: "Mob";
    dimension: string[];
    behavior: string;
    stackable: false;
    renewable: boolean;
    versionAdded: string;
    textureUrl: string;
    wikiUrl: string;
  }

  const mobsJson: MobJson[] = [];
  let skippedMobs = 0;

  for (const title of mobPages) {
    const wikitext = wikitexts.get(title);
    if (!wikitext) continue;
    if (!isValidGamePage(title, wikitext)) continue;
    if (!hasInfobox(wikitext)) continue;

    const cats = pageCategories.get(title) || [];
    const id = toId(title);

    const behavior = determineMobBehavior(cats);
    if (!behavior) {
      skippedMobs++;
      continue;
    }

    const renewable = parseBoolean(extractParam(wikitext, "renewable"), true);
    const versionAdded = extractVersionAdded(wikitext);
    const dimensions = determineDimensions(cats, wikitext);

    if (!versionAdded) {
      skippedMobs++;
      continue;
    }

    mobsJson.push({
      id,
      name: title,
      type: "Mob",
      dimension: dimensions,
      behavior,
      stackable: false,
      renewable,
      versionAdded,
      textureUrl: "", // Resolved in step 7
      wikiUrl: `https://minecraft.wiki/w/${encodeURIComponent(title.replace(/ /g, "_"))}`,
    });
  }
  console.log(`  Found ${mobsJson.length} valid mobs (${skippedMobs} skipped)`);

  // ── Step 6: Process biomes ──

  console.log("\n🌍 Processing biomes...");

  interface BiomeJson {
    id: string;
    name: string;
    dimension: string[];
    versionAdded: string;
    wikiUrl: string;
  }

  const biomesJson: BiomeJson[] = [];

  for (const title of biomePages) {
    const wikitext = wikitexts.get(title);
    if (!wikitext) continue;
    if (!isValidGamePage(title, wikitext)) continue;

    const cats = pageCategories.get(title) || [];
    const dimensions = determineDimensions(cats, wikitext);
    const versionAdded = extractVersionAdded(wikitext);

    biomesJson.push({
      id: toId(title),
      name: title,
      dimension: dimensions,
      versionAdded: versionAdded || "1.0",
      wikiUrl: `https://minecraft.wiki/w/${encodeURIComponent(title.replace(/ /g, "_"))}`,
    });
  }
  console.log(`  Found ${biomesJson.length} biomes`);

  // ── Step 7: Resolve texture URLs ──

  console.log("\n🖼️  Resolving item/block Invicon URLs...");
  const inviconFiles = itemsJson.map(
    (i) => `Invicon_${i.name.replace(/ /g, "_")}.png`,
  );
  const inviconUrls = await batchGetImageUrls(inviconFiles);
  console.log(
    `  Resolved ${inviconUrls.size}/${inviconFiles.length} Invicon URLs`,
  );

  for (const item of itemsJson) {
    const filename = `Invicon_${item.name.replace(/ /g, "_")}.png`;
    const url = inviconUrls.get(filename);
    item.textureUrl =
      url || `https://minecraft.wiki/w/Special:FilePath/${filename}`;
  }

  console.log("\n🐾 Resolving mob render URLs...");
  let mobTextureCount = 0;
  for (const mob of mobsJson) {
    const searchPrefix = `${mob.name.replace(/ /g, "_")}_JE`;
    const results = await searchImages(searchPrefix, undefined, 5);
    const pngResult = results.find(
      (r) => r.name.endsWith(".png") && !r.name.includes("Sprite"),
    );
    if (pngResult) {
      mob.textureUrl = pngResult.url;
      mobTextureCount++;
    } else {
      // Fallback: try with just the mob name
      const fallback = await searchImages(mob.name, undefined, 5);
      const fbPng = fallback.find(
        (r) =>
          r.name.endsWith(".png") &&
          !r.name.includes("Sprite") &&
          !r.name.includes("Icon"),
      );
      if (fbPng) {
        mob.textureUrl = fbPng.url;
        mobTextureCount++;
      } else {
        mob.textureUrl = `https://minecraft.wiki/w/Special:FilePath/${mob.name.replace(/ /g, "_")}_JE2.png`;
      }
    }
    await delay(150);
  }
  console.log(
    `  Resolved ${mobTextureCount}/${mobsJson.length} mob texture URLs`,
  );

  // ── Step 8: Resolve sound URLs ──

  console.log("\n🔊 Resolving sound URLs...");

  interface SoundJson {
    id: string;
    entityId: string;
    name: string;
    soundFile: string;
    category: string;
  }

  const soundsJson: SoundJson[] = [];

  for (const mob of mobsJson) {
    // Try several search prefixes to find an idle/ambient sound
    const searchPrefixes = [
      `${mob.name} idle`,
      `${mob.name} ambient`,
      `${mob.name}`,
    ];

    let found = false;
    for (const prefix of searchPrefixes) {
      const results = await searchImages(prefix, "audio/ogg", 5);
      const oggResult = results.find((r) => r.name.endsWith(".ogg"));
      if (oggResult) {
        soundsJson.push({
          id: `${mob.id}_sound`,
          entityId: mob.id,
          name: mob.name,
          soundFile: oggResult.url,
          category: "Mob",
        });
        console.log(`  ✓ ${mob.name}: ${oggResult.name}`);
        found = true;
        break;
      }
    }

    if (!found) {
      // Last resort: underscore-separated name
      const altResults = await searchImages(
        mob.name.replace(/ /g, "_"),
        "audio/ogg",
        10,
      );
      const altOgg = altResults.find((r) => r.name.endsWith(".ogg"));
      if (altOgg) {
        soundsJson.push({
          id: `${mob.id}_sound`,
          entityId: mob.id,
          name: mob.name,
          soundFile: altOgg.url,
          category: "Mob",
        });
        console.log(`  ~ ${mob.name}: ${altOgg.name} (fallback)`);
      } else {
        console.log(`  ✗ ${mob.name}: no sound found`);
      }
    }
    await delay(150);
  }
  console.log(`  Found ${soundsJson.length} sounds`);

  // ── Step 9: Build ingredient icons map ──

  console.log("\n🏷️  Building ingredient icons map...");

  // Collect every ID that could be an ingredient (items + recipe cells)
  const allIconIds = new Set<string>();
  for (const item of itemsJson) allIconIds.add(item.id);
  for (const id of ingredientIdSet) allIconIds.add(id);

  const iconFileEntries = Array.from(allIconIds).map((id) => ({
    id,
    file: idToInviconFile(id),
  }));

  const ingredientInviconUrls = await batchGetImageUrls(
    iconFileEntries.map((x) => x.file),
  );

  const ingredientIcons: Record<string, string> = {};
  for (const { id, file } of iconFileEntries) {
    const url = ingredientInviconUrls.get(file);
    ingredientIcons[id] =
      url || `https://minecraft.wiki/w/Special:FilePath/${file}`;
  }
  console.log(
    `  Resolved ${Object.keys(ingredientIcons).length} ingredient icons`,
  );

  // ── Step 10: Write JSON files ──

  const dataDir = path.join(process.cwd(), "server", "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(
    path.join(dataDir, "items.json"),
    JSON.stringify(itemsJson, null, 2),
  );
  fs.writeFileSync(
    path.join(dataDir, "mobs.json"),
    JSON.stringify(mobsJson, null, 2),
  );
  fs.writeFileSync(
    path.join(dataDir, "biomes.json"),
    JSON.stringify(biomesJson, null, 2),
  );
  fs.writeFileSync(
    path.join(dataDir, "recipes.json"),
    JSON.stringify(allRecipes, null, 2),
  );
  fs.writeFileSync(
    path.join(dataDir, "sounds.json"),
    JSON.stringify(soundsJson, null, 2),
  );
  fs.writeFileSync(
    path.join(dataDir, "ingredientIcons.json"),
    JSON.stringify(ingredientIcons, null, 2),
  );

  console.log(`\n${"═".repeat(50)}`);
  console.log(`✅ Generated data files in ${dataDir}:`);
  console.log(`   items.json:            ${itemsJson.length} items/blocks`);
  console.log(`   mobs.json:             ${mobsJson.length} mobs`);
  console.log(`   biomes.json:           ${biomesJson.length} biomes`);
  console.log(`   recipes.json:          ${allRecipes.length} recipes`);
  console.log(`   sounds.json:           ${soundsJson.length} sounds`);
  console.log(
    `   ingredientIcons.json:  ${Object.keys(ingredientIcons).length} icons`,
  );
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
