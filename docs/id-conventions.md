# Participant IDs: `auth.uid()` is not `profiles.id`

Smitten Singles / SmittenSync — Supabase `qgctltxcgsnbrdtbhmay`.

Root cause of the 2026-08-31 "No upcoming events found for your account" bug,
where a participant with released matches could not reach them.

## The rule

`auth.users.id` (what `/auth/v1/user` returns) and `profiles.id` are different
values. `profiles.user_id` is the link between them.

These columns are all keyed on **`profiles.id`**, never on the auth user id:

| Table | Column |
|---|---|
| `registrations` | `profile_id` |
| `event_picks` | `picker_id`, `picked_id` |
| `matches` / `mutual_matches` | `user_id`, `matched_user_id` / `user_a`, `user_b` |
| `messages` | `sender_id`, `recipient_id` |
| `event_invites` | `profile_id` |
| `profiles` | `id` |

Any frontend holding a session must resolve the profile id once after auth and
use it for all of the above:

```js
var r = await api('/rest/v1/profiles?user_id=eq.' + UID + '&select=id&limit=1');
PID = (await r.json())[0]?.id || UID;   // fall back for legacy rows where id == user_id
```

## Why it fails silently

The RLS policies are written permissively as
`auth.uid() = x OR current_profile_id() = x`. Passing the wrong id does **not**
produce a 403 — the policy simply matches nothing and the query returns `[]`.

So the signature of this bug is **an empty list with no error**. Not a
permissions problem, not a data problem. Before chasing RLS or missing rows,
check which id space the frontend is passing.

## Exceptions — these really are auth-user-id based

- `staff.user_id`
- `get_host_events(p_user_id)`
- the `profile-photos` storage path prefix. Its storage policy requires
  `(storage.foldername(name))[1] = auth.uid()::text`, so the upload path stays
  `UID + '/...'` even though the `profiles` row it updates is keyed on `PID`.

## Also worth knowing

`get_participant_events(p_profile_id)` is an **event discovery feed** — all
published upcoming events near the participant, with `external_checkout_url`
and `price_min`. It never touches `registrations`. It is not a "my events"
list and its `event_date >= CURRENT_DATE` filter is correct for what it does.
Don't reach for it when the question is "which events did this person attend".

## Deploy

`me.smittensingles.com` is this repo on Vercel via GitHub, production from
`main`. Pushing a feature branch produces a preview only and does not ship.
