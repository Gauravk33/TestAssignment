# TeamSpace — Build Plan & Progress Tracker
### Notion + Trello + Slack inspired Mini SaaS — Due Thursday

**Core model:** `Workspace → Page (doc | board | channel) → Block/List+Card/Message`, plus `Comment`, `AuditLog`, `Attachment` shared across all page types.

Check items off as you go. Each day ends with a **"Definition of Done"** — if you hit that, you're on track. If not, use the day's Cut List before moving on.

---

## DAY 0 — Tuesday Evening (Setup + Auth Skeleton)
**Goal: `docker compose up` works, and you can register/login/refresh a JWT.**

### Repo & Infra
- [x] Init repo, push empty commit (`chore: init repo`)
- [x] Create folder structure: `/api`, `/client`, `/docs`
- [x] `docker-compose.yml` with services: `api`, `client`, `mongo`, `redis` (even if api/client are empty shells)
- [x] Confirm `docker compose up` boots all 4 containers without crashing
- [x] Commit: `chore: docker compose skeleton boots`

### Backend Foundation
- [x] Express/Fastify app skeleton, `/health` endpoint
- [x] Mongoose connection to Mongo container
- [x] Folder structure inside `/api`: `models/`, `routes/`, `controllers/`, `services/`, `middleware/`, `config/`
- [x] Models: `User`, `Workspace`, `Membership` (role: owner/admin/editor/viewer)
- [x] Commit: `feat: base models + db connection`

### Auth (JWT + Refresh + RBAC)
- [x] `POST /auth/register`
- [x] `POST /auth/login` → access token (short-lived) + refresh token (httpOnly cookie or long-lived JWT)
- [x] `POST /auth/refresh`
- [x] `POST /auth/logout`
- [x] Middleware: `requireAuth` (verifies JWT)
- [x] Middleware: `requireRole(workspaceId, [roles])` (RBAC check via Membership)
- [x] Commit: `feat: JWT auth + refresh tokens + RBAC middleware`

### Frontend Skeleton
- [x] Vite + React app boots inside Docker
- [x] React Router set up: `/login`, `/register`, `/workspace/:id`
- [x] Zustand (or RTK) auth store: token, user, login/logout actions
- [x] Login/Register forms using React Hook Form
- [x] Commit: `feat: frontend auth pages + routing`

**✅ Definition of Done (Day 0):** You can register a user via the UI, log in, get redirected, and refresh token silently works. `docker compose up` is one command away from a working app.

---

## DAY 1 — Wednesday (All Backend Core APIs)
**Goal: 35-40 endpoints exist and should be working. This is your heaviest day.**

### Morning Block: Workspace + Page
- [x] Workspace: `POST /workspaces`, `GET /workspaces`, `GET /workspaces/:id`, `PATCH /workspaces/:id`, `DELETE /workspaces/:id`
- [x] Membership: `POST /workspaces/:id/invite`, `PATCH /workspaces/:id/members/:userId` (change role)
- [x] Page model (type: doc/board/channel, parentId for nesting)
- [x] Page: `POST /pages`, `GET /pages/:id`, `GET /pages/tree?workspaceId=`, `PATCH /pages/:id`, `DELETE /pages/:id`, `PATCH /pages/:id/move` (change parent)
- [x] Commit after each resource works: `feat: workspace CRUD`, `feat: page CRUD + tree`

### Midday Block: Blocks (Notion) + List/Card (Trello)
- [x] Block model + `POST/GET/PATCH/DELETE /blocks`
- [x] Block: `PATCH /blocks/reorder` — **wrap in a Mongo transaction**
- [x] List model + Card model (belongs to board-type Page)
- [x] List/Card CRUD endpoints
- [x] **Card move endpoint** (`PATCH /cards/:id/move`): transaction that updates card's listId + position, AND writes an AuditLog entry, atomically
- [x] Wire Socket.io: emit `card:moved` and `block:updated` on these actions
- [x] Commit: `feat: blocks CRUD`, `feat: list+card CRUD`, `feat: card move transaction + socket emit`

### Afternoon Block: Messages (Slack) + Comments
- [x] Message model (channel-type Page)
- [x] `POST /pages/:id/messages`, `GET /pages/:id/messages?cursor=` (pagination for infinite scroll)
- [x] Socket.io: `channel:message` event, join/leave room per workspace or page
- [x] Comment model (attachable to Page/Block/Card via polymorphic ref)
- [x] Comment CRUD + `GET /comments?targetId=`
- [x] Commit: `feat: messages + realtime channel`, `feat: threaded comments`

### Evening Block: Supporting Systems
- [x] AuditLog: `GET /audit-logs?workspaceId=&page=` (paginated)
- [x] Search: text index on Page/Block/Card/Message, `GET /search?q=&workspaceId=`
- [x] Attachments: `POST /attachments` (multer upload), `DELETE /attachments/:id`, link to Block/Card
- [x] Aggregation endpoint: `GET /workspaces/:id/stats` (cards per list, messages/day, blocks by type — use `$facet`)
- [x] Redis: cache `GET /pages/tree` and `GET /pages/:id`, invalidate on any write to that workspace
- [x] BullMQ: one job — `weekly-digest` (queue + worker, just needs to log/write a DigestLog doc)
- [x] Swagger: annotate all routes so far, confirm `/api-docs` renders
- [x] Commit after each: keep commits granular (`feat: audit logs`, `feat: search endpoint`, `feat: redis caching on page reads`, `feat: bullmq digest job`, `docs: swagger annotations`)

**✅ Definition of Done (Day 1):** Every endpoint listed above returns correct data in Postman/Swagger UI. Card-move transaction and Redis cache are demonstrably working (check Mongo/Redis directly if needed). Endpoint count is 35+.

**⚠️ If behind schedule tonight:** Cut BullMQ digest to a stub that just enqueues + logs (don't build retry/scheduling logic). Cut search ranking — plain regex match is fine.

---

## DAY 2 — Thursday Morning (Frontend Build)
**Goal: A working, clickable UI showing all three "modes" (doc/board/channel) with real-time + drag & drop.**

### Core Shell (early morning)
- [ ] Sidebar: recursive nested page tree component (cap depth at 2-3 levels)
- [ ] Workspace switcher + member list (shows RBAC roles)
- [ ] Page router: renders `<DocView>`, `<BoardView>`, or `<ChannelView>` based on `page.type`
- [ ] Dark mode toggle (CSS variables, persisted in localStorage)
- [ ] Error boundary wrapping the main page view
- [ ] Commit: `feat: app shell + page type routing + dark mode`

### DocView (Notion)
- [ ] Render list of blocks, click-to-edit (contentEditable or simple textarea per block)
- [ ] Debounced auto-save on block edit → optimistic update, then PATCH to server
- [ ] Add/delete block buttons
- [ ] Commit: `feat: doc view with optimistic block editing`

### BoardView (Trello)
- [ ] Render Lists with Cards inside (dnd-kit or react-beautiful-dnd)
- [ ] Drag card between lists → optimistic reorder in UI immediately
- [ ] On drop: fire PATCH to `/cards/:id/move`, roll back UI if it fails
- [ ] Listen for `card:moved` socket event → update board if another user moves a card
- [ ] Commit: `feat: board view drag-and-drop + optimistic UI + realtime sync`

### ChannelView (Slack)
- [ ] Message list, newest at bottom
- [ ] Infinite scroll upward to load older messages (cursor-based)
- [ ] Send message → optimistic append, socket confirms
- [ ] Listen for `channel:message` socket event → live-append messages from others
- [ ] Commit: `feat: channel view with realtime messaging + infinite scroll`

### Comments + Offline
- [ ] Comment panel (attach to current Page/Card/Block), threaded, real-time
- [ ] Basic offline support: cache last-loaded page in localStorage, show "offline — showing cached data" banner if fetch fails
- [ ] Commit: `feat: comments panel`, `feat: basic offline fallback`

**✅ Definition of Done (Day 2 Morning):** You can open two browser tabs, drag a card in one and watch it move live in the other. You can send a chat message in one tab and see it appear in the other. Dark mode and error boundary both visibly work.

**⚠️ If behind schedule:** Cut comment threading to flat (no nested replies). Cut infinite scroll to a simple "Load more" button if drag-and-drop time overruns — DnD is more visually impressive for the demo, prioritize it.

---

## DAY 2 — Thursday Afternoon (Tests, Docs, Polish, Submission)
**Goal: Everything is documented, tested where it counts, and reproducible from a clean clone.**

### Tests (prioritize depth over %)
- [ ] Auth flow test (register/login/refresh/invalid token rejected)
- [ ] RBAC test (viewer role blocked from write endpoint)
- [ ] Card-move transaction test (confirm atomicity — card in only one list after move)
- [ ] Aggregation endpoint test (stats return expected shape)
- [ ] Run coverage report, aim 60%+; if short, add quick tests to your simplest CRUD routes to close the gap
- [ ] Commit: `test: auth, rbac, transaction, aggregation coverage`

### CI/CD
- [ ] GitHub Actions workflow: install → lint → test on push
- [ ] Confirm it passes on a fresh push
- [ ] Commit: `ci: add github actions pipeline`

### Documentation
- [ ] README: project overview, tech stack, setup steps (`docker compose up` should be the only command needed), feature list, **"what's simplified and why"** section (be upfront — this builds credibility)
- [ ] Architecture diagram (Mermaid in README): client ↔ api ↔ mongo/redis/bullmq, socket.io layer
- [ ] ER diagram (Mermaid in README): Workspace, Membership, Page, Block, List, Card, Message, Comment, AuditLog, Attachment relationships
- [ ] API docs: confirm Swagger UI is complete and reachable at `/api-docs`
- [ ] Commit: `docs: README, architecture diagram, ER diagram`

### Final Polish
- [ ] Clean clone the repo into a fresh folder, run `docker compose up`, confirm zero manual steps needed
- [ ] Skim git log — squash any "wip"/"fix typo" junk commits into meaningful ones if it's a mess (but don't fabricate fake history)
- [ ] Confirm commit count is 40+
- [ ] Prepare your **demo script**: 3-minute walkthrough of the card-drag-transaction-socket flow + live chat, since this is your strongest live-debugging asset
- [ ] Final commit: `chore: final polish + submission ready`

**✅ Definition of Done (Day 2 Afternoon / Final):** Clean clone → `docker compose up` → fully working app with no manual steps. README + diagrams complete. Tests pass in CI. You can explain every layer of your flagship feature out loud without hesitation.

---

## Quick Reference: Cut List (only if truly out of time, in this order)
1. Message threading → flat channel, no nested replies
2. Search → basic regex/text match, no ranking
3. Offline support → cache + banner only, no sync-on-reconnect
4. BullMQ job → stub that logs + writes to DB, skip real scheduling/retry
5. Nested page tree → cap at 2 levels
6. Rich block types → text/todo/card only, skip images/embeds
7. Test coverage → focus on auth/RBAC/transaction/aggregation only, accept lower % elsewhere

## Never Cut
- Working auth + RBAC
- The card-move Mongo transaction + audit log
- `docker compose up` working from a clean clone
- Swagger reachable at `/api-docs`
- Real, incremental git history (40+ genuine commits)
- One rock-solid real-time flow you can explain end-to-end live