# Deployment Rules — siwify.com on Vercel Hobby

Production deploys are triggered by GitHub, not by the CLI. Vercel watches
`mraitta-art/siwa-oasis`; `git push` also mirrors `siwifywithus-alt/siwa-oasis`
so both remotes stay identical. The CLI (`vercel deploy --prod`) is a fallback
for uncommitted work only, and must never run while a Git build is in flight —
the Hobby plan allows exactly one concurrent build.

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
| R6 | Report media over 1.5 MB | One hero image can consume the whole monthly transfer | 100 GB/month |
| R7 | Push once, to the watched repo | Only `mraitta-art` is built; a bare `git push` mirrors the fork | — |
| R8 | Verify the live alias | A green build is not a working site | — |

## Budget watchlist

| Resource | Hobby allowance | Status here |
| --- | --- | --- |
| Fast Data Transfer | 100 GB / month | **At risk** — 39.5 MB of raw PNG uploads, no `next/image` |
| Fast Origin Transfer | 10 GB / month | Protected — `/uploads/*` is immutable-cached |
| Image Transformations | 5,000 / month | Unused — the cheapest lever to cut egress ~93% |
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
