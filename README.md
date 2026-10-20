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

## Current status

Milestone 1 provides the project foundation and initial responsive shell. AI planning, task editing, persistence, and execution flows are planned for subsequent milestones.
