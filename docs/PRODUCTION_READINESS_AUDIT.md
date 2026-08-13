# CSSEC Website — Production Readiness Audit

**Date:** 2026-08-13
**Audited commit:** `9c3aeb6` (Phases 1–6 complete)
**Scope:** Read-only architecture and production-readiness audit. No application code was modified.

---

## A. Executive status

| Area | Readiness | One-line assessment |
| --- | --- | --- |
| Product functionality | **80–85%** | Every content type has a public surface except the officer board; search is a stub |
| CMS / admin | **90–95%** | All seven modules do full CRUD with policies; only Studio-by-design gaps remain |
| Public UI | **75–80%** | Five of six designed pages are complete; About is half-built and no images render anywhere |
| Authentication / security | **85–90% built, 0% browser-verified** | The model is rigorous and statically guarded, but no signed-in path has ever been exercised |
| Testing | **60–65%** | 302 passing unit + static-guard tests; zero DOM, integration, or end-to-end coverage |
| Production infrastructure | **10–15%** | No CI, no branch protection, no analytics, no monitoring, no confirmed Vercel/domain setup |
| Handoff / documentation | **70–75%** | The README is genuinely excellent but its status table is stale and deploy/handoff docs are absent |

**Overall:** the application is substantially more finished than its infrastructure. The code is production-quality; the *deployment* is not started.

---

## B. Route inventory

### Public routes

| Route | Rendering | Classification | Notes |
| --- | --- | --- | --- |
| `/` | Static, ISR 1h | **Complete** | All six designed sections, live Sanity data, designed empty state per section, mobile-only quick-nav and join band |
| `/events` | Dynamic (`searchParams`) | **Complete** | Upcoming + archive, type and topic filters, no-match state |
| `/events/[slug]` | SSG | **Complete** | Single route serves pre-event and archive states; `generateMetadata` with OG |
| `/events/[slug]/calendar.ics` | Dynamic | **Complete** | Route handler, `cache: 'no-store'`, stable UID, no client JS |
| `/projects` | Dynamic (`searchParams`) | **Complete** | Status + level filters |
| `/projects/[slug]` | SSG | **Complete** | Recruiting-oriented layout, open roles, `generateMetadata` |
| `/resources` | Dynamic (`searchParams`) | **Complete** | Library with type/topic filters |
| `/resources/[slug]` | SSG | **Complete** | `generateMetadata`, related resources, source event |
| `/opportunities` | Dynamic (`searchParams`) | **Complete** | Board with urgency split; no detail route **by design** (no slug in schema) |
| `/about` | Static, ISR 1h | **Functional but incomplete** | Hero, "How to join", "Where the club lives" done. **Officer board, FAQ and club history explicitly deferred in-page** |
| `/join` | — | **Missing (by design)** | Not a designed route. Header, footer and mobile drawer all point at `/about` / `/about#join` |
| `/_not-found` | Static | **Complete** | Inside `(public)` so 404s keep the site shell |

### Auth / admin routes

All admin routes are `force-dynamic` and sit behind the `(shell)` layout's `requireOfficer()`.

| Route | Classification |
| --- | --- |
| `/sign-in/[[...sign-in]]` | **Complete (auth)** — Clerk `<SignIn />`, `fallbackRedirectUrl`, honours `redirect_url` |
| `/admin/no-access` | **Complete (auth)** — deliberately outside the `(shell)` boundary to avoid a redirect loop |
| `/admin` | **Complete (internal)** — GROQ-computed dashboard: stat tiles, upcoming, needs-attention, quick actions |
| `/admin/events` · `new` · `[id]/edit` · `[id]/remove` | **Complete (internal)** |
| `/admin/projects` · `new` · `[id]/edit` · `[id]/remove` | **Complete (internal)** |
| `/admin/resources` · `new` · `[id]/edit` · `[id]/remove` | **Complete (internal)** |
| `/admin/opportunities` · `new` · `[id]/edit` · `[id]/remove` | **Complete (internal)** |
| `/admin/people` · `new` · `[id]/edit` · `[id]/remove` | **Complete (internal)** |
| `/admin/people/officers` · `new` · `[id]/edit` · `[id]/remove` | **Complete (internal, admin-only)** |
| `/admin/settings` | **Complete (internal, admin-only)** — singleton editing |

### CMS

| Route | Classification |
| --- | --- |
| `/studio/[[...tool]]` | **Complete (advanced CMS)** — `force-static`, Sanity's own auth, excluded from the Clerk proxy matcher, singleton locking, custom structure |

### Search

| Surface | Classification |
| --- | --- |
| ⌘K dialog in the header | **Placeholder — honest** |

The trigger, native `<dialog>`, ⌘/Ctrl+K shortcut, focus management and keyboard contract are all built. Typing produces a `role="status"` message reading `SEARCH IS NOT BUILT YET` and falls back to the four section links. There is **no index, no query, and no results path**.

---

## C. Feature inventory

### Events — *complete*
Public index and detail ✔ · admin CRUD ✔ · resources attached via `resource.event` ✔ · Add to Calendar (`.ics` route handler) ✔ · `revalidateEventContent` ✔ · type/topic filtering ✔ · cancel-vs-delete policy, unit tested and re-checked server-side ✔

### Projects — *complete except imagery*
Public index and detail ✔ · admin CRUD ✔ · six-state lifecycle ✔ · open roles as parallel-array repeatable rows ✔ · people as true references with deleted-person handling ✔ · archive-vs-delete policy ✔ · **cover image uploads but is never rendered publicly** ✘ · screenshots Studio-only and never rendered ✘

### Resources — *complete*
Public library and detail ✔ · admin CRUD ✔ · file upload through the Server Action (≤10 MB, extension + MIME allow-list) ✔ · `resource.event` relationship drives the event archive ✔ · delete-only policy with reference blocking ✔

### Opportunities — *complete*
Public board ✔ · admin CRUD ✔ · deadlines stored as calendar dates and derived at read time (no `expired` flag) ✔ · open/closing-soon/expired tabs shared with the public board ✔

### People / Officers — *admin complete, public surface missing*
Admin people CRUD with photo upload ✔ · usage-aware delete policy listing every credit ✔ · officer-term CRUD with end-vs-delete and normalised academic years ✔ · faculty advisor rendered in the footer and named on `/about` ✔
**`CURRENT_OFFICERS_QUERY` is defined in `src/sanity/queries/people.ts` and has zero consumers.** The officer board is never rendered on any public page. `revalidatePeopleContent()` invalidates `/about` for content that page does not display.

### Site settings — *admin complete, partially consumed*
Admin editing ✔ · consumed by `getSiteLinks()` for header, footer, homepage and About ✔
**Not consumed:** `seo.metaTitle`, `seo.metaDescription`, `seo.shareImage` (root metadata is hardcoded in `src/app/layout.tsx`), `socialLinks`, `teamsUrl` (Teams is described but deliberately never linked).

### Search — *placeholder*
See above.

### About / Join — *partial*
`/about` is real, not a stub, and is sourced from `siteSettings` (`clubName`, `description`, `meetingInfo`, `contactEmail`, `discordUrl`, `facultyAdvisor.name`). The platform table is **hardcoded in the page**, not CMS-driven. The officer roster, FAQ and history sections from the design are absent and the page says so. `/join` does not exist as a route.

---

## D. CMS audit

7 document types, 4 object types, 41 typed GROQ queries, 27 schema types under TypeGen. `pnpm typegen` regenerates cleanly.

| Type | Kind | Public consumers | Admin consumers | Studio-only fields | Validation |
| --- | --- | --- | --- | --- | --- |
| `siteSettings` | doc (singleton) | `getSiteLinks()` | `/admin/settings` | `seo.shareImage` | required on name/short/description/contactEmail; URL scheme checks |
| `person` | doc | credits only (names) | `/admin/people` | — | required name; email + URL validation |
| `officerRole` | doc | **none** | `/admin/people/officers` | — | required person/position/term |
| `event` | doc | `/`, `/events`, `/events/[slug]`, `.ics` | `/admin/events` | `description`, `setupInstructions`, `seo` | required title/slug/status/type/startsAt/summary; `endsAt` after `startsAt` |
| `resource` | doc | `/`, `/resources`, `/resources/[slug]`, event pages | `/admin/resources` | files >10 MB | required title/slug/type/description/publishedAt |
| `project` | doc | `/`, `/projects`, `/projects/[slug]` | `/admin/projects` | `description`, `screenshots`, `seo` | required name/slug/status/shortDescription; unique arrays |
| `opportunity` | doc | `/`, `/opportunities` | `/admin/opportunities` | — | required title/org/type/description/applicationUrl/postedAt |
| `seo` | object | detail pages only | settings + Studio | `shareImage` | length warnings |
| `socialLink` | object | **none** | `/admin/settings` | — | required platform; URL check |
| `eventLocation` | object | event pages | `/admin/events` | `directions` | conditional required `place` |
| `openRole` | object | project pages | `/admin/projects` | — | required title |

### Orphaned or unconsumed schema fields — *not removed in this task*

| Field | Status |
| --- | --- |
| `officerRole` (whole type) | Written by admin, never read publicly |
| `person.photo` | Uploaded in admin, shown in the admin index, **never public** |
| `person.slug` | Stored, uniqueness-validated in admin, **no `/people/[slug]` route** |
| `person.shortBio`, `email`, `githubUrl`, `linkedinUrl`, `websiteUrl` | Fetched by `personFragment`, never rendered publicly |
| `project.coverImage` | Uploaded in admin, **never rendered** |
| `project.screenshots` | Queried in `PROJECT_BY_SLUG_QUERY`, **never rendered** |
| `seo.shareImage` (all types) | Queried, never used in `openGraph.images` |
| `siteSettings.seo.*` | Edited in admin, **never reaches page metadata** |
| `siteSettings.socialLinks`, `teamsUrl` | Fetched publicly, never rendered (Teams is intentional) |
| `eventLocation.directions` | Never rendered publicly |

Deletion/archive behaviour is modelled per type in `src/lib/<module>/delete-policy.ts`, unit tested, and — importantly — **re-evaluated inside the Server Action against fresh data**, so the confirmation screen is UX rather than enforcement.

---

## E. Authentication / security audit

### Architecture

- **`ClerkProvider`** — Server Component in the root layout with `signInUrl="/sign-in"`; no env-var redirect config needed.
- **`src/proxy.ts`** — `clerkMiddleware()` only. Deliberately protects nothing, so a matcher mistake cannot expose admin content. Matcher explicitly excludes `/studio`.
- **`requireOfficer()`** — `server-only`. Reads the role from the session claim, falls back to the Clerk Backend API. Signed out → `/sign-in?redirect_url=…`; no role → `/admin/no-access`.
- **Capabilities** — `admin:access`, `content:write`, `officers:manage`, `settings:manage`, split by cost-of-mistake rather than seniority. `can()` is the only reader; no role string is compared inline anywhere.
- **Page protection** — every page under `(shell)` calls `requireOfficer()` *before* querying, in addition to the layout, so a signed-out caller triggers no Sanity fetch.
- **Server Action authorization** — all **22** actions call `requireOfficer({ capability })` independently, first, before any Sanity access.
- **Write-token isolation** — `SANITY_API_WRITE_TOKEN` is read only via `requireEnv` inside `server-only` modules (`write-client.ts`, `admin-client.ts`). No route handler or client component can reach it.
- **Uploads** — bytes travel inside the Server Action multipart body; validated by `src/lib/admin/assets.ts` (extension + MIME allow-list, 5 MB images / 10 MB documents, filename sanitisation) *before* Sanity is touched. `serverActions.bodySizeLimit: '12mb'` is the framework-level outer bound. Executables, scripts, HTML and SVG are rejected. There is no signed-URL step and no upload endpoint of our own.
- **Role provisioning** — Clerk dashboard only, by design. No provisioning code exists, so there is no privilege-escalation surface in the app.
- **`/studio` separation** — never wrapped in Clerk; uses Sanity's own auth; excluded from the proxy matcher.

### Static guards (automated)

- `src/lib/admin/actions-authorization.test.ts` (9 tests) — walks the route tree; asserts every exported action authorizes itself before Sanity, uses a module-appropriate capability, takes no document type as input, never reads the write token directly, and checks uploads before transfer.
- `src/lib/admin/admin-pages-authorization.test.ts` (4 tests) — asserts every shell page calls `requireOfficer()` before querying and that admin-only screens request the stronger capability.
- `src/auth/access.test.ts` (10 tests) — the decision function itself.

Because both guards walk the directory tree rather than listing files, a module added later is covered automatically.

### Verification classification

| Behaviour | Status |
| --- | --- |
| Action self-authorization, ordering, capability strength | **Verified automatically** |
| Page-level `requireOfficer()` before query | **Verified automatically** |
| Write token never read outside server-only modules | **Verified automatically** |
| Upload rules (size, type, filename) | **Verified automatically** (pure-function tests) |
| Decision logic for signed-out / no-role / role | **Verified automatically** |
| `server-only` boundary enforcement | **Verified by build** (`pnpm build` passes) |
| Everything involving a real Clerk session | **Implemented but never verified in a browser** |

### Signed-in paths never manually exercised — *all of them*

1. Signing in at `/sign-in` and landing on `/admin`
2. `redirect_url` round trip from a deep admin link
3. Signed-in-without-a-role → `/admin/no-access` (and that it does not loop)
4. Revoking `role` metadata and losing access on the next request
5. `officer` vs `admin` capability split — that an officer genuinely cannot reach `/admin/settings` or `/admin/people/officers` by typing the URL
6. Any create / edit / delete round trip against real Sanity through a real session
7. Any file or image upload
8. Any revalidation actually reaching a public page after a save
9. Direct POST to a Server Action while signed out or under-privileged
10. `/studio` sign-in and that it never touches Clerk

**No admin write has ever been proven end-to-end against a live dataset by this audit** (mutating Sanity was out of scope).

---

## F. Admin audit

| Module | Index | Create | Edit | Archive/Cancel | Hard delete | Uploads | References | Revalidation | Mobile | Permission |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | --- |
| Events | ✔ | ✔ | ✔ | ✔ cancel | ✔ policy-gated | — | presenters | ✔ | ✔ | `content:write` |
| Projects | ✔ | ✔ | ✔ | ✔ archive | ✔ policy-gated | ✔ cover image | lead/mentors/contributors | ✔ | ✔ | `content:write` |
| Resources | ✔ | ✔ | ✔ | — (none by design) | ✔ policy-gated | ✔ file ≤10 MB | event/author/related | ✔ | ✔ | `content:write` |
| Opportunities | ✔ | ✔ | ✔ | — (derived expiry) | ✔ | — | — | ✔ | ✔ | `content:write` |
| People | ✔ | ✔ | ✔ | — | ✔ usage-gated | ✔ photo | — | ✔ | ✔ | `content:write` |
| Officer terms | ✔ | ✔ | ✔ | ✔ end term | ✔ | — | person | ✔ | ✔ | `officers:manage` |
| Site settings | n/a | n/a | ✔ | n/a | n/a | — | faculty advisor | ✔ | ✔ | `settings:manage` |

Mobile: `AdminMobileNav` is a disclosure (not an overlay) — no focus trap, scroll lock or portal needed; `aria-expanded`/`aria-controls`, Escape, and close-on-navigate are all handled.

### Workflows that still require `/studio`

**Intentional advanced-Studio workflows** (documented, linked from the relevant admin form, and correct for a club that should not need a bespoke editor for these):
- Portable Text (`event.description`, `event.setupInstructions`, `project.description`)
- `project.screenshots` gallery ordering
- `seo.shareImage` on any type
- Files larger than 10 MB
- Deleting something the admin's policy protects, and any reference repair

**Missing admin functionality** (not deliberate, just not built):
- Nothing. Every field the README claims `/admin` manages is genuinely managed there.

The admin never blind-writes: where it manages only part of a document it patches only those fields, so Studio-authored content survives an admin save.

---

## G. Public UI audit vs `design-reference/`

The reference (`design-reference/CSSEC Website.html`) covers ten screens at desktop and 390px: home, events index, event detail (upcoming), event detail (past), projects index, project detail, resources index, resource detail, opportunities, about — plus an "Interaction and style rules" sheet.

| Designed screen | Implementation |
| --- | --- |
| Home (desktop + 390px) | **Complete**, including the mobile-only quick-nav grid and join band |
| Events index | **Complete** |
| Event detail — upcoming | **Complete** |
| Event detail — past/archive | **Complete** |
| Projects index | **Complete** |
| Project detail | **Complete** |
| Resources index | **Complete** |
| Resource detail | **Complete** |
| Opportunities | **Complete** |
| About | **Partial** — hero, "How to join" and "Where everything lives" implemented; **"Who runs it" (officer board) and "Questions people actually ask" (FAQ) not built** |

### Intentional deviations
- No per-opportunity detail route: the schema has no slug and the design has none; rows link straight to the employer's application page.
- Microsoft Teams is described in the footer and on About but never linked (officer-only, unauthenticated page).
- The About "platform table" is hardcoded rather than CMS-driven — it describes the club's architecture, not editable content.

### Unimplemented designed states
- Officer roster cards on About.
- FAQ accordion on About.
- **No images anywhere.** The design uses project cover images and person photos; production renders none. There is no `next/image` usage, no `images.remotePatterns` for `cdn.sanity.io` in `next.config.ts`, and `src/sanity/lib/image.ts` (the URL builder) has zero importers.

### Placeholder interactions
- ⌘K search dialog (honest placeholder, see below).

### Mobile / empty states
Mobile is genuinely built, not scaled down: dedicated drawer with destination hints, mobile-only homepage sections, ≥44px touch targets on the header controls. Every public list has a *designed* empty state with its own kicker, body and action — and a separate "filters match nothing" state distinct from "there is nothing". This is unusually complete.

---

## H. Search audit

**Status: deliberately deferred placeholder. Not partially working — not working at all.**

Built today (`src/components/site/site-search.tsx`):
- Desktop field + mobile icon trigger, both `aria-haspopup="dialog"`
- ⌘/Ctrl+K global shortcut with `preventDefault`
- Native `<dialog>` → platform focus containment, Escape, background inerting
- Autofocused input, `aria-describedby` → a `role="status"` region
- Section fallback list and a keyboard-hint footer

Not built: any index, any query, any result rendering, any highlighting, and the `↑↓ NAVIGATE / ↵ OPEN` footer hints are **not wired to real behaviour**.

### Ready for a Phase 7 implementation

| Content type | Slug route | Fields worth indexing | Card fragment already exists |
| --- | --- | --- | --- |
| `event` | `/events/[slug]` | title, summary, topics, eventType | `eventCardFragment` |
| `project` | `/projects/[slug]` | name, shortDescription, techStack | `projectCardFragment` |
| `resource` | `/resources/[slug]` | title, description, topics, resourceType | `resourceCardFragment` |
| `opportunity` | *(no detail route)* | title, organization, description, skills | `opportunityCardFragment` |

The query contract is effectively already designed: four reusable card fragments in `src/sanity/queries/fragments.ts`, consistent `"slug": slug.current` projection, TypeGen coverage, and a `publicClient` pinned to the `published` perspective. A GROQ `match`-based query across these four types is the smallest sensible implementation. `opportunity` has no detail page, so a result must link to `applicationUrl` or to `/opportunities`.

---

## I. SEO audit

| Item | Status | Detail |
| --- | --- | --- |
| Root metadata | **Partial** | Title template, default title, description and `metadataBase` set in `src/app/layout.tsx`. **Hardcoded — `siteSettings.seo` is never consumed**, so the admin-editable default SEO has no effect |
| `metadataBase` origin | **Partial / risky** | `siteUrl()` prefers `NEXT_PUBLIC_SITE_URL`, then `VERCEL_PROJECT_PRODUCTION_URL`/`VERCEL_URL`, then `localhost:3000`. **`NEXT_PUBLIC_SITE_URL` is not in `.env.example`** — if unset in production, canonicals resolve to a Vercel deployment URL |
| Index page metadata | **Complete** | `/`, `/events`, `/projects`, `/resources`, `/opportunities`, `/about` each set title, description, canonical; most set `openGraph` |
| Detail page metadata | **Complete** | All three detail routes use `generateMetadata` with Sanity-sourced title/description, canonical, and `openGraph.type: 'article'`; a missing document yields no invented metadata |
| Open Graph | **Partial** | `type`, `siteName`, `locale`, per-page `title`/`description`/`url` present. **No `openGraph.images` anywhere** despite `seo.shareImage` being modelled and queried |
| Canonical handling | **Complete** | `alternates.canonical` on every public page |
| `sitemap.xml` | **Missing** | No `src/app/sitemap.ts` |
| `robots.txt` | **Missing** | No `src/app/robots.ts`. `/admin`, `/sign-in` and `/studio` are therefore not disallowed |
| Structured data | **Missing** | No JSON-LD. `Event`, `Organization` and `ItemList` are all natural fits |
| Favicon / app icons | **Partial** | Only the default `src/app/favicon.ico` from `create-next-app`. No `icon.png`, `apple-icon.png` or web manifest. `public/` still holds the Next scaffolding SVGs (`next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`) |
| Social / share images | **Missing** | No static OG image and no `opengraph-image.tsx` |

---

## J. Performance / caching audit

Confirmed from a clean `pnpm build`:

| Rendering | Routes |
| --- | --- |
| **Static + ISR (1h)** | `/`, `/about` |
| **Static** | `/_not-found`, `/studio/[[...tool]]` (`force-static`) |
| **SSG (`generateStaticParams`)** | `/events/[slug]`, `/projects/[slug]`, `/resources/[slug]` |
| **Dynamic — `searchParams`** | `/events`, `/projects`, `/resources`, `/opportunities` |
| **Dynamic — auth** | all 21 `/admin/*` routes (`force-dynamic`), `/sign-in` |
| **Dynamic — uncached by design** | `/events/[slug]/calendar.ics` (`cache: 'no-store'`) |

### Sanity cache behaviour
- `publicClient`: `useCdn: false`, `perspective: 'published'`, `stega: false`. The CDN is deliberately off — it would sit *in front* of Next's cache and keep serving stale content after a `revalidatePath`. Next's data cache (`revalidate: 3600`) is the one cache that can be invalidated, so it is the only one kept. This reasoning is correct.
- `getAdminClient()`: no CDN, `published` perspective, so an officer sees their own save immediately without seeing Studio drafts twice.
- `getWriteClient()`: `perspective: 'raw'`, correct for patching an exact document id.

### Revalidation
Six helpers in `src/lib/revalidate.ts`, one per content type, each invalidating the full set of routes that type appears on plus `/admin` as a layout. Detail routes are invalidated as *routes* (`'/events/[slug]', 'page'`) rather than concrete URLs, which correctly handles slug renames and cross-document "related" rails. Every one of the 22 actions calls exactly one helper.

### Performance risks (real, but low at club scale)
1. **The four index routes are dynamic and load every document of their type**, then filter in the page. Correct at dozens of documents per year and already noted as a known limitation. Worth revisiting only if volume changes.
2. **`generateStaticParams` in `/projects/[slug]` and `/resources/[slug]` fetches without cache options**, unlike `/events/[slug]` which passes `fetchOptions`. Cosmetic inconsistency, build-time only.
3. **`revalidatePath` on the dynamic index routes does little** — those routes were never in the full route cache. The data-cache invalidation is what actually matters, and it works. No action needed, but do not read the helper table as proof that index pages are being purged.
4. **No image optimisation configured**, which will matter the moment images are rendered — `next.config.ts` has no `images.remotePatterns` for `cdn.sanity.io`.

No premature optimisation is recommended.

---

## K. Accessibility audit

**This is a code-inspection review. It is not a WCAG conformance claim and cannot be one without a real browser, a screen reader, and an automated axe pass.**

### Patterns that look right
- **Skip link** to `#main` in the public layout, correctly `sr-only` until focused.
- **Focus rings** defined explicitly per surface: `.site-root :focus-visible` and `.admin-root :focus-visible` get a 2px green outline with offset; `.admin-sidebar` uses a lighter colour for contrast on navy. Utilities are ordered to beat shadcn's `outline-none`.
- **`prefers-reduced-motion: reduce`** honoured in both surfaces.
- **Dialogs use native `<dialog>`** (search, mobile nav) — modal semantics, focus containment, Escape and background inerting come from the platform, not a hand-rolled trap. This is the single best a11y decision in the codebase.
- **Mobile nav closes on `pathname` change**, so a back-button navigation cannot leave a sheet open over a new page.
- **Admin mobile nav is a disclosure** with `aria-expanded`/`aria-controls` — no trap needed.
- **Forms**: `src/components/admin/form-field.tsx` is the densest a11y file in the repo (31 aria/label references) — labels, descriptions, `aria-invalid` and error association are centralised, so every module inherits them.
- **Repeatable rows** are real form controls contributing to parallel arrays; every control is keyboard-operable and each row's error renders against that row.
- **Touch targets**: header controls are 44px (`h-11 w-[46px]`); nav rows are `min-h-[52px]`; search results `min-h-11`.
- **`aria-current="page"`** on active nav items in both the desktop bar and mobile drawer.
- **Decorative icons** are `aria-hidden`; the "opens in a new tab" affordance on the Studio link has an `sr-only` companion.
- **Headings**: one `<h1>` per page (the homepage's is `sr-only`, correctly, because the design has no visible page title); sections use `<h2>`.
- **Status labels** use text plus colour, never colour alone (`MonoLabel`, `LevelBadge`, `StatusBadge`, `MetaBadge`).
- **Search status** is announced via `role="status"` and linked with `aria-describedby`.

### Likely remaining manual checks
1. Colour contrast across the navy surfaces — `text-navy-faint`, `text-navy-whisper`, `text-navy-quiet` and `text-ink-faint` on their backgrounds are the plausible failures. Needs measurement.
2. Real screen-reader passes (NVDA/VoiceOver) on the search dialog, mobile drawer, and the admin remove screens.
3. Keyboard-only traversal of the filter bars — chips are links, so this is probably fine, but the "no matches" state uses `hidden` class toggling on whole sections, which should be checked for focus landing on hidden content.
4. The ⌘K footer advertises `↑↓ NAVIGATE / ↵ OPEN`, which is **not implemented** — a keyboard user is told about behaviour that does not exist.
5. `⌕` is used as a visual search glyph inside `aria-hidden` spans; verify it is never the sole accessible name (it appears not to be — both triggers have `aria-label`).
6. Zoom to 200% / 400% reflow on the data tables (archive table, opportunity table).
7. Form error focus management — whether a rejected save moves focus to the first error.
8. Axe/Lighthouse automated pass on every public route.

---

## L. Production / infrastructure audit

| Item | Status | Detail |
| --- | --- | --- |
| Vercel project | **Unknown / likely missing** | No `.vercel` directory, no `vercel.json`. Nothing in-repo indicates a linked project |
| Production environment variables | **Missing/unverified** | `.env.example` covers 6 variables but **omits `NEXT_PUBLIC_SITE_URL`**, which `src/lib/site.ts` reads and which canonical/OG URLs depend on |
| Domain | **Missing** | No custom domain referenced anywhere; `.ics` UIDs use `@cssec.fgcu` as a namespace only |
| Sanity production config | **Partial** | Dataset defaults to `production` in `.env.example`; CORS origins for the deployed domain are unverified; Studio has never been deployed |
| Clerk production config | **Missing** | README documents development-instance usage only. No production instance, no production keys |
| Authorized redirect / origin URLs | **Missing** | Clerk allowed origins and Sanity CORS both need the production domain added |
| CI | **Missing** | No `.github/` directory. The only GitHub Actions workflow on the repo is Copilot's, not a build/test pipeline. `pnpm validate` exists and is exactly what CI should run |
| Branch protection | **Missing** | `main` is unprotected (confirmed via API: HTTP 404 "Branch not protected"). Repository is **public** |
| Analytics | **Missing** | No `@vercel/analytics`, no Speed Insights, no third-party analytics |
| Error monitoring | **Missing** | No Sentry or equivalent. Admin errors are `console`-logged server-side under `[admin/<module>]` and never aggregated |
| Backups / export | **Missing** | No documented `sanity dataset export` cadence. Sanity's own history retention is the only safety net, and it is plan-dependent |
| Runtime pinning | **Complete** | `.nvmrc` = 24, `engines.node >=24 <25`, `packageManager: pnpm@11.21.0` |

---

## M. Documentation / handoff audit

The README is 454 lines and genuinely excellent — it explains *why*, not just *what*: the capability split by cost-of-mistake, `/admin` vs `/studio`, people vs officer accounts, delete-vs-archive policies, the timezone decision, and an explicit "Known limitations" section. This is far above the norm for a student club project.

| Topic | Covered? |
| --- | --- |
| Local setup | ✔ |
| Node / pnpm | ✔ (`.nvmrc`, engines, README) |
| Sanity model, TypeGen, queries | ✔ |
| Clerk roles, granting/revoking access | ✔ — including the first-user bootstrap |
| `/admin` module-by-module | ✔ |
| `/studio` and when to use it | ✔ |
| Permissions model | ✔ |
| Officer handoff (content) | ✔ — the officer-term handover process is documented |
| Environment variables | **Partial** — `NEXT_PUBLIC_SITE_URL` is undocumented and missing from `.env.example` |
| Deployments | **Missing** — no deploy guide, no Vercel setup steps, no production env checklist |
| Git workflow | **Missing** — no CONTRIBUTING, no branch/PR convention (history shows a feature-branch + PR pattern, undocumented) |
| Content workflows | ✔ |
| Troubleshooting | **Missing** — no runbook for "the site isn't updating after a save", "an officer can't sign in", "Studio won't load" |

### Stale documentation (misleads a future maintainer)
- The README status table says **Public site: "Planned"** — it is built.
- It says **`/admin`: "Live — dashboard and Events management"** — all seven modules are live.
- The Architecture section says "Events are managed here today; the remaining modules follow the same pattern" — they already do.

### Missing handoff documents
1. `docs/DEPLOYMENT.md` — Vercel project, env vars, domain, Sanity CORS, Clerk production instance.
2. `docs/OFFICER_HANDOFF.md` — the annual checklist: transfer Clerk admin, transfer Sanity project ownership, transfer the GitHub repo/org, rotate the write token.
3. `docs/TROUBLESHOOTING.md`.
4. `CONTRIBUTING.md` — branch and PR convention.

---

## N. Testing inventory

**302 tests, 33 suites, 33 files, all passing.** Node's built-in test runner; no test stack installed.

### Automated coverage

| Category | Files | Tests (approx.) |
| --- | --- | --- |
| Static security guards | 2 | 13 |
| Authorization decision logic | 1 | 10 |
| Zod input schemas (6 modules) | 6 | 69 |
| Delete/archive policies (4 modules) | 4 | 28 |
| View models / derived display (4 modules) | 4 | 54 |
| Form value round-tripping (5 modules) | 5 | 25 |
| Shared admin helpers (fields, slug, rows, references, assets) | 5 | 38 |
| Filters and URL params | 1 | 20 |
| Timezone handling | 1 | 15 |
| Calendar `.ics` generation | 1 | 9 |
| Opportunity deadline/board derivation | 2 | 14 |
| Resource linking | 1 | 7 |

Plus **build validation**: `pnpm build` enforces the `server-only` boundaries and type-checks all routes. **Schema validation**: `pnpm typegen` extracts 27 schema types and types 41 queries; a schema/query mismatch fails typecheck.

### Manual / browser coverage still needed

Nothing in this suite touches a DOM, a network call, a Clerk session, or a real Sanity document. Specifically absent:

1. **End-to-end admin round trips** — create → appears publicly → edit → delete, for all seven modules.
2. **Real authenticated session behaviour** — all ten paths listed in section E.
3. **File and image upload** against real Sanity, including rejection paths.
4. **Revalidation proof** — that a save actually changes a public page.
5. **Component/DOM tests** — no rendering test exists for any component.
6. **Accessibility automation** — no axe pass.
7. **Visual regression** vs `design-reference/`.
8. **Responsive verification** at the design's breakpoints on real devices.

**Unit tests here prove the decisions are right. They do not prove the wiring works.** That distinction is the single largest risk in this project.

---

## O. Summary of findings

### B. Completed — production-ready, retain as-is

- Foundation: Next 16 App Router, React 19 + React Compiler, TS strict, Tailwind v4, pinned Node 24 / pnpm 11.
- Centralised, validated environment access with a hard server/client split (`server-only` + zero-dependency public module so Zod never ships to the Studio bundle).
- Complete Sanity content model: 7 documents, 4 objects, 41 typed queries, TypeGen wired into `pnpm validate`, custom Studio structure with singleton locking.
- Four-client Sanity architecture with a *documented, correct* rationale for each.
- Full Clerk authentication and a capability-based authorization model, enforced at both page and Server Action level, with two tree-walking static guards.
- All seven admin modules with full CRUD, per-type delete/archive policies re-checked server-side, secure server-side uploads, reference integrity handling, and officer-facing errors that never leak internals.
- Nine complete public routes plus a working `.ics` route handler.
- Centralised revalidation, one helper per content type, called by all 22 actions.
- Correct single-timezone handling with no date library and DST-boundary tests.
- 302 passing tests; clean `lint`, `typecheck`, `typegen`, `build`.
- Genuinely designed empty states and mobile layouts throughout.

### C. Wired but not fully verified

- Every Clerk-authenticated path (see section E — ten specific paths).
- Every Sanity write, including uploads.
- Revalidation actually reaching public pages.
- The officer/admin capability boundary under a real session.
- Studio's own authentication and its independence from Clerk.
- Whether `.env.local` values point at a real, populated dataset — **all public pages currently render empty states in the audit build**, which is correct behaviour but means nothing has been seen with real content.

### D. Missing before launch — blockers

1. **Officer board on `/about`** — a whole admin module and document type with no public output. `CURRENT_OFFICERS_QUERY` is written and typed; only the UI is missing.
2. **Image rendering** — cover images and person photos are uploadable but invisible. Needs `next/image`, `images.remotePatterns` for `cdn.sanity.io`, and use of the already-written `src/sanity/lib/image.ts`.
3. **`NEXT_PUBLIC_SITE_URL`** added to `.env.example` and set in production, or canonical/OG URLs point at a Vercel deployment URL.
4. **`robots.ts` and `sitemap.ts`** — `/admin`, `/sign-in` and `/studio` are currently indexable.
5. **Favicon and app icons** — still the `create-next-app` default; scaffolding SVGs still in `public/`.
6. **Production Clerk instance** with the production domain in allowed origins.
7. **Sanity CORS origin** for the production domain.
8. **Vercel project, environment variables and domain.**
9. **README status table corrected** — it currently tells a successor the public site is unbuilt.
10. **Manual verification of the ten signed-in paths** — nothing above matters if sign-in is broken.

### E. Nice-to-have after launch — explicitly not blockers

- Global ⌘K search (Phase 7 headline feature, but the fallback is honest and usable).
- About FAQ section.
- Structured data (JSON-LD `Event` / `Organization`).
- `openGraph.images` and a generated share image.
- `siteSettings.seo` feeding root metadata.
- Analytics and error monitoring.
- Public person pages (`/people/[slug]`) — would give `person.slug` and the bio/social fields a purpose.
- Unsaved-changes warning in admin forms (deliberately deferred, with a documented mitigation).
- Portable Text editing in `/admin`.
- `↑↓ / ↵` keyboard navigation inside the search dialog.

### F. Technical debt — actual, not speculative

| Item | Why it is debt |
| --- | --- |
| `src/sanity/lib/live.ts` | `defineLive` is configured but `<SanityLive />` is never rendered and `sanityFetch` is never called. Dead, and it implies a live-content strategy the app does not use |
| `src/sanity/lib/client.ts` | Only importer is `live.ts`. Has `useCdn: true`, which **contradicts** the documented caching decision — actively misleading to a reader |
| `src/sanity/lib/image.ts` | Zero importers |
| `src/components/site/section-placeholder.tsx` | Zero importers; all sections are built |
| `public/next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg` | `create-next-app` scaffolding |
| README status table | Stale in three places; the most consequential debt because it misdirects a successor |
| `person.slug` | Stored and uniqueness-validated with no route consuming it |
| `generateStaticParams` cache inconsistency | `/projects/[slug]` and `/resources/[slug]` omit the `fetchOptions` that `/events/[slug]` passes |
| `siteSettings.socialLinks` / `teamsUrl` | Fetched into `SITE_SETTINGS_QUERY` and discarded by `getSiteLinks()` |
| `eventLocation.directions` | Modelled and edited, never rendered |
| `revalidatePeopleContent()` invalidates `/about` | For officer content `/about` does not display — harmless now, correct once the board ships |

None of this is urgent. Items 1–5 are ten minutes of deletion; the README is the one worth doing before anyone else touches the repo.

---

## P. Recommended remaining phases

Derived from the codebase, not from the assumed direction. The ordering front-loads the two things that are cheap and de-risk everything else: **fixing the docs** and **proving sign-in works**.

### Phase 7 — Close the public content gaps
*Everything here is UI over queries and admin modules that already exist.*
1. Officer board on `/about`, consuming the already-written `CURRENT_OFFICERS_QUERY`.
2. Image rendering: `next/image` + `images.remotePatterns` + the existing `urlFor` builder — project covers, person photos, officer portraits.
3. About FAQ section.
4. Global ⌘K search over `event`/`project`/`resource`/`opportunity`, using the four existing card fragments; wire the `↑↓ / ↵` contract the dialog already advertises.
5. Delete the dead modules listed under Technical debt.

**Why first:** it makes the admin work already done actually visible, and it is the last phase that is purely application code.

### Phase 8 — Production SEO, metadata and polish
1. `sitemap.ts` and `robots.ts` (disallow `/admin`, `/sign-in`, `/studio`).
2. `NEXT_PUBLIC_SITE_URL` into `.env.example`, README and Vercel.
3. Feed `siteSettings.seo` into root metadata so the admin field means something.
4. `openGraph.images` from `seo.shareImage`, plus a default share image.
5. Favicon / app icons; remove scaffolding SVGs.
6. JSON-LD `Event` and `Organization`.
7. Contrast audit and an axe pass on all nine public routes.

### Phase 9 — Deployment, CI and observability
1. Vercel project, production env vars, custom domain.
2. Clerk production instance; allowed origins and redirect URLs.
3. Sanity CORS origins; deploy the Studio if a hosted one is wanted.
4. GitHub Actions running `pnpm validate` on PRs — the script already exists.
5. Branch protection on `main` requiring that check (the repo is public and `main` is currently unprotected).
6. `@vercel/analytics` and an error monitor.
7. A documented `sanity dataset export` backup cadence.

### Phase 10 — Real-session verification and handoff
1. Work through all ten signed-in paths from section E in a real browser, against production.
2. One full admin round trip per module: create → verify public → edit → verify → remove.
3. Upload verification, including rejection paths.
4. Responsive and screen-reader passes on real devices.
5. `docs/DEPLOYMENT.md`, `docs/OFFICER_HANDOFF.md`, `docs/TROUBLESHOOTING.md`, `CONTRIBUTING.md`.
6. **Correct the README status table** (or do this today — it costs nothing and it is currently wrong).

---

## Q. Validation results

Run at audit time, all non-destructive. No Sanity content was created, mutated or deleted. No Clerk users were changed.

| Command | Result |
| --- | --- |
| `pnpm typegen` | **Pass** — 41 queries, 27 schema types, 203 files evaluated |
| `pnpm lint` | **Pass** — no warnings or errors |
| `pnpm typecheck` | **Pass** — no errors |
| `pnpm test` | **Pass** — 302 tests, 33 suites, 0 failures (~1.2s) |
| `pnpm build` | **Pass** — compiled in 18.6s, 10 static pages generated, exit 0 |
| Sanity schema validation | **Pass** — implicit in `sanity schemas extract --force`, which succeeded |

`pnpm validate` was not run as a single command because its five stages were each run individually above, with identical effect.

One non-blocking warning appears during `pnpm test`: `MODULE_TYPELESS_PACKAGE_JSON` for the `.test.ts` files, because `package.json` has no `"type": "module"`. It costs a reparse per file and nothing else.
