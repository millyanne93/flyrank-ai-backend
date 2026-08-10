# The Polite Scraper — Books to Scrape

## Target Classification

- **Site:** [Books to Scrape](https://books.toscrape.com) — a public sandbox built specifically for practicing web scraping
- **Scope:** First 3 catalogue pages only (60 books total)
- **Data collected:** Title, product URL, price, availability, rating, description, source page, fetch timestamp
- **robots.txt:** I requested `https://books.toscrape.com/robots.txt` and received a 404 Not Found response. No robots file is present, but this is a public sandbox built for scraping practice.
- **Ethics:** I will not reuse this code on another site without checking its rules and terms first.

## How to Run

```bash
# Install dependencies
npm install

# Run the scraper
npm run dev
