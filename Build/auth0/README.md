# Auth0 — this app's sign-in lives in a shared tenant

**There is no Action file in this folder on purpose.** This app's post-login Action is not its own: the
`ocstormwatertools` tenant serves **both** OC Smart Watershed Network (this app) and OC Stormwater Tools
(`esassoc/neptune`), and one Action handles every connection for both.

The single reference copy lives with neptune, at `Build/auth0/post-login-action.js` in
`esassoc/neptune`, alongside the federation runbook at `docs/ocpw-county-sso.md`. Keeping one copy is
deliberate — two copies of the same tenant's Action in two repos would drift, and a stale copy nobody
knows is stale is the failure this whole exercise was about.

**Nothing deploys any of it.** The Auth0 dashboard is what runs.

## What sharing a tenant means for changes here

- **An edit changes both products at once.** There is no staging one app and watching it.
- **One tenant serves dev, QA and prod**, so an edit is immediately live in all three.
- Verify a login for **both** apps afterwards, and a County (Entra) login as well as an
  email/password one. Auth0 Actions keep version history, so a revert is available.
- If this app ever needs behaviour the other does not, branch on `event.client` inside the shared
  Action rather than adding a second Action to the flow. Splitting the flow into multiple Actions is
  what previously broke federated login for OC Stormwater Tools.

## What the Action gives this app

Claims on the **access token**, which is where `User.UpdateClaims` reads them from:
`email`, `given_name`, `family_name`. `name` is deliberately not forwarded — nothing here reads it and
Entra sends it as "Last, First".

`LoginName` has no claim behind it either: `UpdateClaims` takes `nickname` when present and otherwise
falls back to the email address.

For database signups missing a name, the Action renders a name-collection form
(`ap_fM32bSgX3ifwS7bqyp5pey`) and — **as of 2026-08-19** — writes the submitted names to
`user_metadata` itself.

## The fix that prompted this record

Until 2026-08-19 the form's own `UPDATE_USER` flow node was trusted to do that write. That node can
write nothing while every layer reports success: in the Biochar Atlas tenant it wrote nothing across
four consecutive signups, and both tells were absences — empty `artifacts` in the flow output, and no
`API Operation: Update a User` in the tenant log. `Flows Execution Completed` means the flow ran, not
that it did anything.

A user caught by that arrives with empty `given_name` / `family_name` claims. Every name assignment in
`UpdateClaims` is guarded by `IsNullOrWhiteSpace`, so nothing is written and the row keeps whatever it
had — for a brand-new account, nothing:

```sql
SELECT UserID, Email, FirstName, LastName, CreateDate, LastActivityDate
FROM dbo.[User]
WHERE (FirstName IS NULL OR FirstName = '' OR LastName IS NULL OR LastName = '')
  AND GlobalUserID IS NOT NULL      -- has signed in through Auth0
ORDER BY CreateDate DESC;
```

Anyone in that list heals on their next login, since the Action re-renders the form whenever a name is
missing and now persists what it collects. Neptune found one such row on its side (`Person` 1446, a
March 2026 signup still active in May with NULL names), which is what prompted the fix.

Note that **`LoginName` is no use as a "did this user self-register" marker here** — `UpdateClaims`
populates it for everyone, from `nickname` or the email. `GlobalUserID` is the marker for having signed
in through Auth0.

## Do not move the write back into a flow

If a future change needs the form to do more, the write still belongs in the Action. A flow step that
stops writing gives no signal at all — no error in the form, the flow, the tenant log, or the Action.
