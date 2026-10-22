# Minisite vendor handoff setup

The admin minisite builder saves drafts as business-scoped revisions. A draft can be previewed or sent to the vendor for an optional WhatsApp review. Admins may publish a saved draft after confirming the admin publication acknowledgment; this does not imply vendor approval. The vendor review path separately records the vendor's authority, ownership, and responsibility acknowledgment, and only an accepted revision may be published through that path.

The public `/{business-slug}` route resolves business minisites before standalone website pages. It renders the latest `published` handoff revision when one exists. For backward compatibility, it can read an existing `minisite_layout_{slug}` config if no published handoff revision exists; new admin saves go to the revision workflow, and publishing mirrors the active revision to that config for legacy readers. A saved draft alone is not public.

The vendor's separate profile visibility setting is not an admin-layout publication or vendor review decision. Keep that distinction clear when describing publication status.

Vendor/category templates and sectional manifests continue to configure content within a business's section routes. They do not replace or outrank the published root layout at `/{business-slug}`; template selection is limited by business category and subscription eligibility.

## Database

Apply `migrations/041_minisite_vendor_handoffs.sql`, `migrations/042_crm_contact_groups.sql`, and `migrations/043_vendor_profile_contact_and_approval.sql` to the application database before using these features. The third migration adds the vendor profile phone and approval fields required to link a vendor to the invited WhatsApp number. The second migration creates imported-contact groups, tracked WhatsApp campaigns, and vendor-targeted announcements.

## WhatsApp Business Platform

Configure these server-side environment variables:

- `WHATSAPP_ACCESS_TOKEN`: Meta WhatsApp Cloud API access token.
- `WHATSAPP_PHONE_NUMBER_ID`: ID of the registered sending phone number.
- `WHATSAPP_MINISITE_REVIEW_TEMPLATE`: approved template name.
- `WHATSAPP_API_VERSION`: explicit Graph API version, such as the version enabled for your Meta app.
- `WHATSAPP_TEMPLATE_LANGUAGE`: approved template language code; defaults to `en_US`.
- `WHATSAPP_VERIFY_TOKEN`: private verification string configured on the Meta webhook.
- `WHATSAPP_APP_SECRET`: Meta app secret used to validate webhook signatures.
- `WHATSAPP_CRM_BROADCAST_TEMPLATE`: approved one-body-variable template used by CRM group campaigns.
- `WHATSAPP_CRM_TEMPLATE_LANGUAGE`: approved language code for that template; defaults to `WHATSAPP_TEMPLATE_LANGUAGE`.
- `NEXT_PUBLIC_APP_URL`: canonical HTTPS site origin used to construct review links.

The approved minisite-review template must contain two body text parameters, in order: the business name and the review URL. The webhook callback URL is `/api/webhooks/whatsapp`; subscribe it to inbound messages and WhatsApp message status updates. Keep all credentials server-side and out of source control.

For CRM campaigns, approve a separate template containing one body text variable for the campaign message. Imported contacts are ineligible unless the admin records explicit WhatsApp opt-in and imports their number with an international `+` or `00` prefix. Campaigns are sent in batches of five; webhook callbacks update sent, delivered, read, and failed counts. Exact `STOP`/unsubscribe commands revoke opt-in automatically. CRM groups keep imported personal contacts separate from registered businesses. Vendor ribbon/news notices are visible only to business members of the selected group.

## Release checklist

1. Apply the database migration.
2. Configure the WhatsApp sender, template, webhook, and environment values.
3. Build a draft in the admin minisite builder and use its preview.
4. Optionally send an invitation and confirm the vendor can review, request changes, or accept the exact revision and agreement.
5. Publish either with the admin acknowledgment or, for the vendor-approved path, after vendor acceptance. Verify the public `/{business-slug}` page displays the selected published revision.
6. Confirm Meta status callbacks update the handoff CRM. A Meta-accepted send is recorded as `sent`; delivery/read tracking requires a reachable, correctly configured webhook.
7. Import an exported `.vcf` or `.csv` contact file, create a group, and add only contacts with consent to WhatsApp outreach. Add registered businesses separately when targeting dashboard ribbon/news.
