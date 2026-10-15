# Design: GitHub profile Overview (fraissatt)

Date: 2026-10-14

## Goal

A bilingual (PT-BR and English) GitHub profile README for `github.com/fraissatt`, with an academic and
professional focus. It is published later as the repository `fraissatt/fraissatt`. Statistics are rendered
as SVGs generated inside the repository, with no third-party stats service.

Audience: professors, colleagues, recruiters and anyone evaluating João Vítor's academic and professional path.

## Source of truth

- Lattes CV (updated 2026-10-05): education, experience, languages, certifications, LinkedIn and Lattes links.
- GitHub public API: the 16 public repositories of `fraissatt`.
- Facts not in these sources are not invented. Email and phone are intentionally omitted.

## Theme: Formula 1

Overall theme is Formula 1, in a black/white "timing tower" style with a single red accent (`#e10600`).
No F1 or team logos or trademarks; only colors, typography and generic icons.

- Banner (`assets/banner.svg`, static): dark card, red stripe, checkered strip.
- Section names use F1 vocabulary plus the plain title: Driver Profile (About me), Stints (Experience),
  Power Unit (Stack), Podium (Featured projects), Telemetry (Statistics), Team Radio (Contact).
- Stats SVGs: fixed dark broadcast-graphic design (identical in GitHub light and dark themes).
  Overview = timing tower with positions 1 to 4. Languages = "tyre strategy": stint bar plus ranked rows;
  tyre-compound colors (red, yellow, white, green, blue) only for ranks 1 to 5, gray for the rest.

## Out of scope

- Creating the remote repository, pushing, or changing any GitHub setting (the user does this).
- Private-repository contribution data (would need a personal access token).
- Any third-party stats cards or services.

## Files

```
README.md                      # Portuguese (PT-BR), the version GitHub shows on the profile
README.en.md                   # English version, linked from the top of README.md
assets/banner.svg               # static F1-style banner
assets/stats-overview.svg      # generated: repositories, stars, commits (public), followers
assets/stats-languages.svg     # generated: language usage by bytes, forks excluded
scripts/generate-stats.mjs     # Node 20, zero dependencies
scripts/fixtures/sample.json   # sample API data for local runs
.github/workflows/stats.yml    # daily + manual run, commits only when the SVGs change
```

GitHub renders only `README.md` on the profile, so the English version is a separate file reached by a
link at the top of both READMEs. The two files share structure and section order and differ only in language.
SVG labels are bilingual and short (for example "Repositórios · Repositories") so one SVG set serves both.

## README sections (same order in both languages)

1. Header: name and a one-line introduction.
2. About me / Sobre mim: Software Engineering at Faculdade SENAI Fatesg (8th term, since 2023); international
   internship at ZEISS IQS in Oberkochen, Germany; languages (PT native, EN fluent, DE intermediate).
3. Experience / Experiência: short timeline 2024 to 2026 (Integra Engenharia de Sistemas, Instituto SENAI de
   Tecnologia em Automação, Centro de Metrologia SENAI ZEISS, ZEISS IQS).
4. Stack: badges for Java/Spring Boot, TypeScript/Angular, C#, Dart, PostgreSQL, Git/GitHub, AWS.
5. Featured projects / Projetos em destaque: only PUBLIC repos: `metas-app` (with deploy link), `CEM-Senai-Zeiss`,
   `boas-praticas-software`. One-sentence descriptions are drafts for the user to review.
6. Statistics / Estatísticas: the two generated SVGs.
7. Contact / Contato: LinkedIn and Lattes.

## Statistics generator

- `generate-stats.mjs` reads public data of `fraissatt` from the GitHub API, authenticated with the
  `GITHUB_TOKEN` the Action provides (no personal token).
- Output: two self-contained SVGs with embedded CSS and a fixed dark design, so they look the same in
  GitHub light and dark themes.
- Rendering functions are pure (data in, SVG string out) so they can be exercised with a fixture.
- If the API call fails, the script exits non-zero and leaves the existing SVGs untouched.
- Commit count covers public contributions only (limitation of `GITHUB_TOKEN`); documented in the README footer.

## Workflow

- Triggers: daily cron and `workflow_dispatch`.
- Steps: checkout, set up Node 20, run the script, commit `assets/*.svg` only if changed, using the GitHub
  Actions bot identity.
- Permissions: `contents: write` only.

## Verification

- Local: run the script against `sample.json`, open the SVGs in a browser, check light and dark themes.
- Local: check the READMEs render (links resolve, tables intact) in both languages.
- Not verifiable locally: the workflow itself and live API calls run only after the user publishes the
  repository. This will be stated explicitly at handoff.

## Open items for the user

- Review the project descriptions (drafts based on repository names and Lattes text).
- Publish `fraissatt/fraissatt` and run the workflow once manually.

## Addendum (2026-10-14): Pit Lane art

Approved by the user. New hand-drawn, static SVG illustrations in `assets/art/`:
`ferrari.svg` (Schumacher-era red car), `mclaren.svg` (1990 to 1993 Senna-era red/white car),
`helmet.svg` (yellow with green and blue stripes), `trophy.svg`, and four circuit outlines:
`track-interlagos.svg`, `track-monza.svg`, `track-suzuka.svg`, `track-monaco.svg`.

- New README section `Pit Lane — Garagem / Garage` between Podium and Telemetry (README now has 7 sections).
- Banner gains the helmet and trophy.
- Rules: no logos, sponsors, driver names or faces; art files contain no `<text>` and no `<image>`; cars are
  stylized silhouettes in livery colors; circuits are stylized approximations, stated in the caption.
- Facts in captions: Senna holds the Monaco GP win record (6 wins). McLaren caption covers Senna's 1990 to 1993 cars only.
- Checks: `scripts/art.test.mjs` (files exist, accessible, no text/image/external refs, tags balanced) and the
  README test (7 sections, every art file referenced). Visual check by rendering with headless Edge.

## Addendum 2 (2026-10-14): pixel-art cars

Approved by the user. The two drawn SVG cars were replaced by pixel-art images the user supplied:
`assets/art/ferrari.png` and `assets/art/mclaren.png` (RGBA, transparent background, car only: background, ground
shadow and ground line removed; scaled with nearest-neighbour by an integer factor so pixels stay crisp).
The McLaren is lightened by 28% (blend toward white) at the user's request.

- This supersedes the earlier rule "no logos or sponsors" for the two cars only: the supplied artwork contains
  sponsor branding. Helmet, trophy and circuits remain logo-free.
- The artwork was supplied by the user and its author and license are unknown; crediting the original artist and
  confirming the right to publish it is the user's responsibility.
- Checks: `scripts/art.test.mjs` verifies both PNGs are valid RGBA; transparency was verified visually on light
  and dark backgrounds.

## Addendum 3 (2026-10-14): themed Stints, Power Unit and Podium cards

Approved by the user. The three text sections became static SVG cards in the same timing-tower style as Telemetry:
Stints = "Race Strategy" (tyre-colored stints, newest first, equal widths because the Lattes CV has no exact
months for the ZEISS IQS stint), Power Unit = technology chips grouped by car component (no skill levels, no
logos), Podium = three clickable steps of different heights, winner with a trophy.

- Source of truth: `scripts/profile-content.mjs` (PT and EN). Renderers: `scripts/sections-svg.mjs`.
  Generator: `scripts/generate-sections.mjs` writes ten SVGs to `assets/sections/`; run by hand, not by the Action.
- README alt text carries the same facts in plain text for accessibility.
- All em dashes were replaced by hyphens (headings, README text, SVG "no data" marker). En dashes in date ranges stay.

## Addendum 4 (2026-10-14): pixel-art helmet and animations

Approved by the user. `assets/art/helmet.svg` was replaced by `assets/art/helmet.png`, the pixel-art helmet the
user supplied, cleaned (background and the "AYRTON SENNA" caption removed; only the helmet's pixels kept) and
scaled by an integer factor. The artwork carries sponsor lettering as in the source image; author and license
are unknown (same caveat as the cars).

New animations, all SMIL-based SVG (no scripts) so they play when GitHub shows them as images:
- `assets/animations/senna-s.svg`: top-down McLaren-coloured pixel car (white with red stripe, yellow helmet)
  driving through a pixelated Senna S at Interlagos, 7 s loop, in the Pit Lane section of both READMEs.
  Colours identify the car, not image quality.
- `assets/banner.svg` now animates: five start lights that light up in sequence and go out, and a scrolling
  chequered strip. The banner embeds the helmet PNG as a data URI.

Source: `scripts/pixel-scene.mjs`, `scripts/banner-svg.mjs`; `scripts/generate-animations.mjs` writes both files
(run by hand, not by the Action). Tests: `pixel-scene.test.mjs`, `banner-svg.test.mjs`. Animation playback was
checked by rendering a frame about 3 s into the loop. Limitation: SMIL cannot honour prefers-reduced-motion.

## Addendum 5 (2026-10-14): technology logos in the Power Unit card

Approved by the user (including the download and brand colours). This supersedes the earlier "no logos" rule
for the Power Unit chips only.

- Source: Devicon 2.16.0 (MIT license) via cdn.jsdelivr.net, 11 SVGs. SQL and REST APIs have no logo of their
  own, so they use generic icons drawn for this project. "Spring Boot" uses the Spring logo (no Spring Boot file
  in that version); AWS uses the `original-wordmark` file. The Git/GitHub chip was split into Git and GitHub.
- The downloaded files were treated as untrusted: fetched into an isolated folder, then reduced to `<g>`/`<path>`
  with validated path data and normalised fills (`scripts/tech-logos.mjs`). Tests enforce an element allow-list,
  no styles/scripts/hrefs, unique ids, balanced tags and a minimum fill brightness on the black card.
- Dark brand colours are adjusted: near-black becomes light grey, other dark colours are lifted 40% toward white.
- Logos are trademarks of their owners and appear only to indicate technologies used.

## Addendum 6 (2026-10-14): pixel-art trophy everywhere

Approved by the user. `assets/art/trophy.svg` (drawn) was replaced by `assets/art/trophy.png`, a pixel-art trophy
the user supplied (author and license unknown, same caveat as the other supplied art). Used in the banner, on top
of the first podium step, in the Pit Lane section, in the Podium heading and in the Monaco caption (the 🏆 emoji
was replaced there). Other headings keep their emoji.

The source image was a compressed upscale with no clean block size. The pixel grid was recovered by fitting a
96x96 grid (7.708 px cells, origin 6.5 px / 1.0 px, chosen by minimising colour variance inside cells), sampling
each cell's centre colour, merging near-identical colours (12 colours remain), flood-filling the background from the
edges and dropping grey anti-alias fringe cells. Result: 36x48 native pixels, scaled 9x with nearest-neighbour.
