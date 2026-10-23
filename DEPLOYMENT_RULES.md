# Deployment Rules — siwify.com on Vercel Hobby

Production deploys are triggered by GitHub, not by the CLI. Vercel watches
`mraitta-art/siwa-oasis`; `git push` also mirrors `siwifywithus-alt/siwa-oasis`
so both remotes stay identical. The CLI (`vercel deploy --prod`) is a fallback
for uncommitted work only, and must never run while a Git build is in flight —
the Hobby plan allows exactly one concurrent build.

## Storage topology

| Layer | Service | Configured by |
| --- | --- | --- |
| Database | TiDB Cloud — `siwa_oasis`, eu-central-1 | `DB_*` env vars |
| Images / video | Cloudinary — cloud `di8icdism`, Free plan | `CLOUDINARY_*` env vars |
| App, HTML and static assets | Vercel | this repo |

Media URLs stored in the database are absolute `res.cloudinary.com` links, so
image bytes never pass through Vercel. `public/uploads/` is a legacy local
fallback: the live homepage references it zero times, while `business_media`
and `vendor_gallery` currently hold no rows.

Last audit of the Cloudinary account: **1.19 / 25 credits**, 0.37 GB bandwidth,
413 transformations, 551 assets, largest 2.86 MB. No URL in the codebase applies
`f_auto` or `q_auto`, so images are delivered at original size — that is the
cheapest remaining win, and it costs Vercel nothing.

## One click

| Entry point | Command |
| --- | --- |
| Double-click | `deploy.cmd` |
| VS Code | `Ctrl+Shift+B` → "Deploy to Vercel (one click)" |
| Terminal | `npm run deploy:vercel` |
| Gates only, no push | `npm run deploy:vercel:dry` |

The script runs eight gates in order and stops at the first failure.

## The rules

| # | Rule | Why it exists | Limit on Hobby |
| --- | --- | --- | --- |
| R1 | Exactly one build at a time | A second deploy queues; both burn build time | 1 concurrent build |
| R2 | Daily deployment budget | Refuses at 80 deploys, warns at 60 | 100 deploys/day |
| R3 | `tsc --noEmit` must pass | `next.config.ts` sets `ignoreBuildErrors`, so a broken build would reach production | — |
| R4 | Never commit `.env*` or keys | Secrets must not enter the repo or the upload | — |
| R5 | `public/` under 90 MB | Uploaded source is capped, and every deploy ships `public/` | 100 MB |
| R6 | Report media over 1.5 MB | Image bytes come from Cloudinary, but heavy files still ship with every build | 100 MB upload |
| R7 | Push once, to the watched repo | Only `mraitta-art` is built; a bare `git push` mirrors the fork | — |
| R8 | Verify the live alias | A green build is not a working site | — |

## Budget watchlist

| Resource | Hobby allowance | Status here |
| --- | --- | --- |
| Fast Data Transfer | 100 GB / month | **Low** — image bytes are served by Cloudinary, not Vercel |
| Fast Origin Transfer | 10 GB / month | Low — HTML and API only; `/uploads/*` is immutable-cached |
| Image Transformations | 5,000 / month | Unused — `next/image` would spend these; prefer Cloudinary URL params |
| Active CPU | 4 CPU-hours | Watch — 17 `force-dynamic` routes, no ISR |
| Function Invocations | 1M / month | Fine |
| Deployments | 100 / day | Protected — ignored-build-step skips non-build commits |

Exceeding a Hobby quota does not bill you; it **blocks that resource for 30
days**. Treat these as hard ceilings, not budgets to spend.

## When something goes wrong

- Build failed: production keeps serving the previous deployment. Nothing to undo.
- Site unhealthy after a green build: `git revert --no-edit <sha> && git push`.
- Quota warning received: check the Vercel dashboard usage page, then attack
  egress first (R6) — it is consumed far faster than any other resource here.
