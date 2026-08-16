# Flexee — Landing Page 

A single-page Next.js (App Router) landing page for the Flexee simulation, styled with Tailwind CSS v4. It's a static page that introduces the sim: the inheritance premise, the fourteen-week arc, the four possible endings, and what makes a run hard.

## Run it 

```bash
npm install
npm run dev
```

Then open http://localhost:3000. For a production build, `npm run build` followed by `npm run start`.

## What's here

Everything lives in `app/`. `page.js` is the landing page, `Reveal.js` and `ArcDiagram.js` are small client components that handle the animations, `globals.css` holds the Tailwind import and the design tokens, and `layout.js` sets the page metadata. Styling is Tailwind utilities throughout; `globals.css` stays tiny, holding just the theme tokens (the color palette, the font stacks, one keyframe) in a `@theme` block and the base body background. There's no component library and no external fonts, so it builds without reaching for anything at build time.

## The design

The look is an operations console rather than a generic hero, grounded in the sim's own world of red/amber/green dashboards and gates that open, close, and detonate. Those three signal colors are used functionally (green for open and sound, amber for closed, red for detonated), a serif display face is paired with a monospace for the readout labels, and the signature element is the fourteen-week arc near the top. That arc shows a sample run where the budget gate holds but the OT gate detonates at Week 10, capping the outcome at Win With Scars, which teaches the ceiling rule at a glance.

## The animations

The arc is the centerpiece. When it scrolls into view, the gate tracks draw themselves in left to right (the budget line runs the full width, the OT line goes green and then the red segment continues), the week ticks fade in one after another, and the closed and detonated markers appear on cue, with the detonation marker holding a slow pulse. The hero fades and lifts into place on load, each section reveals as it enters the viewport (via a small IntersectionObserver in `Reveal.js`), and the ending and reason cards lift slightly on hover. All of it respects `prefers-reduced-motion`, so the whole thing snaps to its final state for anyone who's asked to reduce motion.

## Wiring it up next

The two hero buttons and the "Enter simulation" link point at page anchors for now. When the app routes exist, point them at your login or run route (there's a comment marking the spot in `page.js`), and set `NEXT_PUBLIC_API_URL` to the Django API base so the app pages can call it.
