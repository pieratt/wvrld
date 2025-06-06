# WVRLD — Seed‑Size Build Plan (v1.0)

*(self‑contained hyper‑doc for Cursor*

---

## 0 · Core Concepts

**Bucket per URL** · Each route like `/alice` is a "bucket" that owns everything posted there.
**Inline commands** · Adding `/edit` to a route flips that page into edit mode.
**One prompt field** · Users paste a list title (optional) + any URLs—nothing else.
**High‑trust alpha** · One shared admin login; formal auth later.
**Data once, display many** · Every distinct link is stored once; posts just reference it.

---

## 1 · Tech Stack

Next.js (app router) · React · TypeScript · Tailwind · Prisma ORM · SQLite➜Postgres · Vercel (edge + cron) · Cursor (AI pair).

---

## 2 · Routes & Commands

```
/                    → front feed  (Anonymous bucket, userId 2)
/[slug]              → bucket feed (slug owns content)
/[slug]/edit         → edit bucket (update title, description, colors)
/[slug]/[postId]     → single post view (numeric id)
/[slug]/[postId]/edit→ edit that post (prompt pre‑filled with existing title + URLs)
```

`slug` must match `^[a-z0-9_-]{1,32}$` and cannot be `api`, `static`, etc.

---

## 3 · Database Schema  *(copy into `prisma/schema.prisma`)*

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

Reserve **User 2** as `Anonymous` for front‑page posts.
Canonicalise every link (strip protocol, lower‑case host, drop UTM) before hitting the `URL` table.

---

## 4 · Prompt Format & Parsing

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

## 5 · Ingestion & Editing Pipeline

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

## 6 · Frontend Views

* **Front /** — masonry feed of all URLs (grouped by domain, colored by bucket).
* **Bucket /\[slug]** — same grid but scoped to one user.
* **Edit bucket /\[slug]/edit** — inline form for profile fields.
* **Post /\[slug]/\[id]** — shows title + list of URLs.
* **Edit post /\[slug]/\[id]/edit** — prompt pre‑filled; changes auto‑save.
* **Saved /saved** — client‑side bookmarks (localStorage).

---

## 7 · Incremental Roadmap

*(Each step is sized to fit inside a single Cursor chat.*  *Reference section numbers like "see §3" for details.)*

### Step 0 – Repo & Tooling

* `git init` and install Node LTS.
* Add eslint + prettier config.

### Step 1 – Project Scaffold *(see §1 & §3)*

1. `npx create-next-app@latest wvrld --typescript --tailwind`
2. Add Prisma + `dev.db`; paste schema (§3); run `prisma migrate dev --name init`.
3. Seed script with three buckets and six sample posts.

### Step 2 – Static UI Mock *(see §6)*

* Hard‑code sample JSON and build front page masonry + bucket page.
* No data fetch yet—prove layout & colors.

### Step 3 – Parser & Tests *(see §4)*

* Implement `parsePrompt` in `/lib/parsePrompt.ts`.
* Jest unit tests: title‑only, urls‑only, mixed, malformed URL.

### Step 4 – Create Ingest API *(see §5 create branch)*

* `/api/ingest` endpoint that commits new Prompt + Post + URLs.
* Integration test posts a sample prompt and asserts DB rows.

### Step 5 – Live Data Render

* Replace mock JSON with SWR fetches from the DB.
* Enable anonymous front‑page posting (bucket = userId 2).

### Step 6 – Edit Routes *(see §2 & §5 edit branch)*

* Detect `/edit` suffix; toggle edit UI.
* Submit updates through `/api/ingest` with `editing` flag.
* Integration test: load, edit, save, verify row update.

### Step 7 – Metadata Worker

* Vercel edge/cron job: query `PENDING` URLs, fetch OpenGraph, update row.

### Step 8 – Filters & Bookmarks

* Domain pills + bucket pills (disable when empty).
* LocalStorage save/unsave with optimistic UI.


## 8 · Quality Gates
* **Unit** • parser + utility functions.
* **Integration** • ingest API in create & edit modes.
* **E2E smoke** • seed → create post → edit post → metadata fetch → front page render.
* CI runs gates before every Vercel push.
### frankly I'm not sure where these quality gates were/are supposed to fit in ###

----------

Stage 9 – Filters & Controlled-Chaos UI (final)
Every bullet fits a Cursor session; keep naming exactly so tests don’t break.

9.0 Seed sanity + color helpers
System user fix — insert User 1 (system) with neutral #eeeeee/#111111.

Color fallback — if any user is missing color1 || color2, borrow both from User 2 (Anonymous).

/lib/palette.ts

ts
Copy
Edit
export function palette({
  cardOwner,        // canonical owner of merged post or page owner
  isFront,          // true on root “/”
  pageOwner,        // user whose profile we’re on (undefined on front)
}: {
  cardOwner: User
  isFront: boolean
  pageOwner?: User
}) {
  const base = isFront ? getUser(1) : pageOwner ?? cardOwner
  const c1 = base.color1 ?? getUser(2).color1
  const c2 = base.color2 ?? getUser(2).color2
  return { bg: c1, fg: pickLegible(c1), pill: c2 }
}
9.1 DomainFilterBar
Location /components/DomainFilterBar.tsx.

Input domains: { domain: string; count: number }[] (already sorted high→low).

Render top 10 items; if fewer than 10 present, just show what exists.

Multi-toggle: clicking a pill toggles its presence in a Set<string> held in context; active pills have full opacity; inactive pills fade (opacity-30).

Sync selection to the URL as ?tlds=amazon.com,reddit.com (comma-sep, no spaces).

Default = empty set ⇒ show everything.

Disabled pill (count === 0) → pointer-events-none + opacity-15.

9.2 FeedFilters context
typescript
Copy
Edit
/contexts/FeedFilters.tsx
export const FeedFilters = createContext<{
  tlds: Set<string>
  toggleTld: (d: string) => void
}>(…)
Reads query string on mount; writes back on change with router.replace (shallow = true).

Expose hook useFilters() for convenience.

9.3 EditorPill
Base state always uses the surrounding page’s palette (so a profile page feels 100 % “in-brand”).

On hover, pill background instantly flips to the editor’s own color1/color2 gradient (transition-none so it feels like a reveal).

Click → router.push('/' + username).

If user.type === 'editor', add subtle after:content-['✎'] after:ml-1.

9.4 Post grouping hook
bash
Copy
Edit
/hooks/useGroupedPosts.ts
Merge rule → slugify(title) === slugify(other.title) using lowerCase(title.trim()).

Return array:

ts
Copy
Edit
type GroupedPost = {
  title: string
  canonicalOwner: User   // first poster
  posts: Post[]          // all contributors incl. canonical
}
Memoize result; invalidate whenever raw feed changes.

9.5 PostCard v2
Chrome (border, header bg) → palette({ cardOwner: canonicalOwner, isFront, pageOwner }).

Inside: for each contributing post, render its URLs list.

Prefix each URL item with a 24×24 avatar square tinted with that contributor’s color1.

“See All” → /[canonicalOwner.username]/[postId] where postId = first post in group.

9.6 Filter wiring
Page component:

ts
Copy
Edit
const { tlds } = useFilters()
const grouped = useGroupedPosts()
               .filter(g => !tlds.size ||
                            g.posts.some(p =>
                              p.urls.some(u => tlds.has(u.domain))))
After filter, map →

ts
Copy
Edit
<Masonry>
  {grouped.map(g => <PostCard key={g.title} data={g} />)}
</Masonry>
9.7 Front-page theming pass
In layout.tsx, grab palette({cardOwner: getUser(1), isFront:true}) once.

Apply to <body> background + default text color.

Sticky nav, headings, any other chrome stay in system palette so chaos is local to cards.

9.8 Responsiveness & tests
Cypress viewport ≥ 1280: domain pills stack vertically left; <1280 → horizontal scroll under nav.

Unit tests

useGroupedPosts merges titles and picks canonical owner.

palette returns Anonymous colors when owner missing.

E2E smoke: toggle two TLD pills, URL query updates, feed length shrinks accordingly, reload preserves state.

8.9 (Option) mark-editor CLI
Script yarn mark-editor pieratt → flips User.type between null and 'editor'.










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

✅ Step 6: Key Features Implemented:
Bucket Edit Pages (/[slug]/edit)
Edit bucket title and description
Form pre-filled with existing data
Proper validation and error handling
Redirects back to bucket after save
Post View & Edit Pages (/[slug]/[postId] & /[slug]/[postId]/edit)
Single post view with URLs and metadata
Edit post with prompt pre-filled
Support for title + URL editing
Breadcrumb navigation
API Enhancements
/api/posts/[postId] endpoint for fetching individual posts
Enhanced /api/ingest with user profile editing
Proper title/description parsing for user profiles
Security: post ownership validation
UI/UX Improvements
Edit buttons on bucket and post pages
Clickable URL cards that link to post view
Consistent styling and navigation
Loading states and error handling
Comprehensive Testing
8 new integration tests for edit functionality
Tests for user editing, post editing, validation
All 40 tests passing 🎯
Proper Prisma mocking setup
AddURLModal Component (src/components/AddURLModal.tsx):
Modal form with textarea for entering content
Supports the same format as your plan: first line = title (optional), following lines = URLs
Submits to your existing /api/ingest endpoint
Handles success/error states with proper UI feedback
Redirects to new post after creation (or refreshes page for anonymous posts)
Updated Header Component (src/components/Header.tsx):
Added state management for modal visibility
Connected "Add URLs" button to open the modal
Passes correct bucket slug to the modal

✅ Step 7: Metadata Worker - COMPLETE! ✅
I've successfully implemented the complete metadata worker system as specified in the plan:

🔧 Core Implementation:
/api/metadata API endpoint with POST and GET methods
POST: Processes PENDING URLs, fetches OpenGraph data, updates database
GET: Returns metadata statistics (pending, successful, failed counts)
Comprehensive OpenGraph data extraction with fallbacks to Twitter metadata
Handles relative image URLs by converting to absolute URLs
Graceful error handling with proper status updates

🤖 Background Processing:
Processes up to 10 URLs per batch to avoid overwhelming external services
100ms delay between requests to be respectful to external services
Marks URLs as SUCCESS or FAILED based on processing results
Preserves original URL if metadata fetching fails

⏰ Vercel Cron Job Configuration:
vercel.json configured with cron job running every 10 minutes
Automatically triggers metadata processing for PENDING URLs
Production-ready for Vercel deployment

🧪 Comprehensive Test Suite:
8 detailed test cases covering all scenarios:
✅ Successful OpenGraph processing
✅ Failure handling and FAILED status marking
✅ Empty queue handling
✅ Missing metadata graceful handling
✅ Database error handling
✅ Twitter metadata fallback
✅ Statistics endpoint testing
✅ Error scenarios for stats endpoint

🗄️ Database Integration:
Updated seed script to include both SUCCESS and PENDING URLs
Real-world testing with actual websites
Proper MetadataStatus enum usage throughout
Statistics tracking for monitoring

🚀 Live Testing Results:
✅ Processed 7 PENDING URLs: 6 successful, 1 failed
✅ New URLs automatically marked as PENDING when added
✅ Worker successfully processes new URLs on subsequent runs
✅ Statistics endpoint provides real-time monitoring
✅ Integration with existing ingest API confirmed working

🎯 Production Features:
Timeout protection (5 seconds per URL)
Batch processing limits
Comprehensive logging for debugging
Error recovery and status tracking
Ready for Vercel cron job deployment

✅ Stage 8 - Saved URLs System (COMPLETE!)
🔖 Save Functionality
useSavedURLs Hook: localStorage-based persistence with optimistic UI updates
SavedURLsProvider Context: Global state management across the app
API Endpoint: /api/urls/save for incrementing/decrementing database save counts
URLCard Updates: Save button showing "X saved" count, red color when saved
Saved Page: /saved route to view all bookmarked URLs
Header Integration: "Saved" link with count badge in navigation
✅ Stage 9 - Advanced Filtering & UI (COMPLETE!)
9.0 - Foundation Setup ✅
System User: Added User 1 with neutral colors (#eeeeee/#111111)
Color Helpers: palette.ts with legible text selection and Anonymous fallback
9.1 - DomainFilterBar ✅
Multi-toggle Pills: Click to filter by domains (top 10 shown)
Visual States: Active (blue), inactive (faded), disabled (no pointer events)
Clear All: Quick reset button when filters are active
9.2 - FeedFilters Context ✅
URL Sync: Filters persist in query string (?tlds=amazon.com,reddit.com)
Shallow Routing: No page reloads when toggling filters
9.3 - EditorPill ✅
Hover Reveals: Background instantly flips to editor's gradient colors
Editor Badge: Shows ✎ for users with type='editor'
9.4 - Post Grouping ✅
useGroupedPosts Hook: Merges posts with same title (slugified comparison)
Canonical Owner: First poster becomes the group representative
9.5 - PostCard v2 ✅
Grouped Display: Shows all contributing posts and URLs in one card
Contributor Avatars: 24×24 colored circles for each contributor
Palette Chrome: Card styling uses canonical owner's colors
9.6 - Filter Wiring ✅
Home Page: Updated to use PostCard and domain filtering
Domain Counting: Real-time calculation from URL data
Filter Feedback: Shows active filters and handles empty states
9.7 - Front-page Theming ✅
System Palette: Applied to body background (light gray theme)
Page-specific: Only applies on root / route
9.8 - Responsiveness ✅
Mobile: Horizontal scrolling filter pills (< 1280px)
Desktop: Vertical stacking filter pills (≥ 1280px)
Clean Scrolling: Hidden scrollbars with scrollbar-hide utility
🎯 Key Features Now Working:
Save any URL → Click "X saved" button → Persists in localStorage + updates DB count
Filter by domain → Click domain pills → URL updates with ?tlds= parameter
Grouped posts → Posts with same title merge with canonical owner styling
Responsive design → Filters adapt to screen size
Visit /saved → See all your bookmarked URLs with dates