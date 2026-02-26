## SwimSetter

Simple swim plans on the fly.

### Environment variables

Create a `.env.local` file for local development (Railway will use its own env configuration):

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key

# Optional (LLM planner)
SWIM_PLANNER_MODEL=gpt-4.1-mini
SWIM_PLANNER_PYTHON=./.venv/bin/python
```

### Supabase setup

- Create a new Supabase project.
- In the SQL editor, run the contents of `supabase/schema.sql` to create tables, indices, and Row Level Security policies.
- In Authentication settings:
  - Enable email magic link sign-in.
  - Add redirect URLs for local dev (e.g. `http://localhost:3000`) and your Railway domain.

### Running locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

### Railway deployment (high level)

- Push this repo to GitHub.
- In Railway:
  - Create a new project and add a service from this repo.
  - Set build command: `npm install && npm run build`.
  - Set start command: `npm run start`.
  - Configure environment variables:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Deploy and visit the generated URL.

### Smoke test checklist

- Sign in via `/auth` with an email magic link.
- Complete onboarding at `/onboarding` and pick a swim level.
- Generate a plan at `/plans/generate`, accept it, and confirm it appears on `/plans`.
- Mark a plan as complete and add tags/rating; confirm completion is stored in Supabase.
