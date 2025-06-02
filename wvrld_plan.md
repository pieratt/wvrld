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
