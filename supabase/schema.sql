create extension if not exists pgcrypto;

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_date timestamptz not null default now(),
  participants text[] not null default '{}',
  audio_path text,
  audio_name text,
  audio_size bigint,
  duration_seconds integer,
  status text not null default 'draft' check (status in ('draft','processing','ready','failed')),
  summary text not null default '',
  decisions jsonb not null default '[]'::jsonb,
  tasks jsonb not null default '[]'::jsonb,
  open_questions jsonb not null default '[]'::jsonb,
  segments jsonb not null default '[]'::jsonb,
  speakers jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meetings_date_idx on public.meetings (meeting_date desc);
alter table public.meetings enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meeting-audio', 'meeting-audio', false, 25165824, array['audio/mpeg','audio/mp4','audio/x-m4a','audio/wav','audio/webm'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;
