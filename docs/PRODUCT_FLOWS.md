# Glimmora ONE — Product flows, roles, and workflows

> Living design doc. Update it in the same commit as any change to roles, permissions, lifecycle states, or user-visible workflows. Keep the matrices in sync with the actual code — if they drift, the code is the source of truth and the doc is wrong.

**Last updated:** 2026-05-11
**Applies to app version:** 0.2.0

---

## 1. Personas

| Persona | Who they are | What success looks like for them |
|---|---|---|
| **The Visitor** | First-time landing page reader, browser-tab-curious. | Understands what Glimmora is in <30s, signs up or bookmarks. |
| **The Seeker (free member)** | Wants a quieter, more reflective life. Comes back daily or weekly. | Builds a small daily habit; feels heard by the companion; finishes 1-2 series. |
| **The Practitioner (premium)** | More committed; values long memory and the digital twin. | Long streak; uses companion as a recurring practice; sees patterns over time. |
| **The Creator** | Therapist, monk, teacher, filmmaker — wants to publish journeys. | Publishes series, sees who's watching, gets meaningful engagement (not just views). |
| **The Moderator (admin)** | Glimmora staff or trusted volunteer. | Catches harm fast; keeps circles safe; never has to chase the same incident twice. |
| **The Owner (superadmin)** | Founder / platform owner. | Has full visibility; can grant/revoke any role; can rescue any account. |

---

## 2. Roles & permissions matrix

Four roles, additive: a superadmin can do everything an admin can, who can do everything a creator can, who can do everything a member can.

| Capability | Member | Creator | Admin | Superadmin |
|---|:-:|:-:|:-:|:-:|
| Sign up, sign in, edit own profile | ✓ | ✓ | ✓ | ✓ |
| Use companion / journal / circles | ✓ | ✓ | ✓ | ✓ |
| Watch all free content | ✓ | ✓ | ✓ | ✓ |
| Watch premium content | premium tier only | premium tier only | ✓ | ✓ |
| Apply to become a creator | ✓ | n/a (already) | n/a | n/a |
| Publish own series & episodes | ✗ | ✓ | ✓ | ✓ |
| Edit/delete *own* series | ✗ | ✓ | ✓ | ✓ |
| Edit/delete *any* series | ✗ | ✗ | ✓ | ✓ |
| Review flagged community posts | ✗ | ✗ | ✓ | ✓ |
| Delete any community post | ✗ | ✗ | ✓ | ✓ |
| Approve/reject creator applications | ✗ | ✗ | ✓ | ✓ |
| Toggle a user's active flag | ✗ | ✗ | ✓ | ✓ |
| Change a user's role | ✗ | ✗ | ✓ (not to superadmin) | ✓ |
| Read platform stats | ✗ | ✗ | ✓ | ✓ |
| Access database directly / rotate secrets | ✗ | ✗ | ✗ | ✓ (out-of-band) |

**Tier vs role.** Tier (`free` | `premium`) is *what you've paid for*; role is *what you're trusted to do*. Premium grants access to gated content; role grants access to actions. An admin on the free tier can still moderate but doesn't automatically see premium content unless their role bypass kicks in (admin/superadmin currently bypass tier gating — see `content.py:get_episode`).

---

## 3. Account lifecycle

```
            signup
              │
              ▼
        ┌──────────────┐    user fills intention + focus areas
        │ Onboarding   │ ─────────────────────────────────────────►
        │ /onboarding  │                                          │
        └──────────────┘                                          │
              │  skip                                             │
              ▼                                                   ▼
        ┌──────────────────────────────────────────────────────────┐
        │   Active member (or higher role if granted)              │
        │   ──────────────────────────────────────────────         │
        │   Daily ritual loop  ◄─────────┐                         │
        │   Watch / reflect / circle     │                         │
        │   Companion conversations   ───┘                         │
        └──────────────────────────────────────────────────────────┘
              │
              ▼
   ┌────────────────────┐      member applies      ┌────────────────────┐
   │  Member (default)  │ ───────────────────────► │ Creator applicant  │
   └────────────────────┘                          └────────────────────┘
              │                                              │ admin approves
              │ admin promotes                               ▼
              ▼                                    ┌────────────────────┐
       ┌────────────┐                              │     Creator        │
       │   Admin    │                              └────────────────────┘
       └────────────┘
```

A user is "onboarded" once `User.preferences.onboarded == true`. The Next.js middleware redirects any logged-in user who lands on `/dashboard` while not onboarded straight to `/onboarding`. They can skip onboarding (the skip writes `onboarded: true` with empty intention).

---

## 4. Onboarding flow

URL: `/onboarding`

A four-step quiet sequence. Each step is one card; the user can go back, and **Skip for now** is always present (small, in the corner).

```
  ┌────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │ 1. Welcome │ ─► │ 2. Intention │ ─► │ 3. Focus     │ ─► │ 4. Companion │
  │            │    │  (free text) │    │   areas      │    │  introduces  │
  │            │    │              │    │  (multi-pick)│    │  itself      │
  └────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                    │
                                                                    ▼
                                                              /dashboard
```

| Step | What we ask | Why | Where it lands |
|---|---|---|---|
| 1 | Name + a short reason to be here. | Anchors the companion in a real person. | `User.full_name`, `preferences.reason` |
| 2 | "In one sentence, what brought you here?" | Becomes the first reflection prompt and steers companion tone. | `preferences.intention` |
| 3 | Pick up to 4 areas: *stillness, becoming, emotion, grief, joy, relationships, work, sleep, creativity*. | Drives recommendations and journey suggestions. | `preferences.focus_areas: string[]` |
| 4 | Companion sends a single welcome message tailored to the above. | Sets the tone — present, gentle, not pushy. | A `Conversation` is created with one assistant message. |

After step 4 the user lands on `/dashboard`, which now sees their intention/focus and shows a personalized "Today" view.

---

## 5. Daily ritual loop

The product's heartbeat. The dashboard is reorganized into **"Today's three small steps"**:

```
  ┌─────────────────────────────────────────────────────────────────┐
  │ Step 1 — Arrive    (a 90-second check-in with the companion)    │
  │ Step 2 — Notice    (one short episode tuned to your focus areas)│
  │ Step 3 — Reflect   (one sentence in the journal)                │
  └─────────────────────────────────────────────────────────────────┘
```

State is tracked client-side via the user's reflection/conversation/watch records on the current calendar day:

- **Step 1 done** when a `Conversation` has a message authored today.
- **Step 2 done** when a `WatchProgress` row for today has `position_seconds > 60` or `completed = true`.
- **Step 3 done** when a `Reflection` was created today.

Completing all three increments the streak (already computed in `digital_twin`). Steps remain visible all day; they don't reset until the next calendar day.

**No notifications, no nags.** This is by design — the product avoids the engagement-loop reflexes of typical apps. The daily steps appear *only* when the user opens the app.

---

## 6. Content lifecycle

A series moves through these states:

```
  ┌──────────┐   creator saves    ┌──────────┐   creator publishes   ┌────────────┐
  │  Draft   │ ──────────────────►│   Ready  │ ────────────────────► │  Published │
  └──────────┘                    └──────────┘                       └────────────┘
       ▲                                ▲                                  │
       │     creator unpublishes        │                                  │
       └────────────────────────────────┴──────────────────────────────────┘
```

In the data model this is the existing `published: bool` column on `Series` and `Episode`. "Ready" is just "saved but not published yet" — no extra column needed.

- **Draft / Ready:** invisible to members. Visible to the creator on their `/creator` page.
- **Published:** visible to everyone (subject to `tier` gating).

Admin override: an admin can flip `published=false` on any series at any time (the field is in the admin endpoints' write surface — to be added when we need takedowns).

---

## 7. Creator workflow

```
   member               creator application
     │                          │
     │  applies via             │  admin reviews
     │  /creator/apply          │  /admin/applications
     ▼                          ▼
  ┌──────────────────┐    ┌──────────────────┐
  │ CreatorApplication│ ──►│  approve / deny  │
  │  (status=pending) │    └──────────────────┘
  └──────────────────┘            │
                                  ▼
                          User.role = "creator"
                                  │
                                  ▼
                           ┌──────────────┐
                           │ /creator     │
                           │  - my series │
                           │  - new series│
                           │  - analytics │
                           └──────────────┘
                                  │
                                  ▼
                           publish episodes
                                  │
                                  ▼
                           appears in /watch
```

A `CreatorApplication` row carries: `user_id`, `pitch` (free text), `sample_url` (optional), `status` (pending/approved/denied), `decided_by`, `decided_at`. Approval flips `User.role` to `creator` and marks the application as approved. Denial leaves the role unchanged.

---

## 8. Moderation flow

```
    member reports a post                  admin reviews
         │                                      │
         ▼                                      ▼
   POST /v1/community/posts/{id}/report   GET /v1/admin/flagged-posts
         │                                      │
         ▼                                      ▼
   post.flagged = true                    DELETE  ──► gone
   (hidden from feed)                     or
                                          UNFLAG  ──► returns to feed
                                                       (to be added)
```

Lightweight prevention happens at write time: a small blocklist is checked in `community.py:create_post`. The full moderation policy lives outside code (a wiki/Notion page); this file lists only the technical flow.

---

## 9. Crisis safety flow

```
   user message arrives
         │
         ▼
   companion classifies emotion
         │
         ├── if message matches crisis pattern ──► insert one extra "grounded resources" card
         │                                        in the assistant turn — soft, not alarming.
         ▼
   normal companion reply
```

Crisis patterns are conservative: explicit mentions of suicide, self-harm, or intent to die. We *do not* try to detect every difficult state — false positives are worse than missed ones for this audience. The card surfaces a small set of region-agnostic resources and the suggestion to reach out to someone the user trusts. It does not call services, does not change app state, and does not interrupt the conversation.

---

## 10. State map — where the user can be at any moment

```
                              ┌─────────────┐
                              │   Visitor   │
                              └─────────────┘
                                    │ signup
                                    ▼
                             ┌──────────────┐
                             │ Onboarding   │ (preferences.onboarded == false)
                             └──────────────┘
                                    │ complete or skip
                                    ▼
            ┌────────────────────────────────────────────────────┐
            │ Onboarded member                                   │
            │  - dashboard, companion, watch, reflect, circles   │
            │  - profile / membership                            │
            └────────────────────────────────────────────────────┘
                │              │                       │
                │ apply        │ upgrade               │ promoted
                ▼              ▼                       ▼
        ┌────────────┐   ┌────────────┐         ┌────────────┐
        │ Applicant  │   │  Premium   │         │  Creator   │
        └────────────┘   └────────────┘         └────────────┘
                │                                       │ promoted (rare)
                │ approved                              ▼
                └──────────────────────────────►  ┌────────────┐
                                                  │   Admin    │
                                                  └────────────┘
```

---

## 11. Where each flow lives in the code

| Flow | Backend | Frontend |
|---|---|---|
| Onboarding | `routers/users.py:onboard` | `app/(app)/onboarding/page.tsx` |
| Daily ritual | `routers/dashboard.py:today` | `app/(app)/dashboard/page.tsx` |
| Companion | `routers/ai.py`, `ai/companion.py` | `components/companion-chat.tsx` |
| Content lifecycle | `routers/creator.py`, `routers/content.py` | `app/(app)/creator/page.tsx` |
| Creator application | `routers/creator.py:apply`, `routers/admin.py:applications` | `app/(app)/creator/apply/page.tsx`, `app/(app)/admin/page.tsx` |
| Moderation | `routers/community.py:report`, `routers/admin.py` | `app/(app)/admin/page.tsx` |
| Crisis | `ai/companion.py:_crisis_check` | rendered inline in companion chat |
