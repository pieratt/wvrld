# WVRLD — Seed‑Size Build Plan (v1.0)

*(self‑contained hyper‑doc for Cursor*

---

## 0 · Core Concepts

**Bucket per URL** · Each route like `/alice` is a “bucket” that owns everything posted there.
**Inline commands** · Adding `/edit` to a route flips that page into edit mode.
**One prompt field** · Users paste a list title (optional) + any URLs—nothing else.
**High‑trust alpha** · One shared admin login; formal auth later.
**Data once, display many** · Every distinct link is stored once; posts just reference it.

---

## 1 · Tech Stack

Next.js (app router) · React · TypeScript · Tailwind · Prisma ORM · SQLite➜Postgres · Vercel (edge + cron) · Cursor (AI pair).

---

## 2 · Routes & Commands

```
/                    → front feed  (Anonymous bucket, userId 2)
/[slug]              → bucket feed (slug owns content)
/[slug]/edit         → edit bucket (update title, description, colors)
/[slug]/[postId]     → single post view (numeric id)
/[slug]/[postId]/edit→ edit that post (prompt pre‑filled with existing title + URLs)
```

`slug` must match `^[a-z0-9_-]{1,32}$` and cannot be `api`, `static`, etc.

---

## 3 · Database Schema  *(copy into `prisma/schema.prisma`)*

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"              // swap to postgresql later
  url      = "file:./dev.db"
}

enum MetadataStatus {
  PENDING
  SUCCESS
  FAILED
}

model User {
  id          Int       @id @default(autoincrement())
  username    String    @unique                      // bucket slug
  title       String?                               // bucket headline
  description String?
  image1      String?
  image2      String?
  color1      String
  color2      String
  type        String?                               // reserve for "system"
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  posts       Post[]
  prompts     Prompt[]

  @@index([username])
}

model Prompt {
  id        Int      @id @default(autoincrement())
  rawText   String                               // full text user typed
  userId    Int                                  // bucket owner
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id])
  post      Post?
}

model Post {
  id        Int       @id @default(autoincrement())
  ownerId   Int                                       // same as bucket user
  promptId  Int?      @unique
  title     String?                                   // optional first line
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  owner     User      @relation(fields: [ownerId], references: [id])
  prompt    Prompt?   @relation(fields: [promptId], references: [id])
  urls      PostURL[]

  @@index([ownerId])
  @@index([createdAt])
}

model URL {
  id             Int            @id @default(autoincrement())
  url            String         @unique                  // canonical form
  domain         String?                                 // youtube.com, etc.
  title          String?
  description    String?
  image1         String?
  saves          Int            @default(0)
  clicks         Int            @default(0)
  metadataStatus MetadataStatus @default(PENDING)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  posts          PostURL[]

  @@index([domain])
  @@index([createdAt])
}

model PostURL {
  id      Int  @id @default(autoincrement())
  postId  Int
  urlId   Int
  order   Int?
  comment String?

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  url  URL  @relation(fields: [urlId], references: [id], onDelete: Cascade)

  @@unique([postId, urlId])
  @@index([postId])
  @@index([urlId])
}
```

Reserve **User 2** as `Anonymous` for front‑page posts.
Canonicalise every link (strip protocol, lower‑case host, drop UTM) before hitting the `URL` table.

---

## 4 · Prompt Format & Parsing

Example:

```
My playlist for Spring
https://bandcamp.com/album1
https://soundcloud.com/track/abc
```

* First non‑URL line ➜ `title`.
* Remaining valid URLs become an ordered list.
* Raw text is stored intact for audit/debug.

### parsePrompt(rawText) → `{ title?, urls[] }`

*URLs validated via `new URL()`. Invalid lines are ignored.*

---

## 5 · Ingestion & Editing Pipeline

1. **Input** `{ rawText, slug, editing?: { type: 'user'|'post', id?: number } }`.
2. **Bucket** — find or create `User` where `username = slug`.
3. **Parse** — call `parsePrompt`. (see §4)
4. **Branch**

   * **Create mode**
     • insert Prompt → Post (with title) → upsert URLs → join via PostURL.
   * **Edit mode**
     • if `type = 'user'` → update profile fields.
     • if `type = 'post'` → overwrite Post.title, reconcile URL set (add/remove/re‑order).
5. **Return** IDs so frontend can redirect.
6. **Background worker** picks up URLs where `metadataStatus = PENDING`, fetches OpenGraph, updates row and flips status.

---

## 6 · Frontend Views

* **Front /** — masonry feed of all URLs (grouped by domain, colored by bucket).
* **Bucket /\[slug]** — same grid but scoped to one user.
* **Edit bucket /\[slug]/edit** — inline form for profile fields.
* **Post /\[slug]/\[id]** — shows title + list of URLs.
* **Edit post /\[slug]/\[id]/edit** — prompt pre‑filled; changes auto‑save.
* **Saved /saved** — client‑side bookmarks (localStorage).

---

## 7 · Incremental Roadmap

*(Each step is sized to fit inside a single Cursor chat.*  *Reference section numbers like “see §3” for details.)*

### Step 0 – Repo & Tooling

* `git init` and install Node LTS.
* Add eslint + prettier config.

### Step 1 – Project Scaffold *(see §1 & §3)*

1. `npx create-next-app@latest wvrld --typescript --tailwind`
2. Add Prisma + `dev.db`; paste schema (§3); run `prisma migrate dev --name init`.
3. Seed script with three buckets and six sample posts.

### Step 2 – Static UI Mock *(see §6)*

* Hard‑code sample JSON and build front page masonry + bucket page.
* No data fetch yet—prove layout & colors.

### Step 3 – Parser & Tests *(see §4)*

* Implement `parsePrompt` in `/lib/parsePrompt.ts`.
* Jest unit tests: title‑only, urls‑only, mixed, malformed URL.

### Step 4 – Create Ingest API *(see §5 create branch)*

* `/api/ingest` endpoint that commits new Prompt + Post + URLs.
* Integration test posts a sample prompt and asserts DB rows.

### Step 5 – Live Data Render

* Replace mock JSON with SWR fetches from the DB.
* Enable anonymous front‑page posting (bucket = userId 2).

### Step 6 – Edit Routes *(see §2 & §5 edit branch)*

* Detect `/edit` suffix; toggle edit UI.
* Submit updates through `/api/ingest` with `editing` flag.
* Integration test: load, edit, save, verify row update.

### Step 7 – Metadata Worker

* Vercel edge/cron job: query `PENDING` URLs, fetch OpenGraph, update row.

### Step 8 – Filters & Bookmarks

* Domain pills + bucket pills (disable when empty).
* LocalStorage save/unsave with optimistic UI.

*(Future backlog: pagination, favicon proxy, click analytics, proper auth.)*

---

## 8 · Quality Gates

* **Unit** • parser + utility functions.
* **Integration** • ingest API in create & edit modes.
* **E2E smoke** • seed → create post → edit post → metadata fetch → front page render.
* CI runs gates before every Vercel push.

---

*Commit early, keep chats small, and let Cursor handle one numbered step at a time.*

——————————

Work accomplished to date:

✅ Stage 1 work completed:
🏗️ Foundation Setup
Node.js 24.1.0 installed via Homebrew
Next.js 15 with App Router
TypeScript configuration
Tailwind CSS for styling
ESLint for code quality
🗄️ Database & ORM
Prisma ORM configured with SQLite
Comprehensive schema matching your WVRLD plan:
User (bucket owners with colors/metadata)
Prompt (raw user input)
Post (processed posts with titles)
URL (canonical URLs with metadata)
PostURL (many-to-many relationships)
🌱 Sample Data
Database seeded with realistic test data
Anonymous user (User 2) for front-page posts
Sample buckets: Alice & Bob with different themes
Various URLs with metadata
Working post → URL relationships
📁 Project Structure
Clean, organized codebase
Comprehensive README documentation
Git repository initialized and connected to GitHub
All files committed and ready for development

✅ Stage 2:
🎨 Core Components
URLCard: Beautiful cards with gradient backgrounds, favicons, and metadata
MasonryGrid: Responsive Pinterest-style layout (1-4 columns based on screen size)
Header: Dynamic header with bucket colors, logo, and navigation
📱 Pages
Front Feed (/): Shows all URLs from all buckets in masonry layout
Bucket Pages (/[slug]): Individual user buckets with filtered content
Try: /alice, /bob, /anonymous
🎯 Key Features
Dynamic Colors: Each bucket has unique gradient backgrounds
Responsive Design: Works beautifully on all screen sizes
Rich Metadata: Shows saves, clicks, domains, and descriptions
Realistic Data: 10 sample URLs across 4 users with authentic content
🚀 Live Preview
The development server is running at http://localhost:3000
Test these routes:
/ - Front feed with all URLs
/alice - Alice's design bucket
/bob - Bob's dev tools bucket
/anonymous - Anonymous bucket
🎨 Visual Highlights
Beautiful gradient cards with owner colors
Smooth hover effects and transitions
Clean typography and spacing
Professional favicon integration
Balanced masonry layout

✅ Step 3: Parser & Tests - COMPLETE!
I've successfully implemented and thoroughly tested the parsePrompt function with comprehensive unit tests. Here's what we accomplished:
🎯 Core Implementation
parsePrompt function in src/lib/parsePrompt.ts
Robust URL validation (only allows http, https, ftp, ftps protocols)
Smart URL canonicalization with:
Lowercase hostnames
Tracking parameter removal (utm_, fbclid, gclid, etc.)
HTTP→HTTPS upgrade for common domains
Proper trailing slash handling
🧪 Comprehensive Test Suite
22 passing tests covering all scenarios from the plan:
✅ Title-only scenarios
✅ URLs-only scenarios
✅ Mixed title and URLs
✅ Malformed URL handling
✅ URL canonicalization edge cases
✅ Edge cases and error handling
🔧 Testing Infrastructure
Jest configured with Next.js integration
TypeScript support for tests
Clean test scripts (npm test, npm run test:watch)
No configuration warnings - everything runs smoothly
🎨 Key Features Validated
Extracts first non-URL line as title
Preserves URL order
Ignores invalid URLs and malformed input
Handles whitespace and edge cases gracefully
Canonicalizes URLs for consistent storage

✅ Step 4: Create Ingest API - Complete! 
I've successfully implemented the /api/ingest endpoint with comprehensive functionality:
Key Features Implemented:
🔄 Dual Mode Operation:
Create Mode: Creates new posts with prompts and URLs
Edit Mode: Updates user profiles or existing posts
👤 User Management:
Auto-creates users if they don't exist
Validates slug format (lowercase alphanumeric + hyphens)
Protects reserved slugs (api, admin, www, etc.)
Generates random gradient colors for new users
📝 Content Processing:
Integrates with the parsePrompt function from Step 3
Handles title extraction and URL parsing
Supports title-only, URLs-only, or mixed content
Smart URL canonicalization and domain extraction
🔗 URL Management:
Upserts URLs to avoid duplicates
Creates PostURL relationships
Handles URL updates during post editing
🛡️ Security & Validation:
Validates user ownership for post editing
Comprehensive input validation
Graceful error handling with proper HTTP status codes
🧪 Comprehensive Test Suite:
10 passing integration tests
Tests both create and edit modes
Validates error handling and security
Mocks Prisma for isolated testing

✅ Step 5: Live Data Render - Complete! ✅
Amazing progress! I've successfully implemented live data rendering with real database integration. Here's what was accomplished:
Key Features Implemented:
🗄️ Database Integration:
Set up Prisma with SQLite database
Created comprehensive seed script with sample data
Anonymous user (userId 2) for front-page posts as specified
🔌 API Endpoints:
/api/urls - Fetches all URLs with post/owner data, supports bucket filtering
/api/users/[username] - User profiles with calculated stats (posts, URLs, domains)
Both endpoints return properly structured data with error handling
⚡ Frontend Data Fetching:
Replaced mock data with SWR for efficient data fetching
Updated HomePage and BucketPage to use real API data
Added loading states with skeleton UI
Comprehensive error handling with user-friendly messages
🎨 UI Enhancements:
Updated URLCard component to work with real data types
Maintained gradient styling based on bucket owner colors
Real favicon fetching and domain display
Proper stats display (saves, clicks, post counts)
🧪 Quality Assurance:
All 32 tests still passing
Database properly seeded with diverse sample content
APIs tested and returning correct data structure
Sample Data Created:
4 Users: Anonymous (system), Alice (design), Bob (dev), Charlie (music)
6 Posts: Mix of titled and URL-only posts
16 URLs: Across various domains with proper metadata
Real Stats: Calculated post counts, URL counts, unique domains

Ready to move on to Step 6