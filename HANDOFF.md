# Solar Sub Hub — Engineering Handoff

This is a static, clickable prototype covering the customer and contractor workflows end‑to‑end. It’s designed as an implementation reference and can be iterated into a production app.

## What’s included
- index.html — All routes and screens (hash‑based routing)
- assets/styles.css — Design system tokens, layout, components, themes
- assets/app.js — Routing, interactions, Kanban DnD, proposal wizard, financing logic
- .github/workflows/deploy-pages.yml — GitHub Pages deployment (gh-pages branch)
- 404.html, .nojekyll — Pages routing helpers
- Solar_Hub_Customer_Management_Requirements.md — Detailed requirements and acceptance criteria

## How to run locally
- No build required. Option A: double‑click index.html. Option B: start a simple web server:
  - Python: `python -m http.server 8000`
  - Node: `npx serve .`
  - Open http://localhost:8000

## How to deploy (GitHub Pages)
1) Create a GitHub repo and push this folder.
2) Ensure `.github/workflows/deploy-pages.yml` exists on default branch.
3) On first push, the workflow creates/updates the `gh-pages` branch and enables Pages.
4) Pages URL will be: `https://<org-or-user>.github.io/<repo>/`.

## Tech approach (prototype)
- Static HTML/CSS/JS; no frameworks; hash routing (`#proposal`, `#contractor`, etc.)
- Local state only (no backend); versions saved to `localStorage`
- PDF export via `window.print()` with print CSS
- Kanban board uses native HTML5 drag‑and‑drop
- Form layouts use CSS Grid; responsive breakpoints at 960px

## Key workflows covered
- Proposal Creation: Preflight → Analysis → Packages → Review
- Contractor Home: KPIs, Board, List, Calendar, Reports
- Operations Pipeline: Kanban with stage transitions
- Financing: inputs, recommendations, goal preference
- Monthly Cost Calculator: amortization and before/after chart
- Handoff Wizard: confirm → docs → assign → schedule → send

## Design system quick reference
- Tokens defined in `assets/styles.css` under `:root` (primary/leaf/sun/sky palettes)
- Components: buttons (primary/ghost/sm), cards, tags, chips, tabs, stepper, toast
- Layouts: `.layout.twocol`, `.layout.twocol-right`, `.kpis`, `.form-grid`

## What to productionize
- Replace local state with real API (auth, leads, jobs, stages, proposals)
- Persist Kanban, proposal versions, financing selections
- Introduce a component framework (React/Vue/Svelte) and state mgmt
- URL routing (React Router or equivalent) instead of hash router
- Form validation + accessibility passes (labels, roles, focus order)
- E2E tests (Playwright/Cypress) and CI checks

## Suggested backlog (stories)
1) App shell in React with route parity for all prototype routes
2) Auth and user roles (sales, contractor, admin)
3) Jobs API: CRUD, stage transitions with WIP rules
4) Proposal service: checklist, analysis results, package presets
5) Financing service: lenders, scoring, monthly calc service
6) PDF export service with server‑side render (optional)
7) Contractor dashboard metrics + calendar integration
8) Versioning persistence and compare view

## QA checklist (prototype parity)
- Navigation reaches all routes and back bar only on stage pages
- Proposal wizard flow and gating work; packages highlight on select
- Financing: recommendations hidden until requested; reset on input change
- Calculator chart updates proportionally when values change
- Kanban drag‑and‑drop updates counts and WIP badges

## Hand‑off tips
- Share the repo URL and this HANDOFF.md
- Record a quick 3–5 min walkthrough video
- Open initial tickets from “Suggested backlog” in your tracker
- Pin the Pages URL for quick reference during standups
