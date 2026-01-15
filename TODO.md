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
- [ ] AI-generated React components for contracts
- [ ] No-code frontend builder
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

---

## Next Steps (Priority Order)

### Tomorrow - Setup & Testing
1. **Set up Supabase instance** - Create project, run schema.sql and migrations
2. **Configure environment** - Add Supabase + Anthropic keys to .env.local
3. **Test auth flow** - Signup, login, logout with real Supabase
4. **Test wallet connection** - Coinbase Smart Wallet on Base Sepolia
5. **Test full deployment cycle** - Compile → Connect → Deploy → Share

### This Week - Polish & Content
1. **Add error boundaries** - Graceful error handling in React components
2. **Expand lesson content** - More detailed steps for NFT marketplace
3. **Add code validation** - Check if lesson requirements are met
4. **Game project template** - New template with game-focused lessons

### Next Week - Phase 5 Start
1. AI-generated React components for deployed contracts
2. Simple frontend builder UI
3. Preview deployed frontend functionality

### Backlog
- Production deployment (Vercel + Supabase)
- Base Mainnet support
- Dark mode toggle
- Mobile responsive IDE
