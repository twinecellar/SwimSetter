# Inviting someone to SwimSetter

Sign-ups are invite-only. Each invite link is single-use and expires once the account is created.

---

## Step 1 — Generate an invite token

Open the [Supabase SQL editor](https://supabase.com/dashboard) for the SwimSetter project and run:

```sql
insert into public.invite_tokens default values returning token;
```

You'll get back a token like:

```
3f8a2c1d9e4b7f2a...
```

---

## Step 2 — Build the invite link

```
https://<your-domain>/auth?invite=<token>
```

For example:

```
https://swimsetter.up.railway.app/auth?invite=3f8a2c1d9e4b7f2a...
```

---

## Step 3 — Send it

Text or email the link to your friend. When they open it they'll see a sign-up form.

After signing up they'll go through a short swimming experience quiz, then land in the app.

---

## Notes

- Each link works **once only** — it's burned the moment the account is created.
- If you need to re-invite someone (e.g. the link expired or was lost), just run the SQL again to generate a fresh token.
- To see which tokens have been used, run:

```sql
select token, created_at, used_at
from public.invite_tokens
order by created_at desc;
```
