# Budget Begleitung

Independent German editorial magazine built with static Astro and TypeScript, local Pagefind search and an in-browser budget calculator.

## Run

Use Node 24 LTS and install `unzip` for the official font acquisition step.

```sh
npm ci
npm run fonts
npm run check
npm test
npm run build
npm run preview
```

The font script acquires original licensed files from the official distributor and verifies their hashes. Font binaries, secrets, reference screenshots, source artwork masters and private documentation are deliberately excluded from this repository.

`npm run test:e2e` runs interaction, accessibility and responsive browser checks against a preview on port 4321. `npm run build` also validates the 18-article launch inventory, internal links, six external source-link occurrences and indexing rules.

The Dockerfile produces an unprivileged static web server on port 8080, with a `/healthz` readiness route, 301 redirects to homepage for unknown routes, security headers and generated CSP hashes. Only the static build enters the runtime image. There are no runtime secrets or care-data endpoints.

Calculator values are integer cents. Inputs remain in browser memory. The ruleset has an explicit review deadline and stops numeric calculation when the deadline passes. Renew the review only after checking the primary sources.

## Editorial assets

The site uses original tactile paper illustrations. Author artwork is abstract. Human figures are small, distant and faceless. No photographic portraits are published.

Publication dates and assigned issue dates are separate. Recheck dated rules and reform status before changing the release date or rolling out a later edition.
