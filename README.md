# Water Watch Nashik

# Digital Water Genome Nashik — Frontend Build Prompt

## Product Context

Build Digital Water Genome Nashik, a civic-accountability platform for the water

bodies of Nashik District, Maharashtra, India. Guiding principle: "Don't clean

the end. Protect the beginning." This is not a generic environmental dashboard —

it combines a Google-Maps-style geographic explorer, a civic issue-reporting

tool, a water-body digital registry, an AI-assisted triage layer, and a

government/authority action-tracking workflow into one credible, deployable

civic-tech product. Every reported issue must carry a visible, traceable

lifecycle: Reported -> AI Analyzed -> Verification Requested -> Verified ->

Assigned -> Action Initiated -> Resolved. Build the architecture so the

geographic scope can expand beyond Nashik later — Nashik is the initial

dataset and focus, not a hard-coded assumption.

## Tech Stack

React + TypeScript + Vite + Tailwind CSS. Component-based and modular — no

single giant component. Folder structure:

    src/

      components/

      pages/

      layouts/

      services/api/

      hooks/

      types/

      utils/

      assets/

Keep all data-fetching and mock-data logic inside services/ (authService,

waterBodyService, issueService, aiService, mapService, analyticsService,

notificationService, userService), never inline in UI components, so a real

FastAPI + PostgreSQL backend can be swapped in later without touching the UI

layer.

## User Roles

Citizen, Field Verifier, Department/Authority, Administrator, and Public

Viewer (no account required for read-only exploration). Build role-aware

navigation and route guarding on the frontend — note in code comments that

this is UX only; real authorization is enforced server-side later.

## Design Language

Colors: primary deep green #1E5631 (brand/primary CTAs), water blue #0B6E8C

(map/links/info), warm background #F6F5F1, white surfaces #FFFFFF, border

#E2E0D8, text #1B1F1D / #5B6360. Semantic: success/resolved #2F8558,

warning/medium/in-progress #C08A12, critical/high #A6362B, under-verification

#3B6FA0, assigned #6A4C93 (its own hue so the 7-state status system stays

readable). Severity ramp low to critical: #5B8F63 -> #C08A12 -> #C1622B ->

#A6362B. Never encode status or severity with color alone — always pair with

an icon and a text label.

Type: Fraunces (serif) for hero/H1/H2 display moments only, used with

restraint; Public Sans for all body copy, UI, and dashboards; IBM Plex Mono

for report IDs, coordinates, and timestamps so data reads as data, not prose.

Restraint: no decorative gradients, no glassmorphism, no neon accents,

minimal shadows (reserve elevation for map overlays, drawers, and modals

only). Radius: 6px controls, 10px cards, pill shape reserved for

badges/chips only. Motion stays functional (state transitions, drawer

slide-ins) rather than decorative — no scroll animations or micro-interactions

just for flourish.

This must read as a serious civic/government platform, not a startup SaaS

template or a generic AI-generated dashboard.

Signature element: the lifecycle Timeline (a vertical stepper: Reported ->

AI Analyzed -> Verification Requested -> Verified -> Assigned -> Action

Initiated -> Resolved) is the one place allowed real visual personality —

it's the product's actual differentiator. It appears live on Report Detail

and as a static explainer on the landing page. Keep everything else (cards,

tables, badges) quiet and disciplined so the Timeline stands out as

intentional.

## Navigation (role-aware)

- Public: Home, Explore, Map, About, Report Issue, Login

- Citizen: Dashboard, Map, Water Bodies, Report Issue, My Reports,

  Notifications, Profile

- Verifier: Verification Queue, Notifications

- Authority: Dashboard, Issues, Verification, Water Bodies, Map, Analytics,

  Notifications

- Admin: Dashboard, Users, Departments, Water Bodies, Reports, Analytics,

  Audit Logs, Settings

## Pages to Build

Public: Landing page, Water Bodies Explorer (search/filter/sort, list+grid

toggle), Water Body Detail (overview, status, reported issues, map,

timeline, stats), public Map, About, How It Works, Login, Register.

Citizen: Dashboard (4 stat cards, recent reports, quick actions), Report an

Issue (5-step: location -> evidence -> description -> category ->

review/submit, then a confirmation screen with Report ID), My Reports

(filterable: all/pending/under verification/in progress/resolved), Report

Detail (full lifecycle timeline, evidence, AI assessment, verification

notes, assigned department, action notes, resolution evidence),

Notifications, Profile.

Field Verifier: Verification Queue (pending reports with location, evidence,

AI assessment, description, severity, submitted time; actions: Verify /

Reject / Request more info), Report Verify screen.

Authority: Dashboard (action-first metrics, Priority Issues list sortable by

severity/location/age/verification status), Issue Management (View -> Assign

-> Act -> Resolve workflow per issue, evidence review, AI assessment review,

notes, action-evidence upload), Verification Queue, Water Bodies (assigned),

Map, Analytics.

Admin: Dashboard, Users (view/activate-deactivate/assign roles), Departments

(view/assign responsibility), Water Bodies (add/edit/view/manage metadata),

Reports (view/moderate/track), Analytics, Audit Logs, Settings.

Reuse the Map and Water Bodies Explorer pages across roles — vary only the

available actions (citizen sees "Report here," authority sees "View assigned

issues") instead of building separate pages per role.

## Landing Page

Hero (platform name, principle line, two CTAs: "Explore Water Bodies" /

"Report an Issue") -> live map preview -> problem statement -> "how it

works" (the 7-stage accountability trail, rendered with the Timeline

component in a static explainer mode) -> water-body stats strip -> recent

reported issues feed -> pollution hotspot teaser -> AI capability explainer

(hedged language) -> final CTA band. Must feel like a serious

civic-technology platform, not a corporate SaaS template.

## Map Experience (core feature, not a secondary tab)

Full-bleed interactive map, structured so a real map provider (Mapbox /

Leaflet / Google Maps) can be dropped in later without touching surrounding

UI. Layers: rivers, dams, lakes, ponds, reservoirs — rivers as lines, the

rest as translucent polygons. Issue markers colored by severity, clustered

at low zoom. One floating control cluster: search, zoom, locate-me, layer

toggle, filters, legend — keep it minimal, do not overcrowd. Selecting a

water body or issue opens a side drawer (bottom sheet on mobile), never a

modal, so map context stays visible. The drawer includes a "Report here"

shortcut.

## Report an Issue Flow

5 steps + confirmation, mobile-first (field-collected reports are a primary

use case): (1) Location — map pin, current-location button, or select an

existing water body; (2) Evidence — photo upload with direct mobile camera

capture, multi-image, thumbnail grid; (3) Description — guided textarea;

(4) Category — configurable chip select (waste dumping, sewage discharge,

industrial pollution, dead fish/ecological concern, plastic waste,

encroachment, illegal discharge, water obstruction, other); (5) Review &

Submit. Confirmation screen shows Report ID, water body, submitted date,

initial status "Reported," and an "AI is analyzing your report" indicator.

## AI Assessment UI

A visually distinct card (accent border/tint + small "AI" chip so it never

reads as human-verified fact) showing: Possible Issue, Estimated Severity,

Possible Cause, Confidence (%), and a plain-language Reason. Always use

hedged wording — "AI assessment," "possible cause," "estimated severity" —

never a verdict. Mock the response for now (clearly commented as mock) but

shape aiService so a real endpoint can replace it later. Human verifiers and

authorities always make the final call, never the AI.

## Dashboards

Citizen: stat cards for submitted / under verification / under action /

resolved; recent reports; quick actions.

Authority: action-first, not decorative — frame metrics as next actions

("7 high-priority issues need action today," never just a bare count);

Priority Issues list; every row exposes View -> Assign -> Act -> Resolve.

Verification Queue: triage list with the AI assessment surfaced for

prioritization.

Admin: user/department/water-body/report management plus system

activity/audit log.

Analytics: issues over time, by category, by severity, by water body, by

geography (hotspots via the map's heat layer), resolution rate, average

resolution time, active vs. resolved. Use clearly labeled mock data — never

let a screen imply real statistics that don't exist yet.

## Components to Build (reusable, never duplicated per page)

Navbar, Sidebar, StatCard, WaterBodyCard, IssueCard, StatusBadge (7 states:

Reported/Under Verification/Verified/Assigned/In Progress/Resolved/

Rejected — pill + icon), SeverityBadge (Low/Medium/High/Critical — dot/bar,

visually distinct from StatusBadge), MapContainer, FilterPanel, SearchBar,

Timeline, EvidenceUploader, AIAnalysisCard, NotificationPanel, DataTable

(sortable, paginated, badge-aware), EmptyState, LoadingState (skeletons

matching the final layout), ErrorState (with a retry action),

ConfirmationModal.

## Data States

Every data view needs all four: loading (skeleton), empty (specific and

actionable — e.g. "No reports yet — report an issue to start tracking it

here," not just "No data"), error (states what happened plus a retry

action, no apology), and a success confirmation that echoes the verb of the

action that triggered it ("Resolve Issue" -> "Issue resolved"). Also handle

offline/network failure with an explicit message rather than failing

silently.

## Responsive Behavior

Full support for desktop, laptop, tablet, and mobile. Dashboards and the map

get mobile-adapted layouts (side drawers become bottom sheets). The

reporting flow is mobile-first since field-collected reports are a primary

use case.

## Mock Data

Use realistic mock data for every screen, structurally identical to what a

REST API would return, fully isolated inside services/, so replacing mocks

with real FastAPI + PostgreSQL calls later requires no component rewrites.

Don't let any screen depend on fabricated statistics that read as

authoritative.

## What to Avoid

Generic SaaS-template look, neon/cyberpunk gradients, heavy glassmorphism,

overcrowded dashboards, excessive animation, presenting AI output as ground

truth, hard-coding the Nashik geography into the architecture itself (only

the dataset should be Nashik-specific), and one giant monolithic component.

Every screen should make clear what needs attention and what should happen

next — especially on the Authority dashboard.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/27b50a21-edf6-4858-8b31-09c87807076e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
