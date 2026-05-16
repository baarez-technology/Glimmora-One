# Glimmora ONE — Testing Guide

> Pretend you're a detective. Your job is to make sure the app works for everyone. This guide has tests anyone (even a 12-year-old) can run. Each test is a tiny mission — do the thing, check what you see, write a ✓ or ✗.

**App version:** 0.4.0-mvp (main branch)
**Last updated:** 2026-05-16

---

## Before you start

You need **two things running**:

1. The **backend** at `http://127.0.0.1:8000` — open this in a browser. You should see some words. If you see an error, ask your grown-up to start it.
2. The **website** at `http://127.0.0.1:3000` — open this in a browser. You should see the Glimmora landing page.

You will also need:

| Account | Username | Password | Use it for |
|---|---|---|---|
| A brand-new person (you make this in Test 1) | (any) | (any) | Testing as a regular member |
| The boss | `superadmin` | `ChangeMe!2026` | Already exists — log in if you need to |

> **Test result key:** **✓ Pass** = it did what we expected. **✗ Fail** = it didn't. Write notes about what was different.

---

## Tests by area

| Section | Tests |
|---|---|
| A — Landing page | 1–2 |
| B — Sign up & log in | 3–7 |
| C — The four hello questions | 8–10 |
| D — Dashboard (three small steps) | 11–13 |
| E — Companion | 14–18 |
| F — Stories | 19–24 |
| G — Reflect (journal + map) | 25–29 |
| H — Profile | 30–32 |
| I — Dark / light mode | 33 |
| J — The little things | 34–36 |

---

## A. Landing page

### Test 1 — The landing page loads

**You do:** open `http://127.0.0.1:3000/` in a browser.
**You should see:** a calm page with the words **"A calm room for your inner life."** in the middle. Two buttons: **Begin gently** and **See what's inside**. In the top-right corner there's a tiny **moon** (or sun) icon.
**Result:** ✓ / ✗ _________

### Test 2 — Scroll-down feels gentle

**You do:** scroll the page slowly.
**You should see:** more cards quietly fade in as you scroll. Nothing pops or shouts at you.
**Result:** ✓ / ✗ _________

---

## B. Sign up & log in

### Test 3 — You can sign up

**You do:** click **Begin gently**. Fill the form:
- Name: `Ren`
- Username: `ren_test`
- Email: leave empty
- Password: `hello`

Click **Create account**.

**You should see:** the app jumps straight to a welcome page (the four hello questions). **It should NOT show a blank screen first.** On the left, the sidebar shows `Ren · member`.
**Result:** ✓ / ✗ _________

### Test 4 — You cannot make two accounts with the same username

**You do:** open `/signup` in a new tab. Try to make another account with username `ren_test`.
**You should see:** an error message saying the username is already in use.
**Result:** ✓ / ✗ _________

### Test 5 — Log out

**You do:** in the top-right of any page inside the app, click **Sign out**.
**You should see:** the app sends you back to the landing page. If you try to type `/dashboard` in the URL, the app sends you to the login page instead.
**Result:** ✓ / ✗ _________

### Test 6 — Log back in

**You do:** click **Sign in** in the top-right of the landing page. Type `ren_test` and `hello`. Click **Sign in**.
**You should see:** you land on the dashboard.
**Result:** ✓ / ✗ _________

### Test 7 — Wrong password fails

**You do:** sign out. Try to log in with username `ren_test` and password `wrong`.
**You should see:** a red message saying invalid credentials. You stay on the login page.
**Result:** ✓ / ✗ _________

---

## C. The four hello questions

> Use a fresh account for these (sign out, sign up as someone new like `kid_test`).

### Test 8 — Walking through all four steps

**You do:**
1. On step 1, type a name and one sentence about why you're here. Click **Continue**.
2. On step 2, type one sentence about something you want to shift. Click **Continue**.
3. On step 3, click two squares (like *Stillness* and *Sleep*). Click **Continue**.
4. On step 4, you see a quote of what you wrote. Click **Begin**.

**You should see:** you land on the dashboard. Your one-sentence "intention" is quoted on the dashboard.
**Result:** ✓ / ✗ _________

### Test 9 — Skip works

**You do:** sign up as another new person. On the welcome page, immediately click **"Skip for now →"** in the top right.
**You should see:** you land on the dashboard. No questions asked again next time.
**Result:** ✓ / ✗ _________

### Test 10 — Cannot revisit onboarding

**You do:** after Test 8 or 9, try typing `/onboarding` in the URL bar.
**You should see:** the app sends you back to the dashboard. (You only see those four questions once.)
**Result:** ✓ / ✗ _________

---

## D. Dashboard (three small steps)

### Test 11 — Dashboard shows three steps

**You do:** open `/dashboard`.
**You should see:** a greeting, then a card with **three small steps**: Arrive, Notice, Reflect. All three start as "not done" (no gold check).
**Result:** ✓ / ✗ _________

### Test 12 — Step 1 ticks after a Companion message

**You do:** click **Open companion** on the Arrive step. Send any message. Then click **Today** in the sidebar.
**You should see:** Step 1 — Arrive shows a gold check now.
**Result:** ✓ / ✗ _________

### Test 13 — Step 3 ticks after a reflection

**You do:** click **Reflect** in the sidebar. Click **New reflection**. Type "Hello, brain." Click **Save reflection**. Go back to the dashboard.
**You should see:** Step 3 — Reflect shows a gold check.
**Result:** ✓ / ✗ _________

---

## E. Companion

### Test 14 — Companion page loads empty

**You do:** click **Companion** in the sidebar (in a brand-new account that hasn't used it).
**You should see:** the words **"I'm here."** in the middle, with four soft starter sentences as buttons below. A text box at the bottom to type in.
**Result:** ✓ / ✗ _________

### Test 15 — Click a starter sentence

**You do:** click any of the four starters.
**You should see:** your message appears in a peach bubble on the right. Three dots animate (the Companion is thinking). Within a few seconds, a reply appears in a soft cream bubble on the left.
**Result:** ✓ / ✗ _________

### Test 16 — Type your own message

**You do:** in the text box, type "I feel a little tired today." Press Enter.
**You should see:** your message appears, then a kind reply. Often a small box also appears with **"A question to sit with"** and a question.
**Result:** ✓ / ✗ _________

### Test 17 — The safety card appears for serious words

**You do:** type a message that has crisis words, like "I want to die tonight." Press Enter.

> ⚠️ This is **just a test**. We're checking that the safety net works.

**You should see:** a rose-pink card appears with phone numbers for India, US/Canada, UK, and a global website. The Companion still replies kindly.
**Result:** ✓ / ✗ _________

### Test 18 — Safety card does NOT appear for soft sad words

**You do:** in a new conversation or new account, type "I feel a bit lonely tonight." Press Enter.
**You should see:** the Companion replies kindly. **No pink safety card appears.** (That's on purpose — the safety net is for very direct words only.)
**Result:** ✓ / ✗ _________

---

## F. Stories

### Test 19 — Library shows series

**You do:** click **Stories** in the sidebar.
**You should see:** a page called **"The library."** with three groups: *emotional intelligence*, *growth*, *meditation*. Each has at least one card with a cover picture.
**Result:** ✓ / ✗ _________

### Test 20 — Open a series

**You do:** click any series card (try **Still Mind**).
**You should see:** the series page with a cover, a description, and a list of episodes with their durations.
**Result:** ✓ / ✗ _________

### Test 21 — Play an episode

**You do:** click any episode. Click the play button on the video.
**You should see:** the video starts playing. Below the video, a quiet box with **"A question for after"** and a question.
**Result:** ✓ / ✗ _________

### Test 22 — Pause + leave + come back resumes

**You do:** let the video play for 30 seconds. Pause it. Click **Stories** in the sidebar to leave. Then click the same episode again.
**You should see:** the video starts playing **near where you stopped** — not from the very beginning.
**Result:** ✓ / ✗ _________

### Test 23 — Continue watching row appears

**You do:** after Test 22, click **Stories** in the sidebar.
**You should see:** at the very top of the page, a row called **"Continue watching"** with your episode in it. There's a small gold bar showing how much you've watched and a "% watched · resume" line.
**Result:** ✓ / ✗ _________

### Test 24 — Write a reflection from an episode

**You do:** open an episode. Below the video, click **Write a reflection**. Type a sentence. Click **Save reflection**.
**You should see:** a green "Saved." line with a link to the journal. If you click **Reflect** in the sidebar, the new entry is there.
**Result:** ✓ / ✗ _________

---

## G. Reflect (journal + map)

### Test 25 — Empty journal looks gentle

**You do:** sign up as a brand-new person, skip onboarding, and click **Reflect**.
**You should see:** the stats all say zero or "—". The journal area says "Nothing yet. The first sentence is the hardest."
**Result:** ✓ / ✗ _________

### Test 26 — Write a reflection

**You do:** click **New reflection** in the top right. Type one sentence. Tap the mood **hopeful**. Drag intensity to 6. Click **Save reflection**.
**You should see:**
- The page jumps to `/reflect`.
- Reflections: 1.
- Day streak: 1.
- Most-present: hopeful.
- Avg. intensity: 6.0.
- Today's chip in the **Last 30 days** chart is colored.
- Your entry shows up in the journal.

**Result:** ✓ / ✗ _________

### Test 27 — Second reflection adds to stats

**You do:** write another reflection with mood **anxious** and intensity 8.
**You should see:** Reflections: 2. Avg. intensity: 7.0. The most-present feeling might stay "hopeful" or change to "anxious" (whichever you've used more).
**Result:** ✓ / ✗ _________

### Test 28 — Milestones show up

**You do:** after writing your first reflection, look at the **Milestones** card on the right.
**You should see:** at least the milestone "First reflection logged" with a glimmer ✦ next to it.
**Result:** ✓ / ✗ _________

### Test 29 — Empty days are faint

**You do:** look at the **Last 30 days** chart.
**You should see:** today (the right-most stub) is colored — the days before it (when you didn't write) are pale, almost invisible. That's correct.
**Result:** ✓ / ✗ _________

---

## H. Profile

### Test 30 — Profile loads

**You do:** click **Profile** in the sidebar.
**You should see:** your name as a big serif heading. Your email under it. A card called **You** with editable name and bio.
**Result:** ✓ / ✗ _________

### Test 31 — Edit name

**You do:** in the **You** card, change your name to something new (like "Tiger"). Click **Save**.
**You should see:** the name updates at the top of the Profile page. The sidebar also updates.
**Result:** ✓ / ✗ _________

### Test 32 — Edit bio

**You do:** type something into the bio box. Click **Save**.
**You should see:** a quiet confirmation that it saved (no error message).
**Result:** ✓ / ✗ _________

---

## I. Dark / light mode

### Test 33 — Theme toggle

**You do:** click the moon/sun in the top right of any page. Then refresh the page (F5).
**You should see:** the colors flip immediately. After refresh, the new color stays — the app **remembers** your choice. No flash of the wrong color.
**Result:** ✓ / ✗ _________

---

## J. The little things

### Test 34 — Protected pages need a login

**You do:** sign out. Try opening `/dashboard` directly.
**You should see:** the app sends you to `/login?next=/dashboard`. After signing in, you land on `/dashboard`.
**Result:** ✓ / ✗ _________

### Test 35 — Mobile sidebar at the bottom

**You do:** open the app on your phone, or shrink your browser window narrow.
**You should see:** the side sidebar disappears. Five icons appear at the **bottom** of the screen — that's the mobile menu.
**Result:** ✓ / ✗ _________

### Test 36 — Theme + signup pages

**You do:** click the moon/sun on the `/login` page and on the `/signup` page.
**You should see:** the theme toggle works there too.
**Result:** ✓ / ✗ _________

---

## Done? Here's the quick scorecard

Count your ✓s and ✗s.

| Section | Tests | ✓ | ✗ |
|---|---|---|---|
| A — Landing page | 2 | ___ | ___ |
| B — Sign up & log in | 5 | ___ | ___ |
| C — Onboarding | 3 | ___ | ___ |
| D — Dashboard | 3 | ___ | ___ |
| E — Companion | 5 | ___ | ___ |
| F — Stories | 6 | ___ | ___ |
| G — Reflect | 5 | ___ | ___ |
| H — Profile | 3 | ___ | ___ |
| I — Dark/light | 1 | ___ | ___ |
| J — Little things | 3 | ___ | ___ |
| **Total** | **36** | ___ | ___ |

**All ✓:** The app is healthy. 🎉
**Some ✗:** Write down which test number(s) and what you saw. Give that list to your grown-up.

---

## If you get stuck — common gotchas

| What happened | What it probably means | Fix |
|---|---|---|
| Blank page after signing up | The dev server is caching old code. | Stop it and run `pnpm dev` again. |
| "JWT_SECRET is not configured" | A setting file is missing. | Ask your grown-up to set up `.env.local`. |
| Login works but the dashboard is empty | The session got dropped. | Use `http://127.0.0.1:3000` (not `localhost`, not `https`). |
| Companion never replies | The OpenAI key isn't set. | Either set it, or wait — the simple fallback replies should still appear. |
| Video shows a black box | The internet is blocking the test stream. | Try another episode. |
| Backend won't start (port busy) | An old server is still running. | Restart your computer if you can't find it. |

---

## When you're done testing

- If everything worked, **tell your grown-up**: "All 36 tests passed."
- If something didn't work, write down:
  - The test number (like "Test 22").
  - What you saw (like "the video started from zero").
  - What you expected to see (like "it should resume").

Good detective work! 🕵️
