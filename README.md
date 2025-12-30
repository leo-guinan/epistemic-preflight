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

Edit `.env` and add your OpenAI API key:

```
OPENAI_API_KEY=your-api-key-here
```

3. Run the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

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
7. **Agency Moment** - User chooses next steps

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

## License

MIT

