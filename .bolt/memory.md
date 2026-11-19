# Project memory

## Product intent & audience

- App name: **GeneiRyodan Tracker** (user's Order is called "GeneiRyodan").
- Mobile-first roster management app for tracking 7DS Origin characters across Order members.
- Two roles: **Maestro** (Master) and **Miembro** (Member).
- 30 characters from 7DS Origin; player priority slots P1–P10.
- Master can upload shared character avatars and manage assignments.
- Members can view their own roster and other members' rosters.
- UI language: Spanish.

## Brand personality & voice

- Practical, clan/guild tracker tone — utility-focused, clear labels in Spanish.
- Order identity ("GeneiRyodan") surfaced in app name and member grouping.

## Visual design & UX direction

- Two top-level tabs in dashboard: **Personajes** and **Miembros**.
- Personajes tab: character grid/cards (existing).
- Miembros tab: searchable list of members (name + role); selecting a member shows their roster grouped by priority descending: P10 → P9 → ... → P4 → "No Obtenido", each group with count and avatars.
- Character avatars sourced from `character.default_avatar_url` (shared/global), not per-user assignment.
- Components use Tailwind classes, Lucide React icons, `@/` import alias.
- Mobile-first layout; tab navigation at top of dashboard.

## Decisions, constraints & rationale

- **Shared avatars**: moved from per-user avatar to `characters.default_avatar_url` so all members see the same avatar the Master uploaded. Rationale: consistency across member roster views.
- **Member roster ordering**: descending by priority (P10 first) so highest-priority characters stand out.
- **All members visible to each other**: assignments are shared/readable across the Order, not private.
- Backend: Firebase + local storage fallback.
- Stack: Vite + React + JSX + Tailwind + Lucide React; no extra UI/icon packages.
- Authoritative global instructions live in `.bolt/prompt` (beautiful, production-grade, non-cookie-cutter designs; `@/` alias; Lucide React icons).

## Open questions & assumptions

- Assuming "No Obtenido" is a valid status group for characters a member doesn't have; confirm label and whether unassigned characters should appear for all members.
- Assuming P1–P3 are intentionally excluded from the member roster grouping (only P4–P10 shown) — verify range.
- Firebase schema migration for `default_avatar_url` assumed applied; confirm no stale per-user avatar fields remain.
- Assuming avatar upload is Master-only; members are read-only for avatars.