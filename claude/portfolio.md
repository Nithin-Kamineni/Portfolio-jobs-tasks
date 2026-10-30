# Portfolio guide (claude/portfolio.md)

The public one-page site at `/`: a header with the owner's name and headline, a hero image, then five sections (about, projects, experience, publications, résumé), a sticky navigation bar drawn as a five-stage CPU pipeline, and three colour themes (dark, dim, light). It is prerendered to static HTML at build time and needs no database.

Switched on by `MODULES.portfolio` in `site/src/owner.config.ts`. When it is off, `/` shows only a small page that links to the private app.

## Where everything comes from
| What | File |
|---|---|
| Name, initials (logo chip), headline, kicker, "open to" line, highlight chips, About paragraphs, what they're seeking, page title and description | `site/src/owner.config.ts` (`OWNER`) |
| E-mail, GitHub, LinkedIn, Google Scholar links | `site/src/owner.config.ts` (`LINKS`; an empty string hides a link in the header) |
| Education, recognition, skills, projects, experience, publications, stats, photos, the web résumé | `site/src/components/site/content.ts` |
| Hero image | `site/public/hero-placeholder.png` (replace the file, about 1600 × 900; or change the path in `site/src/components/App.tsx`) |
| About photos | `site/public/about/*.png|jpg`, listed in `PHOTOS` in content.ts (square; the first is the main one) |
| Downloadable CV | any PDF in `site/public/cv/` (the first one found is linked; without one the button shows as pending) |
| Favicon | `site/public/favicon.svg` (two letters in a rounded square: change `YN`) |
| Section order and names | `SECTIONS` in content.ts, and the section components in `site/src/components/site/Sections.tsx` |
| Colours, fonts, spacing | `site/src/styles/styles.css` (theme tokens at the top: dark, dim, light), `site/src/styles/site.css` (sections) |

## Setup (first time)
1. Fill `OWNER` and `LINKS` in `owner.config.ts` (ask the owner; facts only from `profile/master_profile.md`).
2. Fill `content.ts` section by section from the profile. Keep the shapes (TypeScript types are at the top of each block). For every project: one number that matters (`metric` + `metricLabel`), what it is, why it matters, tags, links. Ask before guessing anything.
3. Photos: ask the owner for 1–6 square photos. Re-encode them without EXIF location data (any image tool, or a quick script with sharp/squoosh), put them in `site/public/about/`, and list them in `PHOTOS` with alt text. No photos? Keep the placeholders or set `PHOTOS` to one image.
4. Hero image: ask for a wide picture (their work, a diagram, a photo) and replace `site/public/hero-placeholder.png`. They can also keep a plain colour block: delete the `<figure className="hero-image">` in `App.tsx`.
5. CV: ask for a public PDF **without a phone number** and put it in `site/public/cv/`.
6. Run `cd site && npm run dev` and review http://localhost:4321 together in all three themes (the moon/sun button) and at phone width.

## Rules
- Every word is a public claim: only facts from the profile, numbers exactly as the owner gives them, "under review" where that is true.
- Don't add trackers, analytics or third-party scripts without the owner asking.
- Keep the page fast: images under ~300 KB each (WebP or a reasonably compressed JPEG), no extra web fonts.
- Before sharing the link: `npm run build` must pass (it type-checks), and check the page at phone width.

## Ideas the owner may ask for
- A blog: add an Astro content collection under `site/src/content/` and pages under `site/src/pages/blog/`.
- Their own domain: Cloudflare → Workers → the site → Settings → Domains (see `docs/deploy-cloudflare.md`).
- Remove a section: delete it from `SECTIONS`, from `Sections.tsx` and from the nav links in `App.tsx`.
