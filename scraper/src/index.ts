import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import * as cheerio from "cheerio";
import { z } from "zod";

// ============================================
// Schema — raw Stage 3
// ============================================

const RawBookSchema = z.object({
  title: z.string(),
  product_url: z.string(),
  price_text: z.string(),
  availability_text: z.string(),
  rating_text: z.string().nullable(),
  description: z.string().nullable(),
  source_page: z.string(),
  fetched_at: z.string(),
});
type RawBook = z.infer<typeof RawBookSchema>;

// Clean schema (Stage 4)
const BookSchema = z.object({
  title: z.string(),
  product_url: z.string().url(),
  price_gbp: z.number().nonnegative(),
  price_text: z.string(),
  availability_text: z.string(),
  rating_text: z.string().nullable(), 
  description: z.string().nullable(),
  source_page: z.string().url(),
  fetched_at: z.string().datetime(),
});
type Book = z.infer<typeof BookSchema>;

// ============================================
// Configuration
// ============================================

const USER_AGENT =
  "FlyRankInternshipA9/1.0 (+https://github.com/millyanne93/flyrank-ai-backend)";
const TIMEOUT_MS = 5000;
const DELAY_MS = 500;
const MAX_PAGES = 3;
const CATALOGUE_URL = "https://books.toscrape.com/catalogue/page-1.html";

// ============================================
// Stage 1: Fetch and Cache (shared by every request in the app)
// ============================================

function getCacheFilePath(url: string): string {
  const filename = url
    .replace(/^https?:\/\//, "")
    .replace(/[^a-zA-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `cache/${filename}.html`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(url: string): Promise<string> {
  console.log(`FETCH ${url}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function getPage(url: string): Promise<string> {
  const cacheFile = getCacheFilePath(url);

  if (existsSync(cacheFile)) {
    console.log(`CACHE HIT ${cacheFile}`);
    return readFileSync(cacheFile, "utf-8");
  }

  const html = await fetchPage(url);
  mkdirSync("cache", { recursive: true });
  writeFileSync(cacheFile, html, "utf-8");
  console.log(`Cached HTML to ${cacheFile}`);
  await sleep(DELAY_MS);
  return html;
}

// ============================================
// Stage 2: Discover All Book URLs
// ============================================

function parseBookUrlsFromCatalogue(html: string, pageUrl: string): string[] {
  const $ = cheerio.load(html);
  const urls: string[] = [];

  $(".product_pod h3 a").each((_, el) => {
    const href = $(el).attr("href");
    if (href) {
      urls.push(new URL(href, pageUrl).href);
    }
  });

  return urls;
}

function getNextPageUrl(html: string, currentUrl: string): string | null {
  const $ = cheerio.load(html);
  const nextLink = $("li.next a").attr("href");
  return nextLink ? new URL(nextLink, currentUrl).href : null;
}

async function discoverAllBookUrls(): Promise<Map<string, string>> {
  console.log("\n=== Stage 2: Discovering Book URLs ===\n");

  const bookUrlToSourcePage = new Map<string, string>();
  let currentUrl: string | null = CATALOGUE_URL;
  let pageNum = 0;
  let totalFound = 0;

  while (currentUrl && pageNum < MAX_PAGES) {
    pageNum++;
    console.log(`\nPage ${pageNum}: ${currentUrl}`);

    const html = await getPage(currentUrl);
    const urls = parseBookUrlsFromCatalogue(html, currentUrl);
    totalFound += urls.length;

    for (const url of urls) {
      if (!bookUrlToSourcePage.has(url)) {
        bookUrlToSourcePage.set(url, currentUrl);
      }
    }

    console.log(`  Found ${urls.length} books on this page`);
    currentUrl = getNextPageUrl(html, currentUrl);
  }

  console.log(`\n=== Discovery Summary ===`);
  console.log(`catalogue_pages=${pageNum}`);
  console.log(`discovered=${totalFound}`);
  console.log(`unique_urls=${bookUrlToSourcePage.size}`);

  return bookUrlToSourcePage;
}

// ============================================
// Stage 3: Extract Raw Book Details
// ============================================

function parseBookDetails(html: string, url: string, sourcePage: string): RawBook {
  const $ = cheerio.load(html);
  const product = $(".product_page"); 

  const title = product.find("h1").first().text().trim();
  const priceText = product.find(".product_main .price_color").first().text().trim();

  const availabilityText = product
    .find(".instock.availability")
    .first()
    .text()
    .trim()
    .replace(/\s+/g, " ");

  let ratingText: string | null = null;
  const ratingClass = product.find("p.star-rating").attr("class");
  if (ratingClass) {
    ratingText = ratingClass.split(" ").find((c) => c !== "star-rating") ?? null;
  }

  const descriptionEl = product.find("#product_description + p");
  const description = descriptionEl.length ? descriptionEl.text().trim() || null : null;

  const record: RawBook = {
    title,
    product_url: url,
    price_text: priceText,
    availability_text: availabilityText,
    rating_text: ratingText,
    description,
    source_page: sourcePage,
    fetched_at: new Date().toISOString(),
  };

  return RawBookSchema.parse(record); 
}

async function extractAllBookDetails(
  bookUrlToSourcePage: Map<string, string>
): Promise<RawBook[]> {
  console.log("\n=== Stage 3: Extracting Book Details ===\n");
  console.log(`Total books to process: ${bookUrlToSourcePage.size}\n`);

  const rawRecords: RawBook[] = [];
  let i = 0;

  for (const [url, sourcePage] of bookUrlToSourcePage) {
    i++;
    console.log(`[${i}/${bookUrlToSourcePage.size}] ${url}`);

    const html = await getPage(url);
    const record = parseBookDetails(html, url, sourcePage);
    rawRecords.push(record);

    if (i === 1) {
      console.log("\n  Sample record (first book):");
      console.log(JSON.stringify(record, null, 2));
    }
  }

  return rawRecords;
}

// ============================================
// Stage 4: Clean, Validate, Store
// ============================================

function cleanPrice(priceText: string): number | null {
  if (!priceText) return null;
  const cleaned = priceText.replace(/[^0-9.]/g, "");
  const value = parseFloat(cleaned);
  return isNaN(value) ? null : value;
}

function transformToCleanBook(raw: RawBook): unknown {
  return {
    title: raw.title,
    product_url: raw.product_url,
    price_gbp: cleanPrice(raw.price_text),
    price_text: raw.price_text,
    availability_text: raw.availability_text,
    rating_text: raw.rating_text, 
    description: raw.description,
    source_page: raw.source_page,
    fetched_at: raw.fetched_at,
  };
}

async function processAndStoreRecords(rawRecords: RawBook[]): Promise<void> {
  console.log("\n=== Stage 4: Cleaning and Validating Records ===\n");

  const validRecords: Book[] = [];
  const invalidRecords: any[] = [];

  for (let i = 0; i < rawRecords.length; i++) {
    const raw = rawRecords[i];
    const transformed = transformToCleanBook(raw);

    try {
      const validated = BookSchema.parse(transformed);
      validRecords.push(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        invalidRecords.push({
          record_index: i,
          url: raw.product_url,
          errors: error.errors,
        });
      } else {
        invalidRecords.push({
          record_index: i,
          url: raw.product_url,
          error: String(error),
        });
      }
      console.log(`  Validation failed for record ${i + 1}: ${raw.product_url}`);
    }
  }

  mkdirSync("output", { recursive: true });

  const booksPath = "output/books.json";
  writeFileSync(booksPath, JSON.stringify(validRecords, null, 2));
  console.log(` ${validRecords.length} valid records saved to ${booksPath}`);

  const errorsPath = "output/errors.json";
  writeFileSync(errorsPath, JSON.stringify(invalidRecords, null, 2));
  if (invalidRecords.length > 0) {
    console.log(` ${invalidRecords.length} invalid records saved to ${errorsPath}`);
  } else {
    console.log(` 0 invalid records — ${errorsPath} written as empty array`);
  }

  console.log(`\n=== Stage 4 Summary ===`);
  console.log(`Valid records: ${validRecords.length}`);
  console.log(`Invalid records: ${invalidRecords.length}`);
}

// ============================================
// Main
// ============================================

async function main(): Promise<void> {
  try {
    const bookUrlToSourcePage = await discoverAllBookUrls();

    if (bookUrlToSourcePage.size === 0) {
      console.error("No book URLs found. Exiting.");
      process.exit(1);
    }

    const rawRecords = await extractAllBookDetails(bookUrlToSourcePage);
    await processAndStoreRecords(rawRecords);

    console.log("\n Scraper completed successfully!");
  } catch (error) {
    console.error("Scraper failed:", error);
    process.exit(1);
  }
}

main();
