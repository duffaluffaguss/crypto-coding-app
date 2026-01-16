# Zero to Crypto Developer - Task List

## Setup (Required to run)
- [ ] Create Supabase project at https://supabase.com
- [ ] Run `supabase/schema.sql` in SQL Editor
- [ ] Run `supabase/seed-lessons.sql` in SQL Editor
- [ ] Run `supabase/migrations/001_add_streaks.sql` in SQL Editor
- [ ] Run `supabase/migrations/002_public_projects.sql` in SQL Editor
- [ ] Add Supabase keys to `.env.local`
- [ ] Add Anthropic API key to `.env.local`
- [ ] Test auth flow (signup/login/logout)

## Phase 1: Core MVP
- [x] Landing page
- [x] Auth pages (login, signup)
- [x] Onboarding quiz (interests, experience)
- [x] AI project generator (Claude)
- [x] Dashboard with project list
- [x] Monaco code editor
- [x] AI tutor chat
- [x] Lesson sidebar
- [x] Solidity compiler
- [x] Supabase schema + RLS policies
- [x] Coinbase Smart Wallet config

## Phase 2: Deploy & Share
- [x] Wallet connect button UI (ConnectButton.tsx)
- [x] Deploy to Base Sepolia functionality (DeployButton.tsx)
- [x] Transaction status feedback (compiling/confirming/deploying/success)
- [x] Save deployed contract address to DB
- [x] Public shareable page for deployed projects (/share/[id])
- [x] Basic contract interaction UI (ContractInteraction.tsx)
- [x] Share button in IDE toolbar

## Phase 3: Enhanced Learning
- [x] Streaming AI responses with Vercel AI SDK
- [x] Persist chat history to Supabase
- [x] Track lesson completion in DB
- [x] Unlock next lesson on completion
- [x] Progress indicators (progress bar, percentage)
- [x] Hint system with progressive reveals (3 levels)
- [x] Streak tracking for daily engagement (StreakDisplay.tsx)

## Phase 4: More Content
- [x] Game project template + lessons (8 lessons for lottery game)
- [x] Social project template + lessons (8 lessons for decentralized social platform)
- [x] Advanced NFT lessons (ERC-721) - 8 lessons covering full standard
- [x] Token lessons (full ERC-20) - expanded to 9 lessons (mint, burn, pausable)
- [x] DAO voting lessons - trimmed to 5 essential lessons
- [x] **Creator project type** - 14 lessons for artists, musicians, makers:
  - Basics, minting, selling, royalties, collaborator splits
  - Fan memberships, unlockables, portfolio views
  - Event tickets (anti-scalping), custom commissions (escrow)
  - Crowdfunding (Kickstarter-style), licensing (stock content)
  - Physical item claims (merch/prints), bundles & tiers

## Phase 5: Frontend Builder
- [x] AI-generated React components for contracts
- [x] Store contract ABI for frontend generation
- [x] FrontendGenerator component with preview/download
- [ ] No-code frontend builder (visual editor)
- [ ] Preview deployed frontend
- [ ] Custom domain support

## Phase 6: Production
- [ ] Deploy to Vercel
- [ ] Set up production Supabase
- [ ] Add Base Mainnet option
- [ ] Analytics/tracking
- [ ] Error monitoring (Sentry)
- [ ] Rate limiting for AI endpoints

## Nice to Have
- [ ] Dark mode toggle
- [ ] Mobile responsive IDE
- [ ] Code formatting (Prettier)
- [ ] Git integration for projects
- [ ] Export project as zip
- [ ] Community showcase page

---

## Session Log

### Session 2 (2026-01-13)
**Completed:**
- Researched competitor platforms (CryptoZombies, Alchemy University, LearnWeb3, SpeedRun Ethereum, etc.)
- Implemented Phase 2: Deploy & Share features
  - Wallet connect with Coinbase Smart Wallet
  - Contract deployment to Base Sepolia
  - Transaction status tracking
  - Public shareable project pages
  - Contract interaction panel
- Implemented Phase 3: Enhanced Learning features
  - Streaming AI with Vercel AI SDK (@ai-sdk/anthropic)
  - Chat history persistence
  - Lesson progress tracking with visual indicators
  - Progressive hint system
  - Streak tracking for engagement
- All tests passing, app runs successfully

**Key Files Added:**
- `app/api/ai/chat/route.ts` - Streaming AI endpoint
- `app/share/[id]/page.tsx` - Public project view
- `components/wallet/ConnectButton.tsx`
- `components/wallet/DeployButton.tsx`
- `components/wallet/ContractInteraction.tsx`
- `components/gamification/StreakDisplay.tsx`
- `supabase/migrations/001_add_streaks.sql`
- `supabase/migrations/002_public_projects.sql`

### Session 2 Continued (2026-01-13)
**Completed:**
- Created `dev-log-manager` skill for managing task logs efficiently
  - `scripts/log_utils.py` - CLI for summary, search, stats commands
  - `scripts/archive_log.py` - Auto-archive old session entries
  - `references/log-template.md` - Template for new task logs
- Fixed Windows encoding issues in log utilities
- Added support for multiple session header formats
- Tested all log utilities on TODO.md

**Skill Location:** `~/.claude/skills/dev-log-manager/`

### Session 3 (2026-01-14)
**Completed:**
- Reviewed entire codebase and task list
- Fixed build warnings in `next.config.js` (suppressed unused wagmi connector warnings)
- Added Game project template (blockchain lottery) with 8 comprehensive lessons:
  - game-01-basics: Contract foundation
  - game-02-entry: Entry fee & player tracking
  - game-03-prize: Prize pool & game state
  - game-04-random: Pseudo-random winner selection
  - game-05-picking: Winner selection logic
  - game-06-payout: Prize distribution
  - game-07-reset: New round functionality
  - game-08-views: Frontend helper functions
- Added Social project template (decentralized social platform) with 8 lessons:
  - social-01-basics: Platform foundation
  - social-02-profiles: User registration with usernames
  - social-03-posts: Creating on-chain posts (280 char limit)
  - social-04-likes: Like/unlike functionality
  - social-05-tipping: ETH tips to content creators
  - social-06-following: Follow/unfollow system
  - social-07-feed: View functions for frontend
  - social-08-updates: Profile updates & post deletion
- Added game and social templates to ProjectIDE component
- Created ErrorBoundary component with retry functionality
- Integrated ErrorBoundary into Providers wrapper
- Created CLAUDE_DESKTOP_SETUP.md with copy-paste browser instructions
- Added Advanced NFT (ERC-721) lessons:
  - nft-09 to nft-16: Full ERC-721 standard implementation
- Expanded Token (ERC-20) lessons from 5 to 9:
  - token-06-minting: Owner minting with max supply
  - token-07-burning: Burn and burnFrom functions
  - token-08-pausable: Emergency pause functionality
  - token-09-metadata: Full ERC-20 interface checklist
- Expanded DAO lessons from 4 to 10:
  - dao-05-quorum: Minimum participation requirements
  - dao-06-execution: Proposal execution logic
  - dao-07-treasury: DAO fund management
  - dao-08-advanced-proposals: Proposal types (funding, etc.)
  - dao-09-delegation: Vote delegation system
  - dao-10-governance-views: Frontend view functions
- Trimmed DAO lessons from 10 to 5 (kept essentials: basics, joining, proposals, voting, quorum)
- Added new **Creator** project type (14 lessons) for artists/musicians/makers:
  - creator-01: Your Creator Contract (no middleman concept)
  - creator-02: Minting Your Work (digital certificates for art/music)
  - creator-03: Selling to Collectors (direct payments, edition tracking)
  - creator-04: Royalties on Resales (earn forever on secondary sales)
  - creator-05: Split Payments (auto-split with bandmates/collaborators)
  - creator-06: Fan Memberships (Patreon-style but you own it)
  - creator-07: Unlockable Content (gated downloads, stems, bonus content)
  - creator-08: Portfolio View (frontend integration)
  - creator-09: Event Tickets (anti-scalping, max resale prices)
  - creator-10: Custom Commissions (escrow protection for both sides)
  - creator-11: Crowdfunding (Kickstarter-style with refunds)
  - creator-12: Licensing (stock photos/music, personal vs commercial)
  - creator-13: Physical Items (merch, prints, vinyl linked to digital)
  - creator-14: Bundles & Tiers (deluxe packages, supporter tiers)
- **Phase 4 Complete!** Total: 52 lessons across 6 project types
- Build passing successfully

**Files Modified:**
- `next.config.js` - Added webpack aliases to suppress warnings
- `supabase/seed-lessons.sql` - 52 lessons total (14 creator, trimmed DAO)
- `components/editor/ProjectIDE.tsx` - Added game, social & creator template cases
- `components/providers.tsx` - Added ErrorBoundary wrapper
- `components/ErrorBoundary.tsx` - New component
- `CLAUDE_DESKTOP_SETUP.md` - New file with browser setup instructions

### Session 4 (2026-01-15)
**Completed:**
- Set up local PostgreSQL database for development
  - Created `supabase/local-dev-setup.sql` (mocks Supabase auth for local dev)
  - All tables, policies, and 60 lessons seeded in local `crypto_coding_app` database
  - Test user created for development
- Set up Playwright testing framework
  - Installed @playwright/test
  - Created `playwright.config.ts` with auto-server startup
  - Added `tests/landing.spec.ts` - 6 tests for landing page
  - Added `tests/auth.spec.ts` - 8 tests for login/signup pages
  - All 14 tests passing
- **Phase 5: Frontend Builder (partial)**
  - Added `contract_abi` and `generated_frontend` columns to projects table
  - Updated `DeployButton.tsx` to save ABI on deployment
  - Created `app/api/generate-frontend/route.ts` - AI endpoint that generates React components from contract ABI
  - Created `components/wallet/FrontendGenerator.tsx` - Modal UI for generating, previewing, copying, and downloading frontend code
  - Added `components/ui/dialog.tsx` and `components/ui/scroll-area.tsx` UI components
  - Integrated FrontendGenerator into ProjectIDE toolbar
  - Updated types to include 'creator' project type
- Build passing, all tests passing

**MCP Integration:**
- Postgres MCP server: `postgresql://postgres:postgres@localhost:5432/crypto_coding_app`
- Playwright MCP server available for browser automation
- Memory MCP server available for persistent storage

**New Files:**
- `supabase/local-dev-setup.sql` - Local PostgreSQL auth mock
- `supabase/migrations/003_add_contract_abi.sql` - ABI storage migration
- `app/api/generate-frontend/route.ts` - AI frontend generator endpoint
- `components/wallet/FrontendGenerator.tsx` - Frontend generation UI
- `components/ui/dialog.tsx` - Dialog component
- `components/ui/scroll-area.tsx` - ScrollArea component
- `playwright.config.ts` - Playwright configuration
- `tests/landing.spec.ts` - Landing page tests
- `tests/auth.spec.ts` - Auth page tests

**Modified Files:**
- `components/wallet/DeployButton.tsx` - Save ABI on deployment
- `components/editor/ProjectIDE.tsx` - Added FrontendGenerator, track ABI state
- `types/index.ts` - Added creator type, contract_abi/generated_frontend fields
- `package.json` - Added test scripts, @playwright/test dependency

---

## Next Steps (In Plain English)

### Step 1: Set Up the Database (Required to run the app)
**What:** Supabase is a free service that stores all user accounts, projects, and lesson progress.
**How:** See `CLAUDE_DESKTOP_SETUP.md` for copy-paste instructions you can give to Claude Desktop.

Tasks:
1. Create a free Supabase account at https://supabase.com
2. Create a new project (takes about 2 minutes to set up)
3. Copy and run the SQL setup files (these create all the tables needed)
4. Copy your project keys into the `.env.local` file

### Step 2: Get the AI Working
**What:** The AI tutor needs an API key from Anthropic (the company that makes Claude).
**How:**
1. Go to https://console.anthropic.com
2. Create an account and get an API key
3. Paste it in `.env.local`

### Step 3: Test Everything
Once Steps 1-2 are done, run `npm run dev` and test:
- [ ] Can you sign up and log in?
- [ ] Can you go through the onboarding quiz?
- [ ] Can you start a project and see the code editor?
- [ ] Does the AI tutor respond when you ask questions?
- [ ] Can you connect a wallet and deploy?

### Step 4: Phase 5 - Frontend Builder (Future)
**What:** Let users create a website for their project without writing code.
**Why:** Right now users can build smart contracts, but they need a website to let people use them. This would auto-generate that website.

### Step 5: Phase 6 - Launch for Real (Future)
**What:** Put this on the actual internet so anyone can use it.
**Tasks:**
- Deploy to Vercel (free website hosting)
- Set up production database
- Switch from test blockchain to real blockchain
- Add analytics to see how many people use it

### Ideas for Later
- Dark mode (easier on the eyes at night)
- Mobile-friendly version
- Let users download their project as a zip file
- Community page to show off what people have built
