# Zero to Crypto Dev 🚀

Learn Web3 development by building real projects. Go from zero to deploying smart contracts on Base in 1-2 months.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Solidity](https://img.shields.io/badge/Solidity-0.8-363636)
![Base](https://img.shields.io/badge/Base-Network-0052FF)

## ✨ Features

- **🎓 AI-Powered Tutor** - Sol guides you through each lesson with progressive hints
- **📝 In-Browser Code Editor** - Monaco editor with Solidity syntax highlighting
- **⚡ Real-Time Compilation** - Compile Solidity code instantly
- **🚀 One-Click Deploy** - Deploy to Base Sepolia (testnet) or Base Mainnet
- **💬 Interactive Chat** - Ask questions, get explanations, request hints
- **📊 Progress Tracking** - Track your learning journey
- **🌙 Dark Mode** - Easy on the eyes
- **📱 Mobile Responsive** - Learn on any device

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, shadcn/ui
- **Editor**: Monaco Editor
- **Blockchain**: Solidity, Base Network, wagmi, viem
- **AI**: Google Gemini (via @ai-sdk/google)
- **Database**: Supabase (PostgreSQL + Auth)
- **Hosting**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Google AI API key (Gemini)

### 1. Clone and Install

```bash
git clone https://github.com/duffaluffaguss/crypto-coding-app.git
cd crypto-coding-app
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google AI (Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Optional: Sentry for error monitoring
SENTRY_DSN=your_sentry_dsn
```

### 3. Database Setup

Run these migrations in your Supabase SQL Editor (in order):

1. `supabase/migrations/001_initial.sql`
2. `supabase/migrations/002_lessons.sql`
3. `supabase/migrations/003_chat.sql`
4. `supabase/migrations/004_user_wallets.sql`
5. `supabase/migrations/005_showcase.sql`
6. `supabase/migrations/006_lessons_rls.sql`

### 4. Enable Google OAuth (Optional)

In Supabase Dashboard:
1. Go to Authentication → Providers → Google
2. Enable and configure with your Google OAuth credentials

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Save |
| `Ctrl/Cmd + Shift + F` | Format Code |
| `Ctrl/Cmd + B` | Compile |

## 📚 Project Types

Build 6 different types of smart contracts:

| Type | Description |
|------|-------------|
| **Token** | Create your own ERC-20 cryptocurrency |
| **NFT** | Build an NFT collection marketplace |
| **DAO** | Decentralized governance organization |
| **Game** | On-chain lottery/gaming contracts |
| **Social** | Decentralized social platform |
| **Creator** | Sell digital goods like Bandcamp/Gumroad |

## 🌐 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
SENTRY_DSN=
```

## 📁 Project Structure

```
├── app/                  # Next.js App Router pages
│   ├── api/             # API routes (compile, format, AI)
│   ├── dashboard/       # User dashboard
│   ├── project/         # IDE workspace
│   └── showcase/        # Community projects
├── components/          # React components
│   ├── chat/           # AI tutor chat
│   ├── editor/         # Code editor
│   ├── lessons/        # Lesson sidebar
│   └── wallet/         # Wallet connection & deploy
├── lib/                 # Utilities
│   ├── supabase/       # Database client
│   └── networks.ts     # Blockchain network configs
└── supabase/
    └── migrations/     # Database schema
```

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

## 📄 License

MIT License - see LICENSE file for details.

---

Built with ❤️ for the Web3 community
