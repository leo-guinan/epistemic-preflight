# Epistemic Preflight

Pre-review analysis tool for research papers. Position your work clearly, surface reviewer risks, and identify synthesis opportunities — before submission.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Backend**: Mastra AI framework
- **LLM**: OpenAI (configurable)

## Getting Started

### Prerequisites

- Node.js 20 or later
- OpenAI API key (or another supported LLM provider)

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key and other required variables:

```
OPENAI_API_KEY=your-api-key-here
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Set up Supabase:

   a. Create a new project at [supabase.com](https://supabase.com)
   
   b. Get your connection string from: Settings → Database → Connection String → URI
   
   c. Set up the database schema:

```bash
pnpm db:generate
pnpm db:migrate
```

This creates the database tables and generates the Prisma client.

4. Run the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
epistemic-preflight/
├── app/
│   ├── api/preflight/        # API routes for paper analysis
│   ├── preflight/             # Preflight flow (state machine)
│   │   └── components/        # State components
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Landing page
│   └── globals.css            # Global styles
├── mastra/
│   ├── agents/                # Mastra agents
│   │   └── paper-analysis-agent.ts
│   └── index.ts               # Mastra configuration
└── package.json
```

## Features

### State Machine Flow

1. **Landing Page** - Trust gate with problem/solution framing
2. **Intent Declaration** - User declares paper purpose
3. **Paper Upload** - PDF or text upload
4. **Immediate Analysis** - Core claims extraction (WOW moment)
5. **Comparator Selection** - Upload or paste comparator papers
6. **Full Analysis** - Complete epistemic analysis
7. **Agency Moment** - User chooses next steps (auth prompt appears here)

### Database

The application uses **Supabase** (PostgreSQL) for data persistence. All user papers and analysis results are stored in Supabase. See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed setup instructions.

### Authentication

Authentication is handled via **Supabase Auth** with Google OAuth. Users can use the full analysis flow without signing in, but an auth prompt appears after the full analysis completes (at the Agency Moment). Users can continue without signing in, but their progress won't be saved. User accounts are automatically created in Supabase when they first sign in.

### MVP Focus

- Fast core claims extraction (< 60 seconds)
- Risk signal identification
- Overlap/conflict/novelty analysis
- Reviewer risk report
- Reframing suggestions

## Development

### Adding New Features

- **Agents**: Add to `mastra/agents/`
- **API Routes**: Add to `app/api/`
- **Components**: Add to `app/preflight/components/`

### Environment Variables

- `OPENAI_API_KEY` - Required for LLM operations
- `NEXT_PUBLIC_FATHOM_ID` - Optional. Fathom Analytics site ID (defaults to `XJKVDZER` if not set)
- `NEXT_PUBLIC_SUPABASE_URL` - Required. Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Required. Your Supabase anonymous/public key
- `DATABASE_URL` - Supabase PostgreSQL connection string (get from Supabase dashboard → Settings → Database → Connection String → URI)
- `DIRECT_URL` - (Optional) Direct connection URL for migrations. If not set, DATABASE_URL will be used. Useful if using connection pooling.
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (optional, for Supabase client features)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (optional, for Supabase client features)

### Analytics

This project uses [Fathom Analytics](https://usefathom.com/) for privacy-focused website analytics. The following events are automatically tracked:

- **intent declared** - User selects paper intent
- **paper uploaded** - User uploads a paper (file or paste)
- **analysis completed** - Initial analysis completes with claims extracted (value = number of claims)
- **full analysis completed** - Full arena analysis completes
- **agency choice selected** - User selects a strategic path
- **synthesis applied** - User applies synthesis framing
- **synthesis committed** - User commits synthesis changes

**Note:** Events are automatically created in your Fathom dashboard when first tracked. No manual setup is required. You can view and manage events in your Fathom dashboard under the Events section.

## License

MIT

