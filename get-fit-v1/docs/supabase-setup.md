# Supabase setup

## 1) Add environment variables
Create a `.env.local` file in the project root with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 2) Enable email/password auth
In Supabase dashboard:
- Authentication -> Providers
- Enable "Email"
- Configure Site URL to match your local/dev URL (e.g. http://localhost:3000)

## 3) Create the data table
Run this SQL in the Supabase SQL editor:

```
create table if not exists public.user_data (
  id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy "Users can view their data"
on public.user_data
for select
using (auth.uid() = id);

create policy "Users can insert their data"
on public.user_data
for insert
with check (auth.uid() = id);

create policy "Users can update their data"
on public.user_data
for update
using (auth.uid() = id)
with check (auth.uid() = id);
```

## 4) Restart the dev server
If the app is running, restart it so the env vars are available.
