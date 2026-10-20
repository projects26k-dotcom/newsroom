# Newsroom — Live News Wire

A clean, minimal, and authoritative personal news website built with **Next.js 14+ (App Router)**, **TypeScript**, and **Tailwind CSS**. It streams real-time headlines and stories directly from **Google News RSS** with zero database, zero logins, and zero API keys required.

## Key Architectural Principles

- **Zero Fake News Fallbacks**: If feeds fail, an honest, transparent editorial notice is shown. No fake or hardcoded news is ever shown.
- **Dynamic Server-Side Ingestion**: Calls Google News RSS strictly on the server—never from the browser—with Next.js cache revalidation (`revalidate = 300`).
- **Parallel Resilient Fetching**: Queries multiple Google News RSS feeds in parallel using `Promise.allSettled`, gracefully skipping any feed that fails.
- **Intelligent Google News Parsing**:
  - Automatically strips `" - <Source>"` suffix from titles and uses the `<source>` tag for accurate publisher attribution.
  - Parses `<description>` HTML with Cheerio to extract up to 3 related articles with links and source tags as "More coverage".
  - Directly uses Google redirect URLs with `target="_blank" rel="noopener noreferrer"`.
  - Converts publication dates to readable relative time ("12m ago", "1h ago").
  - Deterministic editorial gradient placeholders with source monograms for cards.
- **Section Desks & Source Filtering**:
  - Categories: India, Hindi, World, Business, Technology, Sports, Entertainment, Science, Health.
  - Source Channels: Aaj Tak, ABP, News24, NDTV, BBC, The Hindu.
- **Client-Side Progressive Reading**: Displays 24 articles initially and allows reading more via a snappy "Load more" button without making redundant network queries.

## Project Structure

```
├── lib/
│   ├── feeds.ts         # Google News RSS feed configurations
│   └── news.ts          # Server-only RSS parser, Cheerio coverage extraction & deduplication
├── src/
│   ├── app/
│   │   ├── page.tsx            # Front page (India Top Stories)
│   │   ├── category/[slug]/    # Category desk routes (World, Tech, Business, etc.)
│   │   ├── source/[slug]/      # Source channel routes (Aaj Tak, NDTV, BBC, etc.)
│   │   ├── search/             # Google News RSS live search
│   │   ├── loading.tsx         # Skeleton loading states
│   │   └── layout.tsx          # Root layout & Newsroom masthead
│   └── components/
│       ├── ArticleCard.tsx     # Editorial card with gradient monogram & More Coverage
│       ├── ArticleList.tsx     # 24-article initial display with Load More
│       ├── CategoryNav.tsx     # Category tabs & source filters
│       └── Header.tsx / Footer.tsx
```

## Running Locally

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

Deploy directly to Vercel with zero configuration required.
