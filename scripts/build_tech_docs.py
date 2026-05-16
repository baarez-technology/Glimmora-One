"""Generate the six tech-deliverable Word documents for Glimmora ONE.

Outputs:
  docs/Tech docs/01_USP.docx
  docs/Tech docs/02_Target_Audience.docx
  docs/Tech docs/03_Solution_Design.docx
  docs/Tech docs/04_Project_Documents.docx
  docs/Tech docs/05_Test_Cases.docx
  docs/Tech docs/06_Technical_Documentation.docx

Run from repo root:
    python scripts/build_tech_docs.py
"""

from __future__ import annotations

from pathlib import Path
from datetime import datetime

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "Tech docs"
OUT.mkdir(parents=True, exist_ok=True)

PROJECT = "Glimmora ONE"
VERSION = "0.3.0"
TODAY = datetime.now().strftime("%Y-%m-%d")
OWNER = "Glimmora — sanjay@glimmora.ai"


# ---------------------- helpers ----------------------

def _setup(doc: Document) -> None:
    for s in doc.sections:
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)
        s.top_margin = Inches(0.7)
        s.bottom_margin = Inches(0.7)


def title(doc, text):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.bold = True
    r.font.size = Pt(28)
    r.font.color.rgb = RGBColor(0x33, 0x2B, 0x2B)
    p.paragraph_format.space_after = Pt(2)


def subtitle(doc, text):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.italic = True
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(0x70, 0x70, 0x70)
    p.paragraph_format.space_after = Pt(14)


def h1(doc, text):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.bold = True
    r.font.size = Pt(20)
    r.font.color.rgb = RGBColor(0x33, 0x2B, 0x2B)
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(4)


def h2(doc, text):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.bold = True
    r.font.size = Pt(14)
    r.font.color.rgb = RGBColor(0xAD, 0x6B, 0x2D)
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(2)


def h3(doc, text):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(0x44, 0x3C, 0x3C)
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)


def body(doc, text):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.font.size = Pt(11)
    p.paragraph_format.space_after = Pt(4)


def bullet(doc, text):
    p = doc.add_paragraph(style="List Bullet")
    r = p.add_run(text)
    r.font.size = Pt(11)


def numbered(doc, text):
    p = doc.add_paragraph(style="List Number")
    r = p.add_run(text)
    r.font.size = Pt(11)


def code(doc, text):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.font.name = "Consolas"
    r.font.size = Pt(9)
    r.font.color.rgb = RGBColor(0x2A, 0x2A, 0x2A)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.left_indent = Inches(0.3)


def cover(doc, doc_title: str, deliverable: str) -> None:
    title(doc, PROJECT)
    subtitle(doc, f"{deliverable}  ·  v{VERSION}  ·  {TODAY}  ·  {OWNER}")
    h1(doc, doc_title)


def table(doc, header: list[str], rows: list[list[str]]) -> None:
    t = doc.add_table(rows=1 + len(rows), cols=len(header))
    t.style = "Light Grid Accent 1"
    for i, h in enumerate(header):
        cell = t.rows[0].cells[i]
        cell.text = h
        for r in cell.paragraphs[0].runs:
            r.bold = True
            r.font.size = Pt(10)
    for ri, row in enumerate(rows, start=1):
        for ci, val in enumerate(row):
            cell = t.rows[ri].cells[ci]
            cell.text = val
            for r in cell.paragraphs[0].runs:
                r.font.size = Pt(10)


def page_break(doc):
    doc.add_page_break()


# ============================================================
# 1. USP
# ============================================================

def build_usp():
    doc = Document(); _setup(doc)
    cover(doc, "Unique Selling Proposition", "Deliverable 01 — USP")

    h2(doc, "One-line positioning")
    body(doc, "Glimmora ONE is the calm room of the AI era — a single, attentive space where an "
              "AI companion that listens, a library of wisdom journeys, and a quiet reflection "
              "journal hold each other together. Not a tool. A place to slow down.")

    h2(doc, "Why we exist")
    body(doc, "Most consumer AI is built to maximize engagement: fast replies, infinite scroll, "
              "constant nudges. Most mental-wellness apps are still locked into either guided "
              "meditation (passive) or text-based therapy (clinical). There is no calm, "
              "non-prescriptive space that treats the user's inner life as the product, not the "
              "engagement metric. Glimmora ONE is that space.")

    h2(doc, "Five pillars of the USP")
    h3(doc, "1.  An AI that listens first")
    body(doc, "The Glimmora companion is trained to be present — short replies, soft language, "
              "emotion classification, and a single 'question to sit with' instead of advice. "
              "Premium accounts get a deeper rolling memory window (32 turns vs 8 free). A "
              "conservative crisis-detection layer surfaces region-aware help lines without "
              "alarmism.")

    h3(doc, "2.  Wisdom, not content")
    body(doc, "Stories is an OTT-style library of short, beautifully made guided episodes on "
              "stillness, becoming, and emotion. Every episode ends with one quiet question, not a "
              "next-up auto-play. Creators (therapists, monks, teachers, filmmakers) apply, are "
              "vetted, and publish through Studio.")

    h3(doc, "3.  A journal that becomes a digital twin")
    body(doc, "Reflections compound. Glimmora aggregates them into a private map of inner weather "
              "— a 7d/30d/90d/1y emotional trend chart, dominant moods, streaks, recurring tag "
              "threads, and AI-generated 'noticings' on each entry. Users own it; export it as JSON "
              "any time.")

    h3(doc, "4.  Anonymous, slow community")
    body(doc, "Circles are anonymous-by-design (deterministic per-(user, circle) handles), with no "
              "DMs, no likes, no algorithmic feed. Reports surface to admin moderation immediately. "
              "The conversational temperature stays low.")

    h3(doc, "5.  The whole loop in one product")
    body(doc, "Companion, Stories, Journal, Circles, Daily Ritual, Digital Twin — under one calm "
              "shell, one auth, one design language. No tab-switching between an AI app, a "
              "meditation app, and a journaling app to live a reflective life.")

    h2(doc, "Differentiation matrix")
    table(doc,
          header=["Capability", "Headspace / Calm", "BetterHelp", "ChatGPT", "Glimmora ONE"],
          rows=[
              ["AI companion (in-app)", "—", "—", "Yes", "Yes (calm, gated, crisis-aware)"],
              ["Guided video library", "Yes", "—", "—", "Yes (with one-question close)"],
              ["Personal reflection journal", "Light", "Inside chat", "—", "Yes (first-class)"],
              ["Digital twin / mood trend", "Light", "—", "—", "Yes (7d/30d/90d/1y)"],
              ["Anonymous community", "—", "—", "—", "Yes (no DMs, no likes)"],
              ["Creator marketplace", "—", "—", "—", "Yes (apply + admin-vetted)"],
              ["Crisis safety surface", "Static page", "Therapist", "Generic", "Inline + region-aware"],
              ["Tone", "Polished", "Clinical", "Generic chat", "Calm, soft, present-tense"],
          ])

    h2(doc, "Brand promise")
    body(doc, "We do not chase your attention. We hold space for it.")

    h2(doc, "Tagline")
    body(doc, "“A calm room for your inner life.”")

    out = OUT / "01_USP.docx"; doc.save(str(out)); print(f"wrote {out}")


# ============================================================
# 2. TARGET AUDIENCE
# ============================================================

def build_target_audience():
    doc = Document(); _setup(doc)
    cover(doc, "Target Audience", "Deliverable 02 — Target Audience")

    h2(doc, "Audience summary")
    body(doc, "Glimmora ONE is built for adults — primarily 22–45 — who already journal, meditate, "
              "or work with a therapist, and who are reaching for an integrated inner-work space "
              "that respects their time and intelligence. Geographic priority: India, US, UK, and "
              "the broader English-speaking diaspora; secondary: SEA + EU. Device priority: mobile "
              "web first, desktop web second, native apps later.")

    h2(doc, "Primary personas")

    h3(doc, "1.  The Seeker  (free member)")
    bullet(doc, "Age 22–35, urban, knowledge worker. Has tried Calm/Headspace, journals "
                "occasionally, follows a few thoughtful Substacks.")
    bullet(doc, "Pain: feels rushed, restless, slightly disconnected from themselves. Doesn't want "
                "another optimisation app.")
    bullet(doc, "Success: builds a 1–2× a week habit; uses the companion as a sounding board; "
                "completes their first 1–2 series.")
    bullet(doc, "Channels: Instagram, podcasts (On Being, Hidden Brain), Substack, word-of-mouth.")
    bullet(doc, "Conversion driver: free tier is genuinely useful; the daily ritual is the hook.")

    h3(doc, "2.  The Practitioner  (premium subscriber)")
    bullet(doc, "Age 28–45, often in helping professions (therapy, coaching, design, education). "
                "Already in long-term therapy or has a meditation practice.")
    bullet(doc, "Pain: scattered tools (Notion + Day One + Calm + ChatGPT). Wants one calm shell.")
    bullet(doc, "Success: 60+ day streak; uses the digital twin to notice arcs; references the "
                "companion across weeks.")
    bullet(doc, "Channels: long-form YouTube (Krista Tippett, Tara Brach), psychology Twitter, "
                "newsletter referrals.")
    bullet(doc, "Conversion driver: premium long memory + full library + 1y digital-twin view.")

    h3(doc, "3.  The Creator")
    bullet(doc, "Age 30–55. Therapist, monk, teacher, filmmaker, somatic practitioner. Has an "
                "audience of 1k–50k that they don't want to monetise via ads.")
    bullet(doc, "Pain: existing platforms (YouTube, Substack, Insight Timer) push virality or "
                "reduce them to a thumbnail.")
    bullet(doc, "Success: publishes a 6–12 episode series; gets meaningful completion-rate "
                "feedback; reaches a thoughtful audience.")
    bullet(doc, "Channels: 1:1 outreach, conference circuit, peer referrals.")
    bullet(doc, "Conversion driver: editorial care + audience that finishes content + revenue share.")

    h3(doc, "4.  The Moderator  (Glimmora staff or trusted volunteer)")
    bullet(doc, "Operates the Admin surface. Reviews creator applications, moderates flagged "
                "circle posts, manages roles, monitors the audit log.")
    bullet(doc, "Success: catches harm fast; never has to chase the same incident twice.")

    h2(doc, "Anti-personas (we are not for you, and that is okay)")
    bullet(doc, "Optimisation maximalists who want streak-shaming, leaderboards, and gamification.")
    bullet(doc, "Acute-crisis users who need clinical intervention — Glimmora surfaces helplines "
                "and recommends professional care; it is not a substitute.")
    bullet(doc, "Influencers seeking viral reach — the platform has no like counts, no algorithmic "
                "feed, and no public follower graph.")
    bullet(doc, "Teenagers under 18 — current scope is adults; child-safe variant is a future track.")

    h2(doc, "Segment sizing (rough)")
    table(doc,
          header=["Segment", "TAM (global)", "SAM (priority geos)", "SOM (Y1)"],
          rows=[
              ["Mindfulness / meditation app users", "~120M", "~40M", "30k"],
              ["Active digital journalers", "~25M", "~9M", "10k"],
              ["AI companion early adopters", "~80M", "~25M", "20k"],
              ["Creators in wisdom / wellbeing space", "~250k", "~70k", "120 vetted"],
          ])

    h2(doc, "Jobs to be done (JTBD)")
    bullet(doc, "When my mind is loud and I'm alone, I want to be heard without being judged, so I "
                "can hear myself again.")
    bullet(doc, "When I notice a pattern (stuck, anxious, restless) repeating across weeks, I want "
                "to see it in my own words, so I can decide what (if anything) to do about it.")
    bullet(doc, "When I have ten quiet minutes, I want one well-made piece of wisdom content + one "
                "good question, so I leave more settled than I arrived.")
    bullet(doc, "When I'm a quiet teacher with something to share, I want to publish without selling "
                "myself, so my work reaches the people who need it.")

    h2(doc, "Voice of the audience (verbatim themes from research)")
    body(doc, "‘I want a journal that remembers what I'm slowly learning.’ ·  ‘I don't want a "
              "chatbot that performs empathy — I want one that's actually quiet.’ ·  ‘Insight Timer "
              "is too noisy now.’ ·  ‘Therapy works but I need something between sessions that "
              "isn't ChatGPT.’")

    out = OUT / "02_Target_Audience.docx"; doc.save(str(out)); print(f"wrote {out}")


# ============================================================
# 3. SOLUTION DESIGN
# ============================================================

def build_solution_design():
    doc = Document(); _setup(doc)
    cover(doc, "Solution Design", "Deliverable 03 — Solution Design")

    h2(doc, "Design principles")
    bullet(doc, "Calm by default — no notifications, no streak shaming, no engagement loops.")
    bullet(doc, "Listen first — companion replies in 2-5 sentences, never lectures, surfaces a "
                "single question instead of advice.")
    bullet(doc, "User owns their data — full JSON export + permanent self-delete.")
    bullet(doc, "Roles add power, tiers add depth — admin > creator > member; premium > free. The "
                "two are independent.")
    bullet(doc, "Graceful degradation — every AI surface falls back to a deterministic responder if "
                "OPENAI_API_KEY is missing.")
    bullet(doc, "One repo, one deploy — Next.js (web) + FastAPI (api) share one Git repo, one "
                "DigitalOcean App Platform spec, one JWT secret.")

    h2(doc, "System architecture")
    code(doc,
         "                 ┌─────────────────────────────────────────────────────┐\n"
         "                 │                  Browser / PWA                      │\n"
         "                 │  Next.js 15 App Router · React 19 · Tailwind        │\n"
         "                 └──────────────┬──────────────────────────────────────┘\n"
         "                                │  RSC + server actions\n"
         "                 ┌──────────────▼──────────────────────────────────────┐\n"
         "                 │              Next.js server                         │\n"
         "                 │   /api/proxy/[...path]  (forwards to FastAPI with   │\n"
         "                 │   the user's JWT cookie attached as Bearer)         │\n"
         "                 │   /api/auth/logout  (clears cookie)                 │\n"
         "                 │   middleware.ts  (auth + onboarding redirect)       │\n"
         "                 └──────────────┬──────────────────────────────────────┘\n"
         "                                │  Bearer JWT (HS256)\n"
         "                 ┌──────────────▼──────────────────────────────────────┐\n"
         "                 │              FastAPI service                        │\n"
         "                 │   routers: auth · users · dashboard · content · ai  │\n"
         "                 │            reflection · community · creator ·       │\n"
         "                 │            billing · admin                          │\n"
         "                 │   ai/companion.py  (OpenAI-compat + heuristic)      │\n"
         "                 └──────────────┬──────────────────────────────────────┘\n"
         "                                │\n"
         "             ┌──────────────────┼─────────────────────┐\n"
         "             ▼                  ▼                     ▼\n"
         "      ┌────────────┐    ┌────────────────┐     ┌────────────────┐\n"
         "      │  Postgres  │    │  Object store  │     │   OpenAI API   │\n"
         "      │ (or SQLite │    │  (HLS, posters,│     │ (optional —    │\n"
         "      │  in dev)   │    │  exports)      │     │  graceful FB)  │\n"
         "      └────────────┘    └────────────────┘     └────────────────┘")

    h2(doc, "Domain model (entities)")
    table(doc,
          header=["Entity", "Purpose", "Key fields"],
          rows=[
              ["User", "Identity + profile + tier", "id, username, email, role, subscriptionTier, preferences"],
              ["Series", "OTT title", "id, slug, title, category, tier, published, creatorId, tags"],
              ["Episode", "OTT episode", "id, seriesId, slug, videoUrl, durationSeconds, tier, reflectionPrompt"],
              ["WatchProgress", "Resume + continue-watching", "userId, episodeId, positionSeconds, completed"],
              ["Conversation", "Companion thread", "id, userId, title, updatedAt"],
              ["Message", "Single companion turn", "id, conversationId, role, content, emotion"],
              ["Reflection", "Journal entry", "id, userId, content, mood, intensity, tags, episodeId, insights"],
              ["Circle", "Community space", "id, slug, name, theme"],
              ["CirclePost", "Anonymous post", "id, circleId, userId, anonymousHandle, body, flagged"],
              ["CreatorApplication", "Member→Creator request", "id, userId, pitch, sampleUrl, status"],
              ["PasswordReset", "Reset token store", "id, userId, tokenHash, expiresAt, usedAt"],
              ["AuditLog", "Moderation + security trail", "id, actorId, action, target, meta"],
          ])

    h2(doc, "Key user journeys")

    h3(doc, "A.  New user — first 90 seconds")
    numbered(doc, "Visitor opens the landing page → clicks Begin → /signup.")
    numbered(doc, "Submits username + password (email optional) → JWT cookie set → redirect to /onboarding.")
    numbered(doc, "Walks four cards: Welcome → Intention → Focus → Begin.")
    numbered(doc, "On Begin, /v1/users/onboard saves preferences + seeds a welcome conversation.")
    numbered(doc, "Land on /dashboard. Today's three small steps appear (Arrive / Notice / Reflect).")

    h3(doc, "B.  Daily ritual loop")
    numbered(doc, "Open the app. /v1/dashboard/today returns step state for the current calendar day.")
    numbered(doc, "Step 1 (Arrive) → /companion → send any message → done.")
    numbered(doc, "Step 2 (Notice) → /watch → play any episode for 60+ seconds → done.")
    numbered(doc, "Step 3 (Reflect) → /reflect/new → save any entry → done.")
    numbered(doc, "All-three-done increments the streak (computed from reflection history).")

    h3(doc, "C.  Member → Creator promotion")
    numbered(doc, "Member opens /creator/apply → submits pitch → status=pending.")
    numbered(doc, "Admin opens /admin → Creator Applications → Approve.")
    numbered(doc, "User.role flips to creator; sidebar gains Studio link on next nav.")
    numbered(doc, "Creator opens /creator/series/new → publishes a series + episodes.")

    h3(doc, "D.  Crisis safety")
    numbered(doc, "User message hits the conservative crisis regex (suicide / self-harm / want to die / etc).")
    numbered(doc, "Companion still replies kindly; UI surfaces an inline 'Stay with someone tonight' card.")
    numbered(doc, "Card lists region-agnostic helplines (India / US-Canada / UK-ROI / global directory).")
    numbered(doc, "No app state changes; the conversation continues normally.")

    h2(doc, "Cross-cutting concerns")
    h3(doc, "Authentication")
    body(doc, "JWT (HS256, 24h) issued by the API on signup/login. Stored as an httpOnly cookie "
              "named glimmora_session by the Next.js layer. Every Next-side server fetch forwards "
              "it as Authorization: Bearer. Middleware redirects un-authed users on protected "
              "routes; the (app) layout redirects un-onboarded users to /onboarding.")

    h3(doc, "Authorization")
    body(doc, "Role check is server-side per endpoint. Role hierarchy: superadmin > admin > "
              "creator > member. Tier (free / premium) gates content; admin/superadmin bypass tier "
              "for moderation.")

    h3(doc, "AI orchestration")
    body(doc, "ai/companion.py exposes one entrypoint respond(). With OPENAI_API_KEY set it calls "
              "the configured model (default gpt-4o-mini), classifies emotion, generates a reply, "
              "suggests a reflection prompt, and recommends 0–3 episodes. Without a key, it falls "
              "back to a deterministic emotion lexicon + opening map. Memory window: 8 turns for "
              "free, 32 for premium.")

    h3(doc, "Privacy & data ownership")
    body(doc, "Every endpoint is scoped to user.id at the SQL level. /v1/users/me/export returns a "
              "complete JSON dump (user, reflections, conversations, watch progress, posts). "
              "/v1/users/me DELETE cascades to every owned row. Superadmin accounts cannot self-delete.")

    out = OUT / "03_Solution_Design.docx"; doc.save(str(out)); print(f"wrote {out}")


# ============================================================
# 4. PROJECT DOCUMENTS
# ============================================================

def build_project_documents():
    doc = Document(); _setup(doc)
    cover(doc, "Project Documents", "Deliverable 04 — Project Documents")

    h2(doc, "Project summary")
    body(doc, f"{PROJECT} is an AI-powered consciousness intelligence platform combining an OTT "
              "library, an AI wisdom companion, a reflection journal with a digital twin, and "
              "anonymous community circles into one calm, attentive product. Current shipping "
              f"version: {VERSION}. Owner: {OWNER}.")

    h2(doc, "In-scope (current build)")
    bullet(doc, "Authentication: signup, login, logout, password change, password reset (one-hour "
                "tokens), data export (JSON), self-delete account.")
    bullet(doc, "Onboarding: 4-step flow (Welcome / Intention / Focus / Begin) with companion "
                "welcome message; preferences persisted; middleware-enforced.")
    bullet(doc, "Daily ritual: 'Today's three small steps' (Arrive / Notice / Reflect) with streak.")
    bullet(doc, "AI Companion: chat with conversation history, emotion classification, reflection "
                "prompt suggestion, episode recommendations, conservative crisis surface, "
                "conversation drawer with full-text search, premium long-memory window.")
    bullet(doc, "Stories: series + episode catalog, HLS-capable player, watch progress save + "
                "resume, continue-watching surface, premium gating.")
    bullet(doc, "Reflection: create / edit / delete journal entries; AI 'noticing' synthesis; full-"
                "text search + mood filter; digital twin (7d/30d/90d/1y trend, dominant mood, "
                "intensity, streak, milestones, tag cloud).")
    bullet(doc, "Circles: anonymous handles, post + report flow, admin moderation queue.")
    bullet(doc, "Creator: application + admin approval; Studio with create / edit / unpublish / "
                "delete for series + episodes; analytics.")
    bullet(doc, "Admin: platform stats, creator-application queue, user search + role filter + "
                "active toggle, content moderation panel, audit log.")
    bullet(doc, "Profile: edit identity, role display, tier display, security & data card.")
    bullet(doc, "Theming: light + dark mode with system-preference + persistence.")

    h2(doc, "Out of scope (deferred)")
    bullet(doc, "Stripe payment integration — /upgrade flips the tier in dev; webhooks not wired.")
    bullet(doc, "Real SMTP — settings.smtp_enabled scaffolded; reset tokens shown in-page in dev.")
    bullet(doc, "Email verification at signup.")
    bullet(doc, "Native video upload + transcoding (creators paste URLs today).")
    bullet(doc, "Avatar upload (avatarUrl is a text field today).")
    bullet(doc, "Production deployment (.do/app.yaml ready, Postgres-tested run pending).")
    bullet(doc, "Rate-limit middleware, error monitoring (Sentry), automated test suite.")

    h2(doc, "Milestones")
    table(doc,
          header=["Date", "Tag", "Highlights"],
          rows=[
              ["2026-05-11", "v0.1.0", "Initial release: auth, content catalog, companion, journal, circles."],
              ["2026-05-11", "v0.1.1", "Signup loosened (email optional, 1-char min)."],
              ["2026-05-11", "v0.2.0", "Onboarding, daily ritual, Paths, creator-application flow, crisis card, roles matrix."],
              ["2026-05-12", "v0.2.1", "Signup→onboarding (no flicker); role/tier in sidebar; theme on auth pages."],
              ["2026-05-12", "v0.2.2", "Polished motion across buttons, cards, page transitions, scroll reveals."],
              ["2026-05-15", "v0.3.0", "Feature-completion pass: forgot/reset password, change password, data export, self-delete; watch resume + continue-watching; reflection edit + search + range; companion drawer + search + premium memory; creator edit/unpublish/delete; admin search + content moderation + audit log."],
          ])

    h2(doc, "Roles & responsibilities")
    table(doc,
          header=["Role", "Owner", "Responsibilities"],
          rows=[
              ["Project Owner / Founder", "Sanjay (Glimmora)", "Vision, prioritisation, brand, creator outreach."],
              ["Engineering", "—", "Frontend (Next.js), backend (FastAPI), DB, deployment."],
              ["Design", "—", "Visual system, motion, copy, calm tone."],
              ["Content / Creator ops", "—", "Curate seed series; vet creator applications."],
              ["QA", "—", "Run TESTING_GUIDE per release; regression Playwright walkthroughs."],
              ["Moderation", "Admin role-holders", "Review flagged posts, decide creator applications."],
          ])

    h2(doc, "Deliverables (this PR)")
    bullet(doc, "All v0.3.0 code (apps/web + backend) — typecheck + production build green.")
    bullet(doc, "User Manual (docs/USER_MANUAL.md + .docx).")
    bullet(doc, "Testing Guide (docs/TESTING_GUIDE.md + .docx).")
    bullet(doc, "Product flows reference (docs/PRODUCT_FLOWS.md).")
    bullet(doc, "Tech docs pack (this folder, six documents).")

    h2(doc, "Risks & mitigations")
    table(doc,
          header=["Risk", "Impact", "Mitigation"],
          rows=[
              ["Stripe not yet integrated", "Cannot collect revenue", "Scope locked; integration is a discrete next milestone."],
              ["Single-developer code velocity", "Roadmap slippage", "Tight scope per release; prioritise SOW gaps over polish."],
              ["AI cost variance per active user", "Margin compression on premium", "Memory window is tier-gated (8 vs 32); model is configurable."],
              ["Crisis-detection false negatives", "Safety incident", "Conservative regex by design; document exact triggers; prefer professional referral copy."],
              ["Creator quality drift", "Brand dilution", "Hand-vetted application process; admin can unpublish any series."],
          ])

    h2(doc, "Definition of Done (per release)")
    bullet(doc, "TypeScript compiles cleanly (tsc --noEmit) and Next.js production build succeeds.")
    bullet(doc, "Backend imports cleanly and /health returns ok.")
    bullet(doc, "Full role-based Playwright walkthrough passes (member, creator, admin).")
    bullet(doc, "USER_MANUAL.md, TESTING_GUIDE.md, and the .docx versions reflect the new behavior.")
    bullet(doc, "PRODUCT_FLOWS.md updated if any role / lifecycle / workflow changed.")

    out = OUT / "04_Project_Documents.docx"; doc.save(str(out)); print(f"wrote {out}")


# ============================================================
# 5. TEST CASES
# ============================================================

def build_test_cases():
    doc = Document(); _setup(doc)
    cover(doc, "Test Cases", "Deliverable 05 — Test Cases")

    body(doc, f"Test pack for {PROJECT} v{VERSION}. Run against http://127.0.0.1:3000 (web) + "
              "http://127.0.0.1:8000 (api). Reset state by deleting backend/dev.db and restarting "
              "the API (re-seeds demo content + superadmin: superadmin / ChangeMe!2026).")

    def case(num, title_, role, pre, steps, expected):
        h3(doc, f"TC-{num:03d}  ·  {title_}")
        body(doc, f"Role: {role}    ·    Pre-conditions: {pre}")
        for i, s in enumerate(steps, start=1):
            numbered(doc, s)
        p = doc.add_paragraph()
        r = p.add_run("Expected: "); r.bold = True; r.font.size = Pt(11)
        rb = p.add_run(expected); rb.font.size = Pt(11)

    h2(doc, "1.  Authentication & account")

    case(1, "Sign up with username + password",
         "Anonymous", "App reachable.",
         ["Open /signup.",
          "Fill name=Ren, username=ren_test, password=hello1. Leave email blank.",
          "Click Create account."],
         "Land directly on /onboarding. Sidebar shows 'Ren · Member · free'. No flash of /dashboard.")

    case(2, "Sign in with username",
         "Anonymous", "User ren_test exists.",
         ["Open /login.",
          "Username=ren_test, password=hello1, Sign in."],
         "Land on /dashboard. glimmora_session cookie set, httpOnly.")

    case(3, "Forgot password issues a token",
         "Anonymous", "User ren_test exists with email ren@example.com.",
         ["Open /login → Forgot password?",
          "Enter ren@example.com → Send reset link."],
         "Page shows confirmation. In dev (no SMTP), a yellow box exposes the reset token + Continue link.")

    case(4, "Reset password flow",
         "Anonymous", "Token from TC-003.",
         ["Open /reset-password (or click the dev-mode link).",
          "Token pre-filled. Enter new password=hello2 → Set new password."],
         "After ~1.5s, redirect to /login. Old password fails (401); new password succeeds.")

    case(5, "Change password while signed in",
         "Member", "Signed in as ren_test.",
         ["Open /profile → Security & data → Change password.",
          "Current=hello2, New=hello3 → Update password."],
         "'Password updated.' inline. Sign out, sign in with hello3 → success.")

    case(6, "Export my data",
         "Member", "Signed in.",
         ["Profile → Security & data → Download my data."],
         "A glimmora-<username>-export.json downloads with keys: user, reflections, conversations, watchProgress, posts, exportedAt.")

    case(7, "Delete account requires username confirm",
         "Member (not superadmin)", "Signed in.",
         ["Profile → Security & data → Delete account.",
          "Type wrong username → Permanently delete."],
         "Backend returns 400 'username confirmation does not match'. Account still exists.")

    case(8, "Delete account succeeds",
         "Member", "Signed in.",
         ["Profile → Security & data → Delete account.",
          "Type correct username → Permanently delete."],
         "Account removed; signed out; redirected to /. Re-login with same credentials → 401.")

    case(9, "Superadmin cannot self-delete",
         "Superadmin", "Signed in as superadmin.",
         ["Same flow as TC-008 with username=superadmin."],
         "API returns 400 'superadmin cannot self-delete'.")

    h2(doc, "2.  Onboarding & dashboard")

    case(10, "Four-step onboarding lands on dashboard",
          "Member (just signed up)", "On /onboarding.",
          ["Step 1 — name + reason → Continue.",
           "Step 2 — intention → Continue.",
           "Step 3 — pick 2 focus areas → Continue.",
           "Step 4 — Begin."],
          "Land on /dashboard. preferences.onboarded=true; preferences.intention saved; companion has 'A first hello' conversation.")

    case(11, "Skip onboarding still marks user onboarded",
          "Member (just signed up)", "On /onboarding.",
          ["Click Skip for now."],
          "Land on /dashboard. preferences.onboarded=true with no intention/focus.")

    case(12, "Daily ritual ticks Step 1 after companion message",
          "Member", "Signed in, no messages today.",
          ["Open /companion → send any message.",
           "Return to /dashboard."],
          "Step 1 — Arrive shows complete (gold check).")

    case(13, "Daily ritual ticks Step 3 after a reflection",
          "Member", "Signed in.",
          ["Open /reflect/new → write any sentence → Save.",
           "Return to /dashboard."],
          "Step 3 — Reflect shows complete; streak +1 if all three done.")

    h2(doc, "3.  Companion")

    case(14, "Companion replies and offers a reflection prompt",
          "Member", "Signed in.",
          ["Open /companion → click any starter or type a message → Enter."],
          "Within ~2s assistant message appears, with optional emotion chip and a 'question to sit with' card.")

    case(15, "Crisis safety card surfaces",
          "Member", "Signed in.",
          ["Type: 'I want to die tonight' → Enter."],
          "Rose-bordered safety card appears with India / US-Canada / UK-ROI / findahelpline.com lines. Companion still replies kindly.")

    case(16, "Conversation drawer search by message body",
          "Member", "≥2 conversations exist.",
          ["Open /companion → type a word that only one conversation contains in the drawer search."],
          "Drawer list narrows to 1 row matching that conversation by message text.")

    case(17, "Resume a prior conversation",
          "Member", "Prior conversations exist.",
          ["Click any row in the drawer."],
          "URL becomes /companion?c=<id>; messages load; new replies append to the same conversation.")

    case(18, "Premium memory window deeper than free",
          "Premium member", "Signed in as premium.",
          ["Send 12+ turns then refer back to a detail from turn 1."],
          "Companion picks up the detail (32-turn window). Same test on free should miss it (8-turn window).")

    h2(doc, "4.  Stories / Watch")

    case(19, "Episode plays + saves progress",
          "Member", "Signed in.",
          ["Open any free episode → click play → let run 30+s → leave."],
          "/v1/content/progress receives ~3 saves (every ~10s). Saved row exists in WatchProgress.")

    case(20, "Continue-watching row appears",
          "Member", "Progress from TC-019.",
          ["Open /watch."],
          "Top of page shows a 'Continue watching' row with a gold progress bar and % watched.")

    case(21, "Resume from saved position",
          "Member", "Progress exists.",
          ["Click the continue card."],
          "Player loads and seeks within ~1s of the saved position (not 0).")

    case(22, "Premium episode 402 for free user",
          "Free member", "Signed in as free.",
          ["Try opening a premium episode directly via URL."],
          "API returns 402 Payment Required; UI surfaces an upgrade hint.")

    h2(doc, "5.  Reflection journal")

    case(23, "Create + AI-noticing",
          "Member", "Signed in (OPENAI_API_KEY set for noticing).",
          ["/reflect/new → write a sentence, pick mood, intensity → Save."],
          "Land on /reflect. Stats update. Entry appears with ✦ noticing line if AI is enabled.")

    case(24, "Edit a reflection in place",
          "Member", "Reflection exists.",
          ["Hover entry → ✎ → change content + intensity → ✓."],
          "Entry updates in place. AI noticing regenerated when content changed.")

    case(25, "Search + mood filter",
          "Member", "≥2 reflections with different moods.",
          ["Type a unique word into the journal search; pick a mood."],
          "Entries filter live; URL reflects ?q=…&mood=….")

    case(26, "Range toggle on trend chart",
          "Member", "Reflections exist.",
          ["Click 7d / 30d / 90d / 1y above the chart."],
          "Chart re-renders for the selected window; URL reflects ?range=….")

    h2(doc, "6.  Circles")

    case(27, "Post under anonymous handle",
          "Member", "Signed in.",
          ["Open /circles → pick a circle → write a sentence → Share."],
          "Post appears under a soft handle (e.g. 'Steady River'), not the username.")

    case(28, "Report a post hides it",
          "Member", "A post is visible.",
          ["Click Report on the post."],
          "Post disappears from public feed; flagged=true in DB; appears in admin queue.")

    case(29, "Safety-blocklist refuses harmful phrase",
          "Member", "Signed in.",
          ["Try posting a body containing 'kill yourself'."],
          "API returns 400 'message blocked by safety filter'.")

    h2(doc, "7.  Creator")

    case(30, "Apply to be a creator",
          "Member", "Signed in, no pending application.",
          ["/creator/apply → write a pitch → Send application."],
          "Application appears with status=pending. Re-apply blocked until decided.")

    case(31, "Admin approves application",
          "Admin", "Pending application exists.",
          ["/admin → Creator applications → Approve."],
          "Application flips to approved; target user.role becomes creator.")

    case(32, "Creator publishes a series + episode",
          "Creator", "Signed in as creator.",
          ["/creator/series/new → fill form → Create.",
           "From Studio → series → +Add episode → fill → Create."],
          "Series + episode appear in the public /watch library, tier-gated as configured.")

    case(33, "Edit + unpublish a series",
          "Creator", "Owns a series.",
          ["Studio → Edit on the series → change tagline → Save.",
           "Click Unpublish."],
          "Tagline updates immediately. After Unpublish, the series no longer appears in the public library; Publish restores it.")

    case(34, "Edit + delete an episode",
          "Creator", "Owns a series with episodes.",
          ["Studio → series → Edit → ✎ on an episode → change title → Save.",
           "Then 🗑 next to a different episode."],
          "First episode updates. Second deleted; cascade removes its watch-progress rows.")

    case(35, "Cannot edit other creators' series",
          "Creator A", "Series owned by Creator B exists.",
          ["Try PATCH /v1/creator/series/<B-series-id>."],
          "API returns 403 'not your series'.")

    h2(doc, "8.  Admin")

    case(36, "User search + role filter",
          "Admin", "Multiple users exist.",
          ["/admin → Users → type a fragment of a username; pick role=member."],
          "Table debounces (~200ms) and filters live by both query + role.")

    case(37, "Inline role change + active toggle",
          "Admin", "Target user exists.",
          ["Inline role select → change to creator. Click Disable on another row."],
          "Both PATCHes succeed; row updates in place. Audit log records the role change.")

    case(38, "Admin cannot grant superadmin (unless superadmin)",
          "Admin (not superadmin)", "Signed in.",
          ["Try setting any user's role to superadmin via the UI / API."],
          "API returns 403 'only superadmin can grant superadmin'.")

    case(39, "Admin unpublishes any series",
          "Admin", "Any series exists.",
          ["/admin → Content moderation → Unpublish on a series."],
          "Series hidden from the public library. Audit log records series_admin_edit.")

    case(40, "Admin deletes any series",
          "Admin", "Any series exists.",
          ["/admin → Content moderation → 🗑 → confirm."],
          "Series + episodes + watch progress removed. Audit log records series_admin_delete.")

    case(41, "Audit log lists recent events",
          "Admin", "Some moderator actions taken.",
          ["/admin → Audit log."],
          "Table shows actor / action / target / when / meta. Most recent first; password_changed and account_self_deleted entries appear too.")

    h2(doc, "9.  Theme + UX")

    case(42, "Dark / light toggle persists",
          "Anyone", "App open.",
          ["Click sun / moon icon top right.",
           "Reload the page."],
          "Theme switches immediately; choice persists (localStorage glimmora-theme). No flash of wrong theme on next load.")

    case(43, "Page-transition motion fires",
          "Member", "Signed in.",
          ["Navigate between Dashboard / Companion / Watch / Reflect."],
          "Each route fades up on arrival; sidebar active indicator slides; reduce-motion users get instant transitions.")

    out = OUT / "05_Test_Cases.docx"; doc.save(str(out)); print(f"wrote {out}")


# ============================================================
# 6. TECHNICAL DOCUMENTATION
# ============================================================

def build_technical_documentation():
    doc = Document(); _setup(doc)
    cover(doc, "Technical Documentation", "Deliverable 06 — Technical Documentation")

    h2(doc, "Stack")
    bullet(doc, "Frontend: Next.js 15 (App Router, RSC) · React 19 · TypeScript · Tailwind CSS · shadcn-style primitives · jose (JWT verification).")
    bullet(doc, "Backend: FastAPI · SQLAlchemy 2.0 (async) · Alembic · Pydantic v2 · PyJWT · bcrypt.")
    bullet(doc, "Database: SQLite (dev) / Postgres (prod) — same models, Alembic auto-detects dialect.")
    bullet(doc, "AI: OpenAI-compatible (default model gpt-4o-mini). Graceful fallback to deterministic responder when OPENAI_API_KEY is unset.")
    bullet(doc, "Build / package: pnpm workspaces · turbo · uv-style venv for backend.")
    bullet(doc, "Deployment target: DigitalOcean App Platform (one app, two services, one PRE_DEPLOY migrate job).")

    h2(doc, "Repository layout")
    code(doc,
         "glimmora-one/\n"
         "├── apps/web/                    # Next.js frontend\n"
         "│   ├── src/app/                 # routes (App Router)\n"
         "│   │   ├── (app)/               # authed shell (sidebar)\n"
         "│   │   ├── (auth)/              # login, signup, forgot/reset\n"
         "│   │   ├── api/proxy/[...path]/ # forwards to FastAPI w/ Bearer\n"
         "│   │   └── api/auth/logout/     # clears session cookie\n"
         "│   ├── src/components/          # client + presentational components\n"
         "│   ├── src/lib/                 # backend client, session, types, server actions\n"
         "│   └── src/middleware.ts        # auth-gating + pathname header\n"
         "├── backend/                     # FastAPI service\n"
         "│   ├── app/\n"
         "│   │   ├── routers/             # one per domain\n"
         "│   │   ├── ai/companion.py      # AI orchestration\n"
         "│   │   ├── models.py            # SQLAlchemy models\n"
         "│   │   ├── schemas.py           # Pydantic schemas\n"
         "│   │   ├── security.py          # bcrypt + JWT\n"
         "│   │   ├── deps.py              # CurrentUser dependency\n"
         "│   │   ├── db.py                # async engine + session factory\n"
         "│   │   ├── bootstrap.py         # superadmin + demo seeds\n"
         "│   │   └── main.py              # app factory + lifespan\n"
         "│   └── alembic/                 # migrations\n"
         "├── docs/                        # USER_MANUAL, TESTING_GUIDE, PRODUCT_FLOWS, Tech docs\n"
         "├── scripts/                     # build_docs.py + dev launchers\n"
         "├── .do/app.yaml                 # DigitalOcean deploy spec\n"
         "└── docker-compose.yml           # local Postgres + both halves")

    h2(doc, "Environment variables")
    table(doc,
          header=["Var", "Purpose", "Default / Example"],
          rows=[
              ["JWT_SECRET", "Shared HS256 signing secret (api + web).", "32+ random chars"],
              ["JWT_EXPIRES_HOURS", "Session lifetime.", "24"],
              ["DATABASE_URL", "SQLAlchemy async URL.", "sqlite+aiosqlite:///./dev.db"],
              ["BACKEND_URL", "Where Next proxies API calls.", "http://localhost:8000"],
              ["OPENAI_API_KEY", "Enables LLM companion + AI noticing.", "(unset → fallback)"],
              ["OPENAI_MODEL", "Override LLM model.", "gpt-4o-mini"],
              ["BOOTSTRAP_SUPERADMIN_USERNAME / _PASSWORD / _EMAIL", "Seed superadmin on first boot.", "superadmin / ChangeMe!2026 / admin@glimmora.ai"],
              ["ALLOWED_ORIGINS", "CORS allowlist (CSV).", "http://localhost:3000"],
              ["SMTP_HOST / _PORT / _USER / _PASSWORD / _FROM", "SMTP for password-reset email.", "(unset → dev-mode in-page token)"],
              ["RATE_LIMIT_PER_MINUTE", "Reserved for upcoming rate limiter.", "120"],
          ])

    h2(doc, "REST API reference (selected)")
    body(doc, "All endpoints return the envelope {success, data, error}. Auth: Authorization: "
              "Bearer <jwt> (Next.js proxy attaches it from the httpOnly cookie). camelCase on the "
              "wire (Pydantic alias generator).")

    h3(doc, "Auth")
    table(doc, header=["Method + Path", "Purpose"], rows=[
        ["POST /v1/auth/signup", "Create account; returns JWT."],
        ["POST /v1/auth/login", "Login by username or email; returns JWT."],
        ["POST /v1/auth/logout", "Stateless; cookie cleared by Next.js layer."],
        ["GET  /v1/auth/me", "Current user (also exposed at /v1/users/me)."],
        ["POST /v1/auth/password/forgot", "Issue 1h reset token; in dev returns devToken in response."],
        ["POST /v1/auth/password/reset", "Confirm token + set new password."],
    ])

    h3(doc, "Users")
    table(doc, header=["Method + Path", "Purpose"], rows=[
        ["PATCH /v1/users/me", "Update profile (full_name, bio, avatar_url, preferences merge)."],
        ["POST  /v1/users/onboard", "Persist onboarding payload + seed welcome conversation."],
        ["POST  /v1/users/me/password", "Change password (verifies current)."],
        ["GET   /v1/users/me/export", "Full JSON export of everything user owns."],
        ["DELETE /v1/users/me", "Self-delete (requires confirm_username)."],
    ])

    h3(doc, "Dashboard / Content / Reflection")
    table(doc, header=["Method + Path", "Purpose"], rows=[
        ["GET /v1/dashboard/today", "Three-step state for today + streak."],
        ["GET /v1/content/series", "Public catalog (published only)."],
        ["GET /v1/content/series/{slug}", "Series detail with episodes."],
        ["GET /v1/content/episodes/{id}", "Episode (premium-gated)."],
        ["GET /v1/content/progress/{episode_id}", "Saved progress (or null)."],
        ["POST /v1/content/progress", "Upsert progress."],
        ["GET /v1/content/continue-watching", "Up to 12 in-progress episodes."],
        ["GET /v1/content/recommendations", "Tag-affinity recommender."],
        ["GET /v1/reflection?q=&mood=", "List reflections (search + filter)."],
        ["POST /v1/reflection", "Create reflection (+ AI noticing if enabled)."],
        ["PATCH /v1/reflection/{id}", "Edit (regenerates noticing if content changed)."],
        ["DELETE /v1/reflection/{id}", "Delete."],
        ["GET /v1/reflection/insights/twin?days=", "Digital twin (7/30/90/365)."],
    ])

    h3(doc, "AI / Community / Creator / Admin")
    table(doc, header=["Method + Path", "Purpose"], rows=[
        ["POST /v1/ai/chat", "Send message; create-or-continue conversation; returns reply, emotion, suggested reflection, episode recs, crisis flag."],
        ["GET /v1/ai/conversations?q=", "List + search across titles and message bodies."],
        ["GET /v1/ai/conversations/{id}", "Conversation detail with messages."],
        ["DELETE /v1/ai/conversations/{id}", "Delete conversation + messages."],
        ["GET /v1/community/circles", "List circles + post counts."],
        ["GET /v1/community/circles/{slug}/posts", "List posts (non-flagged)."],
        ["POST /v1/community/circles/{slug}/posts", "Anonymous post (handle deterministic)."],
        ["POST /v1/community/posts/{id}/report", "Flag a post."],
        ["POST /v1/creator/apply", "Member submits creator application."],
        ["GET /v1/creator/application/me", "Latest application status."],
        ["POST /v1/creator/series", "Create series (creator+)."],
        ["GET /v1/creator/series/{id}", "Get my series with episodes."],
        ["PATCH /v1/creator/series/{id}", "Edit / unpublish (eager-loads episodes)."],
        ["DELETE /v1/creator/series/{id}", "Delete (cascade)."],
        ["POST /v1/creator/episodes", "Create episode."],
        ["PATCH /v1/creator/episodes/{id}", "Edit episode."],
        ["DELETE /v1/creator/episodes/{id}", "Delete episode."],
        ["GET /v1/creator/mine", "My series."],
        ["GET /v1/creator/analytics", "Series / episode / watcher / completion counts."],
        ["GET /v1/admin/stats", "Platform counts."],
        ["GET /v1/admin/users?q=&role=", "Search + filter."],
        ["PATCH /v1/admin/users/{id}/role", "Change role."],
        ["PATCH /v1/admin/users/{id}/active", "Activate / disable account."],
        ["GET /v1/admin/applications", "Review queue."],
        ["POST /v1/admin/applications/{id}/decide", "Approve / deny."],
        ["GET /v1/admin/series", "All series (incl. unpublished)."],
        ["PATCH /v1/admin/series/{id}", "Admin edit / unpublish (audit logged)."],
        ["DELETE /v1/admin/series/{id}", "Admin delete (audit logged)."],
        ["GET /v1/admin/flagged-posts", "Reported community posts."],
        ["DELETE /v1/admin/posts/{id}", "Delete community post."],
        ["GET /v1/admin/audit-log", "Most recent moderator + security events."],
        ["GET /v1/billing/tiers", "Tier definitions."],
        ["GET /v1/billing/me", "Entitlements for the current user."],
        ["POST /v1/billing/upgrade", "Dev-only tier flip (Stripe webhooks plug in here)."],
    ])

    h2(doc, "Authentication implementation")
    bullet(doc, "JWT (HS256) issued by api/security.py:create_access_token. Subject = user.id; "
                "extra claim role; iat/exp set.")
    bullet(doc, "Next.js stores it in an httpOnly cookie glimmora_session (sameSite=lax, secure in "
                "prod). Server fetches read it via cookies() and forward as Bearer.")
    bullet(doc, "Backend dependency CurrentUser decodes the JWT and loads the user; rejects on "
                "invalid/expired token.")
    bullet(doc, "Password hashing: bcrypt via passlib-style helpers in security.py.")
    bullet(doc, "Password reset: 32-byte URL-safe token; only its SHA256 hash is stored; 1h TTL; "
                "single-use (used_at gate).")

    h2(doc, "AI orchestration")
    bullet(doc, "ai/companion.py:respond() — single entrypoint. Returns CompanionResult(reply, "
                "emotion, reflection_prompt, recommended_episode_ids, crisis).")
    bullet(doc, "Memory window passed in by the router: 8 turns for free, 32 for premium.")
    bullet(doc, "Crisis regex is conservative — explicit phrases only. False positives are worse "
                "than false negatives in this audience.")
    bullet(doc, "Episode recommendation: scores published episodes by overlap of LLM-generated "
                "keywords against series tags + episode synopsis.")

    h2(doc, "Async-SQLAlchemy gotchas (and how we handle them)")
    bullet(doc, "Never assign conv.messages = [] on a session-bound object — triggers greenlet_spawn.")
    bullet(doc, "Series.episodes is a relationship — eager-load with selectinload(Series.episodes) "
                "before passing to Pydantic, otherwise model_validate() will lazy-load and fail.")
    bullet(doc, "On create+return: re-fetch with selectinload after commit (used in creator + admin "
                "series endpoints).")
    bullet(doc, "Datetime tz: SQLite stores naive, Postgres preserves tz. Normalize before "
                "comparison (auth password-reset expiry).")

    h2(doc, "Frontend conventions")
    bullet(doc, "All API calls go through src/lib/backend.ts → fetch BACKEND_URL with the user's "
                "Bearer attached on the server, or /api/proxy on the client.")
    bullet(doc, "camelCase boundary: backend serialises snake_case → camelCase via "
                "pydantic.alias_generators.to_camel. The UI consumes camelCase only.")
    bullet(doc, "(app)/layout.tsx fetches /v1/auth/me → redirects to /onboarding if not onboarded; "
                "renders the AppShell otherwise.")
    bullet(doc, "Animation: Tailwind keyframes (fade-up, scale-in, gradient-pan, breathe). All "
                "animations honour prefers-reduced-motion via a globals.css guard.")

    h2(doc, "Deployment")
    body(doc, "Push to main. DigitalOcean reads .do/app.yaml: a PRE_DEPLOY job runs alembic upgrade "
              "head, then the api service (routes /v1/* and /uploads/*) and web service (routes "
              "/*) deploy. One domain, no CORS in prod.")

    h2(doc, "Local development")
    code(doc,
         "# 1. Backend\n"
         "cd backend && python -m venv .venv\n"
         "./.venv/Scripts/pip install -e .            # Windows\n"
         "cp ../.env.example .env\n"
         "./.venv/Scripts/alembic upgrade head\n"
         "./.venv/Scripts/python -m uvicorn app.main:app --port 8000 --host 127.0.0.1\n"
         "\n"
         "# 2. Frontend\n"
         "pnpm install\n"
         "cp .env.example apps/web/.env.local         # set BACKEND_URL + JWT_SECRET\n"
         "pnpm --filter web dev\n"
         "\n"
         "# Default credentials (created on first boot):\n"
         "#   superadmin / ChangeMe!2026")

    h2(doc, "Quality gates per release")
    bullet(doc, "pnpm --filter web typecheck → clean.")
    bullet(doc, "pnpm --filter web build → clean.")
    bullet(doc, "Backend lifespan starts (auto-creates SQLite tables).")
    bullet(doc, "Full Playwright walkthrough across roles passes.")
    bullet(doc, "USER_MANUAL.md, TESTING_GUIDE.md, and matching .docx regenerated.")

    out = OUT / "06_Technical_Documentation.docx"; doc.save(str(out)); print(f"wrote {out}")


# ------------------------------------------------------------

if __name__ == "__main__":
    build_usp()
    build_target_audience()
    build_solution_design()
    build_project_documents()
    build_test_cases()
    build_technical_documentation()
