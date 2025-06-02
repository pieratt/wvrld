# WVRLD

A modern URL bucket system where each route like `/alice` is a "bucket" that owns everything posted there. Built with Next.js, TypeScript, Tailwind CSS, and Prisma.

## 🚀 Tech Stack

- **Next.js 15** (App Router) - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Prisma ORM** - Database toolkit
- **SQLite** - Database (easily migrates to PostgreSQL)
- **Vercel** - Deployment platform (planned)

## 🏗️ Core Concepts

- **Bucket per URL** - Each route like `/alice` is a "bucket" that owns everything posted there
- **Inline commands** - Adding `/edit` to a route flips that page into edit mode
- **One prompt field** - Users paste a list title (optional) + any URLs—nothing else
- **High-trust alpha** - One shared admin login; formal auth later
- **Data once, display many** - Every distinct link is stored once; posts just reference it

## 📁 Project Structure

```
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # React components
│   └── lib/                 # Utility functions
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── seed.ts             # Database seeding script
│   └── dev.db              # SQLite database
├── public/                  # Static assets
└── package.json
```

## 🗄️ Database Schema

The database includes:
- **User** - Bucket owners with customizable colors and metadata
- **Prompt** - Raw text input from users
- **Post** - Processed posts with titles
- **URL** - Canonical URLs with metadata
- **PostURL** - Many-to-many relationship between posts and URLs

## 🚦 Routes & Commands

```
/                    → front feed  (Anonymous bucket, userId 2)
/[slug]              → bucket feed (slug owns content)
/[slug]/edit         → edit bucket (update title, description, colors)
/[slug]/[postId]     → single post view (numeric id)
/[slug]/[postId]/edit→ edit that post (prompt pre-filled with existing title + URLs)
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ (installed via Homebrew)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pieratt/wvrld.git
   cd wvrld
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Create and migrate database
   npx prisma db push
   
   # Seed with sample data
   npm run db:seed
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:seed` - Seed database with sample data

## 🗃️ Sample Data

The seed script creates:
- **System user** (User 1) - Reserved for system operations
- **Anonymous user** (User 2) - For front-page community posts
- **Alice** - Sample user bucket with curated links
- **Bob** - Sample user bucket with tech resources
- **Sample URLs** - Various links with metadata
- **Sample posts** - Demonstrates the prompt → post → URL relationship

## 🔄 Development Workflow

1. **Step 0** ✅ - Repo & Tooling (Complete)
2. **Step 1** ✅ - Project Scaffold (Complete)
3. **Step 2** - Static UI Mock (Next)
4. **Step 3** - Parser & Tests
5. **Step 4** - Create Ingest API
6. **Step 5** - Live Data Render
7. **Step 6** - Edit Routes
8. **Step 7** - Metadata Worker
9. **Step 8** - Filters & Bookmarks

## 🎨 Prompt Format

Example input:
```
My playlist for Spring
https://bandcamp.com/album1
https://soundcloud.com/track/abc
```

- First non-URL line → `title`
- Remaining valid URLs become an ordered list
- Raw text is stored intact for audit/debug

## 🔧 Environment Variables

```bash
DATABASE_URL="file:./dev.db"
```

## 📝 Database Commands

```bash
# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma db push --force-reset

# Generate client after schema changes
npx prisma generate
```

## 🚀 Deployment

Ready for deployment to Vercel with:
- Edge functions for API routes
- Cron jobs for metadata fetching
- Easy PostgreSQL migration

## 📄 License

MIT License - see LICENSE file for details

---

*Built with ❤️ using modern web technologies*
