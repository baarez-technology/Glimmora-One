"""Build kid-friendly Word docs (TESTING_GUIDE.docx + USER_MANUAL.docx).

Every step has a screenshot under it. Language is simple — short sentences,
no jargon. Run from the repo root:

    python scripts/build_docs.py
"""

from __future__ import annotations

from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
SHOTS = ROOT / "docs" / "screenshots"
OUT = ROOT / "docs"


# ---------------------- helpers ----------------------

def h1(doc, text):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.bold = True
    r.font.size = Pt(26)
    r.font.color.rgb = RGBColor(0x33, 0x2B, 0x2B)
    p.paragraph_format.space_after = Pt(6)


def h2(doc, text):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.bold = True
    r.font.size = Pt(18)
    r.font.color.rgb = RGBColor(0x44, 0x3C, 0x3C)
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)


def h3(doc, text):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(0xAD, 0x6B, 0x2D)  # warm amber
    p.paragraph_format.space_before = Pt(10)
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


def step(doc, n, title, do, see):
    """A numbered step. `do` is what the kid clicks. `see` is what should happen."""
    p = doc.add_paragraph()
    r = p.add_run(f"Step {n}. {title}")
    r.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(0x2E, 0x7D, 0x5B)
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(2)

    p1 = doc.add_paragraph()
    r1 = p1.add_run("👉 You do: ")
    r1.bold = True
    r1.font.size = Pt(11)
    r1b = p1.add_run(do)
    r1b.font.size = Pt(11)

    p2 = doc.add_paragraph()
    r2 = p2.add_run("👀 You should see: ")
    r2.bold = True
    r2.font.size = Pt(11)
    r2b = p2.add_run(see)
    r2b.font.size = Pt(11)


def shot(doc, filename, caption=None, width_in=6.0):
    path = SHOTS / filename
    if not path.exists():
        body(doc, f"[missing screenshot: {filename}]")
        return
    doc.add_picture(str(path), width=Inches(width_in))
    last = doc.paragraphs[-1]
    last.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if caption:
        cp = doc.add_paragraph()
        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cr = cp.add_run(caption)
        cr.italic = True
        cr.font.size = Pt(10)
        cr.font.color.rgb = RGBColor(0x70, 0x70, 0x70)


def page_break(doc):
    doc.add_page_break()


# ---------------------- TESTING GUIDE ----------------------

def build_testing_guide():
    doc = Document()
    # Margins
    for section in doc.sections:
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        section.top_margin = Inches(0.7)
        section.bottom_margin = Inches(0.7)

    h1(doc, "Glimmora ONE — Testing Guide")
    body(doc, "This guide shows you how to test the whole app, step by step. "
              "Each step has a picture so you know exactly what to click and "
              "what should happen. If your screen doesn't match the picture, "
              "something is broken.")
    body(doc, "Before you start, make sure two things are running:")
    bullet(doc, "The backend at http://127.0.0.1:8000  (you should see {\"ok\": true} if you open it).")
    bullet(doc, "The website at http://127.0.0.1:3000  (you should see the Glimmora landing page).")
    body(doc, "Throughout this guide, we use two test users:")
    bullet(doc, "A new person (sign up fresh — see Step 3).")
    bullet(doc, "The boss / superadmin → username: superadmin, password: ChangeMe!2026")

    page_break(doc)

    h2(doc, "Part A — The new-person flow (Member)")
    body(doc, "We pretend you've never used Glimmora before. We'll sign up, "
              "go through the four welcome steps, do a daily ritual, and write "
              "in the journal.")

    step(doc, 1, "Open the landing page",
         "In your browser, go to http://127.0.0.1:3000",
         "A calm white/cream page with the words 'A calm room for your inner life.' in the middle. "
         "There's a 'Begin gently' button. In the top-right corner you can see a moon/sun icon — "
         "that's the dark mode switch.")
    shot(doc, "01-landing.png", "The landing page in light mode.")

    step(doc, 2, "Try the dark mode switch",
         "Click the moon (or sun) icon in the top-right corner.",
         "The whole page turns dark. Click again and it turns light again. "
         "If you close the tab and come back, it remembers your choice.")

    step(doc, 3, "Click 'Begin gently' to start signing up",
         "Click the big 'Begin gently' button on the landing page.",
         "You land on the sign-up page with four boxes: name, username, email (optional), password.")
    shot(doc, "02-signup.png", "The sign-up page.")

    step(doc, 4, "Fill in the form",
         "Type a name (like 'Ren'), a username (like 'ren_test'), leave email empty, "
         "and a password (just 'hello' is fine). Click 'Create account'.",
         "Right away you land on the welcome page — the first of four little steps. "
         "No flashing blank screen, no detour. The sidebar on the left says your "
         "name and 'Member · free' under it.")
    shot(doc, "03-onboarding-welcome.png", "The welcome step (step 1 of 4).")

    step(doc, 5, "Walk through the four welcome steps",
         "Type a friendly name. Click Continue. Write a one-line reason (like "
         "'Just curious'). Click Continue. Pick up to four focus areas (try "
         "'Stillness' and 'Sleep'). Click Continue. Read the final 'Ready when "
         "you are' page and click Begin.",
         "Each step fades in gently. You can press 'Skip for now →' in the top "
         "right at any time. When you press 'Begin' you land on the Dashboard.")

    step(doc, 6, "Read your dashboard",
         "Look at the page.",
         "You see a greeting like 'Good morning, Ren.' and your intention "
         "quoted underneath. Below is a card called 'Three small steps' "
         "(Arrive, Notice, Reflect) — these are today's gentle nudges. Below that, "
         "a featured journey, your 'inner weather' stats, and 'Paths for you' "
         "tuned to what you picked.")
    shot(doc, "04-dashboard-member.png", "The dashboard for a brand-new member.")

    step(doc, 7, "Open the Companion (Step 1 — Arrive)",
         "Click the 'Open companion' link on the first small-step card. (Or click "
         "'Companion' in the left sidebar.)",
         "An empty chat with the headline 'I'm here.' and four friendly starter "
         "sentences you can tap. Below is a text box to type your own message.")
    shot(doc, "06-companion-empty.png", "The empty Companion view.")

    step(doc, 8, "Talk to the Companion",
         "Click a starter sentence (or type one and press Enter).",
         "Your message appears on the right in a peach bubble. After a moment, "
         "the Companion replies on the left. Below the reply is a card with "
         "'A question to sit with' — that's your suggested reflection.")

    step(doc, 9, "Test the safety net (carefully)",
         "Type a message with crisis words in it, like: 'honestly I want to die tonight'. "
         "Press Enter.",
         "A rose-colored card appears with helplines for India, US/Canada, UK, "
         "and a global directory. The Companion still replies kindly. This card "
         "only appears for very direct words — gentle/oblique sadness does NOT "
         "trigger it (that's on purpose).")
    shot(doc, "07-companion-with-crisis.png", "The crisis safety card.")

    step(doc, 10, "Write a reflection (Step 3 — Reflect)",
          "Go to /reflect/new (or click 'Reflect' in the sidebar, then 'New reflection'). "
          "Type one sentence. Tap a mood (like 'hopeful'). Drag the intensity slider. "
          "Click 'Save reflection'.",
          "You land on the Reflect home page. The four stats at the top now show "
          "Reflections: 1, Day streak: 1, Most-present: hopeful, Avg. intensity: 5. "
          "Today's chip in the '30 days' row is colored. Your entry shows in the journal.")
    shot(doc, "08-reflect-new.png", "Writing a reflection.")
    shot(doc, "09-reflect-digest.png", "After saving — stats and journal updated.")

    step(doc, 11, "Browse Stories (Step 2 — Notice)",
          "Click 'Stories' in the sidebar.",
          "A library page with three groups: Emotional intelligence, Growth, "
          "Meditation. Each group shows one or more series cards.")
    shot(doc, "10-stories-library.png", "The stories library.")

    step(doc, 12, "Open a series",
          "Click on 'Still Mind'.",
          "The series page shows the cover, a tagline 'Twelve invitations to inner "
          "quiet', and a list of episodes with durations.")
    shot(doc, "11-series-page.png", "A series page.")

    step(doc, 13, "Open Circles",
          "Click 'Circles' in the sidebar.",
          "Three quiet community spaces: Becoming, First Light, The Quiet Circle. "
          "Each is anonymous — you only ever appear as a quiet handle.")
    shot(doc, "13-circles.png", "The Circles list.")

    step(doc, 14, "Open Profile",
          "Click 'Profile' in the sidebar.",
          "Three cards: 'You' (edit your name/bio), 'Your role' (says you are a "
          "Member and what that means), 'Membership' (Glimmora Free).")
    shot(doc, "14-profile-member.png", "The Profile page as a Member.")

    page_break(doc)

    h2(doc, "Part B — Becoming a Creator")
    body(doc, "Now we make the same Member into a Creator. This takes two people "
              "(or one person who logs out and back in): the applicant, and the "
              "admin who approves.")

    step(doc, 15, "Apply to be a creator",
          "While still logged in as the new member, go to /creator/apply. "
          "Write a sentence or two about what you'd like to share. Click 'Send application'.",
          "The page now shows 'YOUR APPLICATION — PENDING' with your words in "
          "italics. On the dashboard, the 'Apply' callout is replaced by a "
          "'We're reading your application' card.")
    shot(doc, "15-creator-apply.png", "The Apply to become a creator form.")

    step(doc, 16, "Log out, log in as the boss",
          "Click 'Sign out' (top-right header). Go to /login. "
          "Username: superadmin. Password: ChangeMe!2026.",
          "You land on the dashboard as superadmin.")
    shot(doc, "02b-login.png", "The login page.")

    step(doc, 17, "Open Admin and approve the application",
          "Click 'Admin' in the sidebar (it only appears for admins). Find your "
          "test user's pitch under 'Creator applications'. Click 'Approve'.",
          "The pitch row updates to APPROVED. The user's role in the Users "
          "table flips from 'member' to 'creator'.")
    shot(doc, "17-admin.png", "The Admin page with applications + user list.")

    step(doc, 18, "Log back in as the new creator",
          "Sign out. Log in with the test user's username and password.",
          "The sidebar now reads '<Name> · Creator · free'. A new 'Studio' link "
          "appears in the sidebar.")
    shot(doc, "14-profile-creator.png", "The Profile page now says 'Creator'.")

    step(doc, 19, "Open Studio",
          "Click 'Studio' in the sidebar (or go to /creator).",
          "You can see your series, an analytics card, and a 'New series' button. "
          "Click into '+ New series' to add one; then add episodes inside it.")
    shot(doc, "20-creator-studio.png", "The Creator Studio.")

    page_break(doc)

    h2(doc, "Part C — Quick checklist by role")

    h3(doc, "Anonymous visitor")
    bullet(doc, "/ landing renders without a login.")
    bullet(doc, "/login and /signup show a theme toggle.")
    bullet(doc, "Going to /dashboard sends you to /login.")

    h3(doc, "Member (the default new user)")
    bullet(doc, "Signup goes straight to /onboarding (no flicker).")
    bullet(doc, "Sidebar shows 'Member · <tier>'.")
    bullet(doc, "No 'Studio' or 'Admin' links in the sidebar.")
    bullet(doc, "Going to /admin or /creator gives a not-allowed page.")

    h3(doc, "Creator")
    bullet(doc, "All Member powers, plus a Studio link.")
    bullet(doc, "Can create series + episodes.")
    bullet(doc, "Still cannot open /admin.")

    h3(doc, "Admin / Superadmin")
    bullet(doc, "All Creator powers, plus an Admin link.")
    bullet(doc, "Can approve or deny applications.")
    bullet(doc, "Approving an application instantly makes that user a creator.")

    page_break(doc)

    h2(doc, "Part D — If something looks wrong")
    body(doc, "These are the most common gotchas, in plain English:")
    bullet(doc, "Blank page after signup → that bug was fixed in v0.2.1. "
                "If you see it, the dev server is probably caching old code — "
                "stop it, run 'pnpm dev' again.")
    bullet(doc, "Login works but dashboard is empty → the session cookie was "
                "dropped. Make sure you're on http://127.0.0.1:3000 (NOT https), "
                "and that the dev server is in dev mode, not 'next start'.")
    bullet(doc, "Crisis card didn't show for a sad message → that's on purpose. "
                "It only triggers on very explicit words (suicide, want to die, "
                "hurt myself…). Better to under-react than over-react.")
    bullet(doc, "Backend won't start: port 8000 is busy → "
                "run: taskkill /F /IM uvicorn.exe   then start again.")

    out = OUT / "TESTING_GUIDE.docx"
    doc.save(str(out))
    print(f"wrote {out}")


# ---------------------- USER MANUAL ----------------------

def build_user_manual():
    doc = Document()
    for section in doc.sections:
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        section.top_margin = Inches(0.7)
        section.bottom_margin = Inches(0.7)

    h1(doc, "Glimmora ONE — User Manual")
    body(doc, "Hi! This is a friendly guide to Glimmora ONE — a small, calm "
              "place to slow down and notice your inner weather. We made this "
              "guide so anyone, even a 10-year-old, can use the app on their "
              "own. Read through once, then keep it nearby for the first few days.")

    body(doc, "App version: 0.2.1   ·   Last updated: 2026-05-12")

    page_break(doc)

    h2(doc, "1. What Glimmora ONE is")
    body(doc, "Glimmora ONE is four small rooms inside one app:")
    bullet(doc, "Companion — a kind AI you can talk to like a journal.")
    bullet(doc, "Stories — short, calm video lessons on stillness and feelings.")
    bullet(doc, "Reflect — a private journal that quietly draws a map of how you feel.")
    bullet(doc, "Circles — a slow, anonymous place to share with others.")
    body(doc, "You also get a Dashboard called 'Today' with three small things to do each day.")

    h2(doc, "2. Making an account")
    body(doc, "On the landing page, click 'Begin gently'. Fill in a name "
              "(anything you like), a username, a password, and your email "
              "(optional). Click Create account.")
    shot(doc, "02-signup.png", "The sign-up page.")
    body(doc, "Tip: you can use a one-letter username and a one-letter password "
              "while testing — Glimmora won't yell at you.")

    h2(doc, "3. The welcome — four small steps")
    body(doc, "After you sign up, the app asks you four gentle questions. "
              "You can skip any of them.")
    bullet(doc, "What should we call you?")
    bullet(doc, "What's your one-sentence intention?")
    bullet(doc, "Pick up to four focus areas (Stillness, Becoming, Feeling, Grief, "
                "Joy, Relationships, Work, Sleep, Creativity).")
    bullet(doc, "A 'Ready when you are' page that quotes your intention.")
    shot(doc, "03-onboarding-welcome.png", "Step 1 of the welcome.")

    h2(doc, "4. Today's three small steps")
    body(doc, "Every day the dashboard shows three small invitations. They are "
              "never required — they're just gentle nudges.")
    bullet(doc, "Step 1 — Arrive: say hello to the Companion.")
    bullet(doc, "Step 2 — Notice: watch one short episode.")
    bullet(doc, "Step 3 — Reflect: write a sentence in the journal.")
    body(doc, "Each step you finish gets a soft check. There's a small 'streak' "
              "counter for days you did all three — but missing days is fine.")
    shot(doc, "04-dashboard-member.png", "The dashboard.")

    h2(doc, "5. Talking to the Companion")
    body(doc, "Click 'Companion' in the sidebar. You'll see four starter sentences "
              "you can tap, or you can type your own. The Companion will answer, "
              "guess at an emotion, and suggest a single question to sit with.")
    shot(doc, "06-companion-empty.png", "The empty Companion screen.")
    body(doc, "Glimmora is NOT a therapist. If you ever say something serious "
              "like 'I want to die', a rose-colored card pops up with phone "
              "numbers for crisis lines around the world. Please use them.")
    shot(doc, "07-companion-with-crisis.png", "The safety card.")

    h2(doc, "6. Stories — the calm library")
    body(doc, "Click 'Stories'. Pick a series (like Still Mind). Pick an "
              "episode. Each episode ends with a single, kind question — "
              "you can click the link below the video to write a reflection "
              "on that question.")
    shot(doc, "10-stories-library.png", "The library page.")
    shot(doc, "11-series-page.png", "Inside a series.")

    h2(doc, "7. The journal (Reflect)")
    body(doc, "Click 'Reflect' → 'New reflection'. Write a sentence. Pick a mood. "
              "Set the intensity slider. Save. The Reflect home page builds a "
              "small map of how you've been — your 'inner weather'.")
    shot(doc, "08-reflect-new.png", "Writing in the journal.")
    shot(doc, "09-reflect-digest.png", "Your inner weather map.")

    h2(doc, "8. Circles — quiet community")
    body(doc, "Click 'Circles'. Pick one. You can write a short message. "
              "Other people see your message under a made-up handle — never "
              "your username — and no one can DM you. The space stays slow.")
    shot(doc, "13-circles.png", "The Circles list.")

    h2(doc, "9. Profile — see who you are")
    body(doc, "Click 'Profile'. You'll see:")
    bullet(doc, "You — edit your name, avatar, and bio.")
    bullet(doc, "Your role — tells you if you're a Member, Creator, or Admin, "
                "and what each can do.")
    bullet(doc, "Membership — shows whether you're on the Free or Premium plan.")
    shot(doc, "14-profile-member.png", "Profile as a Member.")
    shot(doc, "14-profile-creator.png", "Profile as a Creator.")

    h2(doc, "10. Roles — who can do what")
    body(doc, "There are four roles. The sidebar tells you which one you are.")
    bullet(doc, "Member — read, talk, watch, reflect, post in circles. (Default.)")
    bullet(doc, "Creator — Member + publish their own series and episodes in Studio.")
    bullet(doc, "Admin — Member + review creator applications + moderate.")
    bullet(doc, "Superadmin — Admin + can also manage other admins.")
    body(doc, "Want to become a Creator? See the next section.")

    h2(doc, "11. Becoming a Creator")
    body(doc, "On the Dashboard you'll see a soft 'Do you have something quiet "
              "to share?' callout. Click 'Apply to become a creator →'. Write "
              "1–3 sentences about what you'd like to share. Click Send.")
    shot(doc, "15-creator-apply.png", "The apply page.")
    body(doc, "After you apply, the page shows 'YOUR APPLICATION — PENDING'. "
              "An admin reads it. If they approve you, your role becomes Creator "
              "the next time you visit. A new 'Studio' link will appear in your "
              "sidebar.")

    h2(doc, "12. Studio — for Creators")
    body(doc, "When you're a Creator, click 'Studio'. You can:")
    bullet(doc, "Create a new series (title, tagline, cover image).")
    bullet(doc, "Add episodes to a series.")
    bullet(doc, "See small analytics about how your series are doing.")
    shot(doc, "20-creator-studio.png", "The Creator Studio.")

    h2(doc, "13. Admin tools (only for Admins)")
    body(doc, "Admins see one extra link in the sidebar: 'Admin'. The Admin page shows:")
    bullet(doc, "Numbers — users, series, episodes, reflections, conversations, posts.")
    bullet(doc, "Creator applications — Approve or Deny.")
    bullet(doc, "Users — a list of everyone on the platform.")
    shot(doc, "17-admin.png", "The Admin page.")

    h2(doc, "14. Dark and light mode")
    body(doc, "Click the moon or sun in the top-right of any page. The app "
              "switches. It remembers your choice for next time.")

    h2(doc, "15. If something goes wrong")
    bullet(doc, "Can't log in? Check the username and password. They are case-sensitive.")
    bullet(doc, "Page is blank? Refresh once. If still blank, restart the dev server.")
    bullet(doc, "Companion says 'companion is resting'? Wait a few seconds and try again.")
    bullet(doc, "If you need help, contact your admin or the person who set up Glimmora.")

    h2(doc, "16. Safety")
    body(doc, "Glimmora ONE is not a doctor or a therapist. It's a calm space "
              "for reflection. If you're in danger, please contact a real person — "
              "a trusted adult, or a local crisis line. The Companion will show "
              "you the closest crisis numbers on the safety card.")

    out = OUT / "USER_MANUAL.docx"
    doc.save(str(out))
    print(f"wrote {out}")


if __name__ == "__main__":
    build_testing_guide()
    build_user_manual()
