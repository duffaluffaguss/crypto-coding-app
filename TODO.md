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
- [ ] Game project template + lessons
- [ ] Social project template + lessons
- [ ] Advanced NFT lessons (ERC-721)
- [ ] Token lessons (full ERC-20)
- [ ] DAO voting implementation lessons

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

---

## Next Steps (Priority Order)

### Immediate (Before First User Test)
1. **Test with real Supabase instance** - Verify all DB operations work
2. **Test wallet connection flow** - Ensure Coinbase Smart Wallet connects properly
3. **Test full deployment cycle** - Compile → Connect → Deploy → Share
4. **Add error boundaries** - Graceful error handling in React components

### Short Term (Phase 4)
1. Add more project templates (Game, Social)
2. Expand lesson content for existing templates
3. Implement code validation (check if lesson requirements are met)

### Medium Term (Phase 5-6)
1. AI-generated frontend components
2. Production deployment (Vercel + Supabase)
3. Base Mainnet support
