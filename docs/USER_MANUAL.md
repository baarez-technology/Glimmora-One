# Glimmora ONE — User Manual

> **This is a living document.** Whenever a feature is added, removed, or changed, update the matching section *in the same commit* as the code change. If you remove a feature, remove its section — don't leave stale instructions behind. The "Changelog" at the bottom is the diary; everything above it should describe the app *as it is right now*.

**Last updated:** 2026-05-12
**Applies to app version:** 0.2.1

For the *engineering* design behind the user-facing flows described here (roles matrix, state machines, where each flow lives in code), see [`docs/PRODUCT_FLOWS.md`](./PRODUCT_FLOWS.md).

For a step-by-step QA walkthrough with screenshots, see [`docs/TESTING_GUIDE.md`](./TESTING_GUIDE.md).

---

## Table of contents

1. [What Glimmora ONE is](#1-what-glimmora-one-is)
2. [Accounts & access](#2-accounts--access)
3. [Onboarding](#3-onboarding)
4. [The daily ritual — "Today's three small steps"](#4-the-daily-ritual--todays-three-small-steps)
5. [The AI companion](#5-the-ai-companion)
6. [Stories — the OTT library](#6-stories--the-ott-library)
7. [Reflection journal & digital twin](#7-reflection-journal--digital-twin)
8. [Paths — content tuned to your focus](#8-paths--content-tuned-to-your-focus)
9. [Circles — the community space](#9-circles--the-community-space)
10. [Profile & membership](#10-profile--membership)
11. [Becoming a creator](#11-becoming-a-creator)
12. [Creator studio](#12-creator-studio)
13. [Admin tools](#13-admin-tools)
14. [Troubleshooting](#14-troubleshooting)
15. [Safety & boundaries](#15-safety--boundaries)
16. [Changelog](#16-changelog)
17. [How to keep this manual current](#17-how-to-keep-this-manual-current)

---

## 1. What Glimmora ONE is

Glimmora ONE is a calm space for inner work. It combines:

- **A guided four-step onboarding** that asks just enough to make the app feel personal.
- **A daily ritual** — three small, optional steps that anchor the practice.
- **An AI companion** that listens, classifies emotional tone, and offers a single question to sit with.
- **A library of short, guided video journeys** ("Stories"), each ending with a reflection prompt.
- **A personal reflection journal** that quietly becomes a map of your inner weather — your **Digital Twin**.
- **Paths** — collections of stories tuned to the focus areas you picked at onboarding.
- **Community circles** for anonymous, slow conversation with others on the same path.
- **A creator workflow** — anyone can apply to publish journeys; admins approve.

It is **not** a therapist, a crisis service, or a coach. See [Safety & boundaries](#15-safety--boundaries).

---

## 2. Accounts & access

### Creating an account
1. Open the landing page and click **Begin**, or go to `/signup`.
2. Provide a **username** and a **password** (both required, 1+ char). Email and display name are **optional**.
3. You'll be signed in immediately and routed to onboarding.

If you don't provide an email, a placeholder address (`<username>@noemail.local`) is stored internally so the system has something to key on — you'll still log in by username + password and we won't email you.

### Signing in / out
- `/login` accepts either username or email + password. Sessions live in a secure httpOnly cookie (`glimmora_session`) for 24 hours by default.
- Sign out from the top-right of the app shell.

### Default development account
On first boot a superadmin is created automatically:
- **Username:** `superadmin`
- **Password:** value of `BOOTSTRAP_SUPERADMIN_PASSWORD` (defaults to `ChangeMe!2026`)

### Roles
There are four roles, each additive:

| Role | What it grants |
|---|---|
| **Member** (default) | Use the app, write reflections, post in circles, apply to be a creator. |
| **Creator** | Publish series and episodes; see analytics for your own content. |
| **Admin** | Approve creator applications, moderate flagged posts, change other users' roles, view platform stats. |
| **Superadmin** | Everything; the only role that can grant *another* superadmin. |

### Tiers
- **Free** — full companion (short memory), all free Stories, journal, three circles.
- **Premium** — long companion memory, all premium content, all circles, digital twin insights, creator tools.
- Switch from **Profile → Membership** (in dev, the upgrade button flips you instantly; real billing webhooks plug in later).

Role is *what you're trusted to do*. Tier is *what you've paid for*. Admins bypass tier gating for content.

---

## 3. Onboarding

URL: `/onboarding`

After signup (or any time you sign in before completing it), you'll see a four-step quiet sequence. Each step is one card; **Skip for now** is always present in the corner.

| Step | What we ask | Why |
|---|---|---|
| 1 — Welcome | Your name (or any handle you like) and a few words on what brought you here. | Anchors the companion in a real person. |
| 2 — Intention | "In one sentence — what do you hope shifts, even a little?" | Steers companion tone and quietly appears on your dashboard. |
| 3 — Focus | Pick up to four areas: *stillness, becoming, emotion, grief, joy, relationships, work, sleep, creativity*. | Drives **Paths** recommendations on the dashboard. |
| 4 — Begin | A soft confirmation; your companion writes its first hello. | Sets the tone — present, gentle, not pushy. |

After step 4 you land on `/dashboard`. The companion now has a first message waiting in **A first hello** (in your conversation list).

You can skip any step. Skipping the whole flow marks you as onboarded with empty preferences; the app still works, but the dashboard's personalization (intention quote, Paths) will be sparse.

---

## 4. The daily ritual — "Today's three small steps"

URL: `/dashboard`

The dashboard's heartbeat. Three small, optional steps each day:

| Step | What counts as done | Where it sends you |
|---|---|---|
| 1 — **Arrive** | Any message you send to the companion today. | `/companion` |
| 2 — **Notice** | Watching at least ~60 seconds of any episode today. | `/watch` |
| 3 — **Reflect** | Saving any journal entry today. | `/reflect/new` |

Completing a step turns it gold and shows a check. Completing all three increments your **streak** (consecutive days ending today). The card refreshes daily at midnight UTC.

There are **no push notifications or nags** — by design. The steps show up only when you open the app.

The dashboard also shows: a greeting tuned to time of day, your intention (if you set one), the featured journey, your **Paths** (next section), continue-watching, and a quiet inner-weather summary.

---

## 5. The AI companion

URL: `/companion`

### Starting a conversation
- The first time, four soft starter prompts appear — click one or type your own.
- After your first message a conversation is created automatically and appears in your conversation list.

### How it responds
- The companion classifies the emotional tone of your message (one of: *sad, anxious, angry, joyful, lonely, confused, hopeful, neutral*). The detected emotion appears as a small tag below your message.
- The reply is short (2-5 sentences), warm, and present-tense. It never diagnoses or lectures.
- After replying, the companion may offer **one question to sit with**. Click "Write a reflection on this →" to start a journal entry pre-filled with that prompt.

### When `OPENAI_API_KEY` is set
- The companion uses GPT-4o-mini (configurable via `OPENAI_MODEL`) and can adapt across the conversation.
- It can recommend specific episodes from the catalog when relevant (based on keyword themes it derives from your message).

### When `OPENAI_API_KEY` is **not** set
- The companion gracefully falls back to a deterministic, rule-based responder. Replies are softer and shorter, the emotion tag uses a keyword lexicon, and episode recommendations are skipped. Your UX is never broken — but it's clearly less responsive.

### Crisis safety
- If your message explicitly mentions suicide, self-harm, or intent to die, a soft **"Stay with someone tonight"** card appears alongside the assistant reply. It lists crisis lines (India, US/Canada, UK/ROI, and a global directory) and reminds you it's okay to keep writing. It does not call services, does not change app state, and does not interrupt the conversation.

### Privacy
- Conversations are stored under your account. Only you (and platform admins, if escalated) can read them.
- Deleting a conversation removes it and all its messages from the database immediately.

---

## 6. Stories — the OTT library

URL: `/watch`

### Browsing
- Series are grouped by **category** (meditation, growth, emotional-intelligence, etc.).
- Premium series carry a small gold "premium" badge in the top-right.

### Series detail (`/watch/<series-slug>`)
- Cover hero, full description, tag pills, and the ordered episode list. Click **Begin** to open the first episode.

### Episode player (`/watch/<series-slug>/<episode-slug>`)
- Adaptive HLS streaming (native on Safari, `hls.js` elsewhere).
- **Progress is saved every ~10 seconds**; "Continue watching" picks it up on the dashboard.
- When the video ends — or any time during playback — the **reflection prompt** for that episode is offered. You can write a short reflection in place; it's saved to your journal and linked back to the episode.
- A **Next** card at the bottom takes you to the next episode in the series.

### Premium gating
If you try to open a premium episode on a free account, the API returns 402 and the UI surfaces an error. Upgrade in **Profile → Membership** to unlock.

---

## 7. Reflection journal & digital twin

URL: `/reflect`

### Stats at the top
- **Reflections** — total entries.
- **Day streak** — consecutive days ending today with at least one entry.
- **Most-present** — your most frequent mood across all entries.
- **Avg. intensity** — average of the 1-10 intensity slider.

### 30-day trend chart
Each bar is one day. Bar height = average intensity that day. Bar color = dominant mood. Empty days appear as faint stubs.

### Journal feed
Most recent first. Each entry shows: relative time, mood tag, intensity, the prompt (if any), the body, and — when AI is enabled — a one-sentence "noticing" generated by the companion (✦ in glimmer color).

### Milestones
Auto-derived: first reflection, week of noticing, 30 entries, streak achievements, dominant feeling.

### Threads (tag cloud)
Aggregates the comma-separated tags you've added to entries. More frequent tags appear larger.

### Writing a reflection (`/reflect/new`)
- Optional pre-filled prompt (passed via `?prompt=…` from the companion or an episode).
- Required: a body (at least one character).
- Optional: mood (one of eight pills), intensity slider (1-10), threads (comma-separated tags).

---

## 8. Paths — content tuned to your focus

The **Paths for you** section on the dashboard surfaces series whose category aligns with the focus areas you picked at onboarding. Examples:

| Your focus | Categories shown |
|---|---|
| stillness, sleep, work | meditation |
| becoming, work, creativity | growth |
| emotion, grief, joy, relationships | emotional-intelligence |

If you skipped onboarding (or chose no focus areas), Paths falls back to the four most recent series.

You can edit your focus areas any time by re-running onboarding (`/onboarding`) — submitting the form replaces what's there. *(A direct "Edit focus" UI on the profile page is on the roadmap.)*

---

## 9. Circles — the community space

URL: `/circles`

### How circles work
Three themes ship by default: **The Quiet Circle**, **Becoming**, **First Light**. You appear under a soft anonymous handle (e.g. "Steady River") that is deterministic per-(you, circle) — within one circle people see a consistent name without knowing it's you.

### Posting
Open a circle, type into the share box, hit **Share**. A lightweight safety filter blocks a small set of harmful phrases at the API layer.

### Reporting
Each post has a small **Report** button. Reported posts are hidden from the feed immediately and surfaced in the admin queue.

---

## 10. Profile & membership

URL: `/profile`

### You
Edit your **name**, **bio**, and **avatar URL** — saved with one click. Email and username are set at signup and immutable through the UI for now.

### Membership
Shows your current tier and its features. **Try premium →** flips you to premium instantly in dev; in production this routes through a billing provider.

---

## 11. Becoming a creator

URL: `/creator/apply`

Anyone with a Member account can apply. Tell us, in your own words:
- **Pitch** — what kind of journey you'd create, who it's for, why it matters.
- **Sample / portfolio** (optional) — a link to your existing work.

After you submit, the application sits in `pending`. You'll see its status whenever you return to the apply page. An admin reviews each application by hand:

- **Approved** → your role flips to *creator* and you can open `/creator` (Studio) from the sidebar.
- **Denied** → your role stays as member; you're welcome to apply again later.

You can only have one pending application at a time.

---

## 12. Creator studio

URL: `/creator` *(visible only to creators, admins, and superadmins)*

### Overview
- **Stats** — series count, episode count, total people who started watching, completions.
- **Your series** — every series you own, with a "preview" link and a quick "+ Add episode" button.

### Creating a series (`/creator/series/new`)
Fields: title, slug (lowercase-hyphenated; this lives in the URL), tagline, description, category (meditation/growth/emotional-intelligence/wisdom), tier (free/premium), cover image URL, hero image URL, accent color, comma-separated tags.

### Adding an episode (`/creator/series/<id>/episodes/new`)
Fields: title, slug, synopsis, duration in seconds, order index (lower = earlier), **video URL** (HLS `.m3u8` or `.mp4`), poster URL, reflection prompt (the one quiet question shown after the episode plays), tier.

For now, video files are referenced by URL — Glimmora doesn't host the transcoding pipeline. Use any HLS-capable host (Mux, Cloudflare Stream, your own S3 + MediaConvert, etc.) and paste the manifest URL.

### Permissions
You can only edit your own series. Admins and superadmins can edit any.

---

## 13. Admin tools

URL: `/admin` *(visible only to users with role `admin` or `superadmin`)*

### What's here
- **Platform stats** — counts of users, series, episodes, reflections, conversations, posts.
- **Creator applications** — each pending application with the pitch and (if provided) sample link. Two buttons: **Approve** (flips the user to *creator* and marks the application approved) and **Deny** (leaves the role unchanged, marks the application denied).
- **Users table** — every user with role, tier, and active status.

### Backend endpoints already wired
- `PATCH /v1/admin/users/{id}/role` — change a user's role (`member`, `creator`, `admin`, `superadmin`).
- `PATCH /v1/admin/users/{id}/active` — disable / re-enable an account.
- `GET   /v1/admin/flagged-posts` — fetch reported community posts.
- `DELETE /v1/admin/posts/{id}` — remove a community post.

*(In-table role and active toggles, and a flagged-post moderation queue UI, are on the roadmap.)*

---

## 14. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Logged in but stuck at `/onboarding` | Hasn't been completed or skipped. | Run through the four steps or click **Skip for now**. |
| `JWT_SECRET is not configured` on Next start | `.env.local` missing in `apps/web/`. | Copy `.env.example` to `apps/web/.env.local`, set `JWT_SECRET` (must match `backend/.env`). |
| Login succeeds, then redirected to `/login` | Mismatched `JWT_SECRET` between web and api. | Make the two values identical and restart both processes. |
| Companion replies are short and never recommend episodes | `OPENAI_API_KEY` is unset. | Add a key to `backend/.env`; restart the API. |
| `Continue watching` empty after watching | Progress isn't being beaconed. | Check browser console for `/api/proxy/v1/content/progress` 4xx responses. |
| Video player shows a black box | HLS stream blocked. | Demo streams are public Mux test feeds; some networks block them. Self-host or substitute. |
| Creator studio shows "Apply to become a creator" instead of dashboard | Your role is still `member`. | Submit `/creator/apply`; wait for admin approval. |
| `greenlet_spawn has not been called` errors in API logs | A SQLAlchemy async relationship was lazy-loaded outside a session context. | Eager-load with `selectinload(...)` in the offending query. |
| Backend tables missing in prod | Alembic didn't run. | Confirm the `migrate` PRE_DEPLOY job in `.do/app.yaml` succeeded. |

---

## 15. Safety & boundaries

Glimmora ONE is a companion, not a clinician. It does not provide medical advice, diagnose conditions, or offer therapy. If you are in crisis or considering harming yourself, please reach out to someone you trust or a local crisis line — the companion will surface these resources automatically if it detects crisis language.

- Your reflections and chats are stored under your account. They are not shared with other users.
- Community circles are anonymous to other users but **not** anonymous to platform administrators — moderation requires that link.
- Posts are subject to a lightweight write-time blocklist. Reported posts are hidden from public view immediately and reviewed by admins.

---

## 16. Changelog

> Newest at top. One line per release. Keep entries short — sections above describe *current* behavior, not history.

- **2026-05-12 — v0.2.1** — signup now redirects straight to onboarding (no dashboard flicker). Sidebar shows `Role · Tier` (e.g. *Member · free*, *Creator · free*). Profile gained a **Your role** card with a role-aware CTA. Dashboard's "apply to become a creator" callout hides once an application exists; a "we're reading your application" card appears while pending. Theme toggle is now on login + signup. Added [`docs/TESTING_GUIDE.md`](./TESTING_GUIDE.md) with screenshots.
- **2026-05-11 — v0.2.0** — added onboarding (`/onboarding`), the daily-ritual loop on the dashboard ("three small steps"), focus-area-tuned **Paths**, the creator application flow (`/creator/apply`) with admin review, the creator studio (`/creator`, `/creator/series/new`, `/creator/series/<id>/episodes/new`), the crisis safety card in the companion, and the roles/permissions matrix in `PRODUCT_FLOWS.md`. New backend modules: `routers/dashboard.py`, `models.CreatorApplication`, alembic `0002_creator_apps`.
- **2026-05-11 — v0.1.1** — signup loosened: username + password 1-char minimum, email optional. If email omitted, a `<username>@noemail.local` placeholder is stored.
- **2026-05-11 — v0.1.0** — initial release.

---

## 17. How to keep this manual current

### When to update
In the same PR as any code change that affects:
- A user-visible page, button, or flow.
- Copy a user reads in the app.
- An API endpoint a user-facing feature relies on.
- Default values, tiers, roles, or auth behavior.
- Safety guardrails or moderation rules.

### How to update
1. Edit the relevant numbered section so it describes the *new* current behavior. **Don't** add "now we also have X" — describe X as if it always existed.
2. If you remove a feature, remove its section entirely.
3. If you rename a route or endpoint, update every reference (search for the old name first).
4. Bump the `Last updated` date at the top.
5. Bump `Applies to app version` if you also bumped the version in `package.json` / `pyproject.toml`.
6. Add a one-line entry to the [Changelog](#16-changelog) (newest at top).
7. If the change involves roles, permissions, lifecycle states, or new workflows, also update `docs/PRODUCT_FLOWS.md`.

### What NOT to put here
- Architecture, deployment, env vars, or stack details — those live in `README.md` and `SKELETON.md`.
- Code examples, schema definitions, or migration instructions — those belong in developer docs.
- Marketing copy — keep the tone direct and informational.

### Tone
- Calm, plain, complete sentences. No jargon a new user wouldn't understand.
- Speak to the user as "you." Refer to the product as "Glimmora ONE" or "the app."
- If a feature is partial or in dev-only mode (e.g. the upgrade button), say so plainly.
