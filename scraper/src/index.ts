import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

const TARGET_URL =
  "https://books.toscrape.com/catalogue/page-1.html";

const CACHE_FILE = "cache/catalogue-page-1.html";

const USER_AGENT =
  "FlyRankInternshipA9/1.0 (+https://github.com/millyanne93/flyrank-ai-backend)";

const TIMEOUT_MS = 5000;

async function fetchPage(): Promise<string> {
  console.log(`FETCH ${TARGET_URL}`);

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);

  try {
    const response = await fetch(TARGET_URL, {
      headers: {
        "User-Agent": USER_AGENT,
      },
      signal: controller.signal,
    });

    if (response.status !== 200) {
      throw new Error(
        `Fetch failed: HTTP ${response.status} ${response.statusText}`
      );
    }

    const html = await response.text();

    return html;
  } finally {
    clearTimeout(timeout);
  }
}

async function getPage(): Promise<string> {
  mkdirSync("cache", { recursive: true });

  if (existsSync(CACHE_FILE)) {
    console.log(`CACHE HIT ${CACHE_FILE}`);

    return readFileSync(CACHE_FILE, "utf-8");
  }

  const html = await fetchPage();

  writeFileSync(CACHE_FILE, html, "utf-8");

  console.log(`Cached HTML to ${CACHE_FILE}`);

  return html;
}

async function main(): Promise<void> {
  try {
    const html = await getPage();

    console.log(`Response size: ${html.length} bytes`);
  } catch (error) {
    console.error("Scraper failed:", error);
    process.exit(1);
  }
}

main();
