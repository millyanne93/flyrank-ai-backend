# The Polite Scraper — Books to Scrape

A polite, cache-friendly web scraper that extracts book data from the first three catalogue pages of [Books to Scrape](https://books.toscrape.com) — a public sandbox built for practicing web scraping.

## Target Classification

- **Site:** [Books to Scrape](https://books.toscrape.com) — a public sandbox built specifically for practicing web scraping
- **Scope:** First 3 catalogue pages only (60 books total)
- **Data collected:** Title, product URL, price, availability, rating, description, source page, fetch timestamp
- **robots.txt:** I requested `https://books.toscrape.com/robots.txt` and received a 404 Not Found response. No robots file is present, but this is a public sandbox built for scraping practice.
- **Ethics:** I will not reuse this code on another site without checking its rules and terms first.

## How to Run

```bash
# Clone the repository
git clone https://github.com/millyanne93/flyrank-ai-backend.git
cd flyrank-ai-backend/scraper

# Install dependencies
npm install

# Run the scraper
npm run dev
Dependencies
Node.js 20+

TypeScript — Type safety

Cheerio — HTML parsing

Zod — Schema validation

Record Schema
typescript
{
  title: string;              // Book title
  product_url: string;        // Absolute URL
  price_gbp: number;          // Cleaned price (e.g., 51.77)
  price_text: string;         // Original price text (e.g., "£51.77")
  availability_text: string;  // Availability status
  rating_text: string | null; // Rating (One to Five)
  description: string | null; // Book description
  source_page: string;        // Catalogue page URL
  fetched_at: string;         // ISO timestamp
}
Politeness Rules
User-agent: FlyRankInternshipA9/1.0 (+https://github.com/millyanne93/flyrank-ai-backend)

Delay: 500ms between real network requests

Timeout: 5 seconds per request

Cache: All pages are cached locally; subsequent runs read from cache

Retries: One retry for failed requests (except 404/403)

Error handling: One broken page does not crash the run

Sample Output
books.json (first record)
json
{
  "title": "A Light in the Attic",
  "product_url": "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html",
  "price_gbp": 51.77,
  "price_text": "£51.77",
  "availability_text": "In stock (22 available)",
  "rating_text": "Three",
  "description": "It's hard to imagine a world without ...",
  "source_page": "https://books.toscrape.com/catalogue/page-1.html",
  "fetched_at": "2026-08-10T14:30:00.000Z"
}
run-report.json
json
{
  "start_time": "2026-08-10T14:30:00.000Z",
  "duration_ms": 35234,
  "pages_fetched": 3,
  "cache_hits": 57,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 0
}
Running the Checkpoint
To prove the scraper survives a broken page:

bash
# The code includes a deliberate fake URL for testing
# Uncomment the line in main() and run:
rm -rf cache output
npm run dev

# Confirm: books.json still has 60 records and run-report.json shows failed_pages: 1
Development
bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
