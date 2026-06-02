# dogfood

A tiny desktop forge where you prompt Claude Code to build a UI piece and watch it
render live — in the real repo you opened. **Prompt → render → it's already home.**

This repo houses everything for Dogfood.

```
dogfood/
├── index.html        the interactive design hub (latest) — served by GitHub Pages
├── v0/               frozen version snapshots (v0, then v0.1, …) — preserved identically
├── versions.json     the version manifest
├── site/             the marketing landing site (Next.js → Vercel) — to be built
├── app/              the Dogfood desktop app (Electron + Vite + React) — to be scaffolded
└── docs/             long-form docs (vocs)
```

## The design hub

The interactive hub — concept, decisions, architecture, the visual system, and the full
**component inventory** (current + future) — is a single self-contained `index.html`.

**Live:** https://wwwwaaaaddddeeee.github.io/dogfood/ (GitHub Pages, served from the repo root)

To update it: edit `index.html`, commit, push — Pages rebuilds in ~30s.

## Versions

Every version is preserved **identically** so progress is visible over time. The living
hub is `index.html` (the “Latest”); each cut is frozen under `/<version>/` and never
edited again. Use the version switcher in the hub header to flip between them.

- `/dogfood/`    → Latest (living)
- `/dogfood/v0/` → v0 snapshot

## Hosting plan

- **GitHub Pages** → the design hub (this repo's root).
- **Vercel** → the marketing landing in `site/` (later; Vercel root directory = `site/`).

## Local notes

`brainstorming/` and `references/` are kept **local only** (gitignored) because this repo
is public — they're raw working notes and reference images.
