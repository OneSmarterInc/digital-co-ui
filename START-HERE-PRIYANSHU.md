# Flexee — Student Console (start here)

This tree is your flexee-web with the student experience finished. Your backend
passed full verification untouched — engine, scoring, and weeks are byte-identical to
the verified build, your API reproduces all four golden runs to the flag, and your
114-test suite passes — so nothing in this handoff asks you to change the Django side.
Everything new is in the Next app, it builds clean (`npm run build`), and your API
contracts are used exactly as you wrote them.

## What's new or changed

    app/console.css                        NEW — the dark console design system, scoped
                                           under .dc-console so your light instructor
                                           theme is untouched
    app/layout.js                          CHANGED — imports console.css; console fonts
                                           load at runtime so the build stays offline
    app/student/[id]/Intro.jsx             NEW — the seven-scene opening sequence; plays
                                           once per firm (localStorage), Skip available
    app/student/[id]/WeekConsole.jsx       NEW — the week screen for all 14 weeks:
                                           three-move rail, dossier briefing, decision
                                           form from decision_spec, committed state.
                                           POSTs your exact /run/submit/ contract
    app/student/[id]/ArtifactsWeek1.jsx    NEW — Week 1's reference files as real
                                           documents (portfolio table, dashboards,
                                           spend ledger, the Bryce deck)
    app/student/[id]/AdvisorsConsole.jsx   NEW — the war room on one screen: roster
                                           beside the conversation. All your machinery
                                           kept (portraits, blink, voice, billing), plus
                                           two refinements: a failed send rolls the
                                           optimistic message back, and the turn budget
                                           is surfaced (compose retires after the
                                           advisor's closing counsel)
    app/student/[id]/AdvisorAvatar.jsx     NEW — your avatar component, extracted so
                                           the page and the war room share it
    app/student/[id]/DebriefConsole.jsx    NEW — verdict tier + four through-line
                                           threads rendered from /run/debrief/
    app/student/[id]/page.jsx              CHANGED — imports the console components,
                                           gates the intro for a fresh firm, renders
                                           WeekConsole / AdvisorsConsole /
                                           DebriefConsole; the old WeekView,
                                           AdvisorsView, and DebriefView are removed

The design split is deliberate: the student experience is the dark operations console;
your instructor and admin screens keep the daylight readout. Both speak the same
red/amber/green signal language. Nothing under /instructor or /admin was modified.

## Five-minute smoke test

Run your Django API and `npm run dev`, then as an admin/instructor create a cohort,
deploy it, enroll a test student, place them in a firm, and sign in as that student.
You should see, in order: the opening sequence (title, Calloway's mandate typing
itself, the estate, the rules, the bench, the stakes), then "Take the chair" landing
on This Week. In the week screen: the briefing dossier with the four rich Week 1
artifacts (flip the Bryce deck), the War room move opening the single-screen advisors
room (send a message; try a voice button if ElevenLabs keys are set), and the Decision
move rendering the Week 1 form. Commit it — you should land on the confirmation seal,
and a second submit attempt should show a friendly notice, not an error. Refresh: the
intro must NOT replay. To see the debrief, drive a run to Week 14 (your admin tools or
the engine shell) and the student page routes to the verdict screen on its own.

## Two small notes on your Django half (no action required for this handoff)

The advisor test that errors in a keyless environment does so because the LLM provider
default is the live one — pointing DIGITALCO_LLM_PROVIDER at `echo` for test runs (or
defaulting to echo when no key is set) makes the suite green anywhere. And the backend
zip shipped its .venv; safe to leave out next time.

## Where your work begins next week

The student side is done end to end. The open front is the instructor experience —
your dashboard is structurally strong and what remains is a polish pass (visual
consistency, the grading flow's edge states, the benchmark reveal moment) plus wiring
the cohort-advance rhythm to how the class will actually run. The build verifies with
`npm run build`; keep that green and the student side needs nothing from you.
