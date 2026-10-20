# Qivorant

**From intent to execution.**

Qivorant is an AI task planning and execution agent for the OmniRush Frontier Buildathon 2026. The MVP will turn a user's goal into an actionable, prioritized plan while keeping the user in control.

## Requirements

- Node.js `24.15.0` (see `.nvmrc`)
- npm `11+`
- Docker is optional for local development

## Setup

```bash
npm install
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

## Run

```bash
npm run dev
```

## Test offline

Dependencies must be installed once with `npm install`. After that, the test command does not require a network connection:

```bash
npm test
```

## Build

```bash
npm run build
```

## Deploy

Build the app with `npm run build` and deploy the generated `dist/` directory to a static host such as Vercel, Netlify, or GitHub Pages.

## Docker

Build and run the production preview:

```bash
docker build -t qivorant .
docker run --rm -p 4173:4173 qivorant
```

Open `http://localhost:4173`.

## Planning modes

Qivorant always works locally with a deterministic fallback planner. The UI labels this mode explicitly. To connect a permitted AI planning service, copy `.env.example` to `.env` and set:

```bash
VITE_AI_PLANNER_URL=https://your-approved-planner-endpoint.example/api/plan
```

The endpoint should accept `POST { "goal": "..." }` and return either an array of tasks or `{ "tasks": [...] }`. Each task should contain `title` (or `description`) and may contain `priority` (`High`, `Medium`, or `Low`). If the endpoint fails or returns invalid data, Qivorant visibly falls back to the deterministic planner instead of pretending AI was used.

## MVP capabilities

- Create multiple saved goals.
- Generate AI or deterministic fallback plans.
- Add, edit, delete, reorder, filter, and complete tasks.
- Track progress and show an all-done state.
- Persist goals and tasks in localStorage.
- Recover safely from malformed local browser data.

External actions such as sending email, booking calendar events, or changing third-party systems are intentionally outside this MVP. “Execution” means guiding the user through the task list and recording completion.
