# Claude Desktop Browser Setup Instructions

Copy and paste these prompts into Claude Desktop to get help setting up the manual configuration steps.

---

## 1. Create Supabase Project

Copy this prompt to Claude Desktop:

```
I need help setting up a Supabase project for my "Zero to Crypto Dev" learning platform. Please guide me through:

1. Go to https://supabase.com and sign in (or create an account)
2. Click "New Project" and help me:
   - Choose an organization (or create one)
   - Project name: "zero-to-crypto-dev" (or similar)
   - Database password: Generate a strong one and save it
   - Region: Pick closest to me
3. Wait for project to be created (~2 minutes)
4. Once ready, navigate to Project Settings > API and help me find:
   - Project URL (starts with https://xxx.supabase.co)
   - anon/public key
   - service_role key (keep this secret!)

I'll need to copy these values for my .env.local file.
```

---

## 2. Run Database Schema

Copy this prompt to Claude Desktop:

```
I have a Supabase project ready. Help me run the database schema. I need to:

1. Go to my Supabase dashboard
2. Navigate to SQL Editor (left sidebar)
3. Click "New query"
4. Run the following SQL files in order (I'll paste the content):

First, run this schema.sql:
[Open and copy content from: supabase/schema.sql]

Then run seed-lessons.sql:
[Open and copy content from: supabase/seed-lessons.sql]

Then run the migrations:
[Open and copy content from: supabase/migrations/001_add_streaks.sql]
[Open and copy content from: supabase/migrations/002_public_projects.sql]

Help me verify each ran successfully before moving to the next.
```

---

## 3. Get Anthropic API Key

Copy this prompt to Claude Desktop:

```
I need help getting an Anthropic API key for my learning platform. Please guide me:

1. Go to https://console.anthropic.com
2. Sign in or create an account
3. Navigate to API Keys section
4. Create a new API key named "zero-to-crypto-dev"
5. Copy the key (it starts with "sk-ant-")

Important: I need to save this key securely as it won't be shown again.
```

---

## 4. Test Authentication Flow

Copy this prompt to Claude Desktop:

```
Help me test the authentication flow in my Zero to Crypto Dev app running at http://localhost:3000:

1. Open http://localhost:3000 in the browser
2. Click "Get Started" or navigate to /signup
3. Create a test account with email/password
4. Check if signup succeeds and redirects properly
5. Try logging out
6. Try logging back in
7. Verify the dashboard loads after login

Report any errors you see in the browser console or on screen.
```

---

## 5. Test Wallet Connection

Copy this prompt to Claude Desktop:

```
Help me test the Coinbase Smart Wallet integration:

1. Go to http://localhost:3000 and log in
2. Start a project (go through onboarding if needed)
3. In the IDE, click "Connect Wallet"
4. When Coinbase Wallet popup appears:
   - Create a new wallet (if first time) OR
   - Connect existing Coinbase account
5. Verify wallet address appears in the UI
6. Check that we're on Base Sepolia testnet

If you need test ETH, guide me to the Base Sepolia faucet at https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
```

---

## 6. Test Full Deployment Cycle

Copy this prompt to Claude Desktop:

```
Help me test deploying a smart contract to Base Sepolia:

1. Make sure I'm logged in and have a project open
2. Make sure wallet is connected with some test ETH
3. Write a simple contract (or use the template)
4. Click "Compile" - verify it succeeds
5. Click "Deploy":
   - Confirm the transaction in wallet popup
   - Wait for deployment to complete
6. Verify:
   - Contract address appears in UI
   - "Share" button appears
   - Check the contract on BaseScan

Report any errors during compilation or deployment.
```

---

## Environment Variables Template

After getting your keys, update `.env.local`:

```
# Supabase - Get these from https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Anthropic Claude API - Get from https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-...

# Base Network RPC (optional, has default)
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
```

---

## SQL Files Quick Reference

### Schema (supabase/schema.sql)
Main tables: profiles, projects, project_files, lessons, learning_progress, chat_messages

### Seed Data (supabase/seed-lessons.sql)
Pre-built lessons for: NFT Marketplace (8), Token (5), DAO (4), Game (8)

### Migrations
- 001_add_streaks.sql: Streak tracking for gamification
- 002_public_projects.sql: Public project sharing policies

---

## Troubleshooting

**Auth not working:**
- Check Supabase URL and keys in .env.local
- Verify email confirmations are disabled in Supabase Auth settings (for testing)

**Wallet won't connect:**
- Make sure you're using a browser that supports Coinbase Wallet
- Try clearing local storage and reconnecting

**Deployment fails:**
- Ensure you have test ETH on Base Sepolia
- Check that contract compiles successfully first
- Verify you're on the correct network (Base Sepolia, not mainnet)

**AI tutor not responding:**
- Verify ANTHROPIC_API_KEY is set correctly
- Check browser console for API errors
- Ensure API key has sufficient credits
