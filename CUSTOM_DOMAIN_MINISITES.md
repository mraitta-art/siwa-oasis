# Custom-Domain Minisites

Every business keeps its default minisite URL:

`https://siwify.com/{business-slug}`

A verified client domain can additionally serve the same minisite at its root:

`https://client-domain.com/`

## Activation flow

1. Apply `migrations/030_custom_domain_minisites.sql` to the production database.
2. In the vendor minisite settings, save the client's domain. Enter only the hostname, such as `example.com`.
3. Add the domain to the SiWiFy Vercel project and complete the DNS instructions shown by Vercel.
4. Verify domain ownership and certificate issuance at the registrar/Vercel.
5. An authorized admin calls `PATCH /api/jana/businesses/{businessId}/custom-domain` with `{ "verified": true }`.
6. Open the domain root. The existing minisite renderer will load the verified business without changing the browser URL.

A vendor-supplied domain is deliberately unverified by default. It will not route until DNS ownership has been checked by an authorized admin. Removing or changing the domain automatically clears verification.

## DNS

Use the exact records Vercel displays for the project. Commonly, `www` uses a CNAME to Vercel and the apex domain uses Vercel's recommended A record. Do not guess the apex record; registrar and Vercel instructions take precedence.

## Notes

- Existing slug URLs remain unchanged and continue to work.
- Only verified domains are host-routed.
- The domain must be added to the Vercel project so TLS and requests reach SiWiFy.
- Domain ownership verification is an operational/admin step; the application does not treat a typed domain as proof of ownership.
