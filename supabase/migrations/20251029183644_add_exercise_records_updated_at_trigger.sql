-- purpose: maintain a per-user per-exercise touch record on write activity
-- affects: public.user_with_exercise_work, public.exercise_records, public.exercise_comments
-- notes:
--  - ensures a single row per (user_id, exercise_id) and bumps updated_at on insert/update in source tables
--  - uses utc timestamps; safe search_path; security invoker
-- ensure uniqueness on (user_id, exercise_id) for reliable upsert
alter table public.user_with_exercise_work
add constraint user_with_exercise_work_user_exercise_key unique (user_id, exercise_id);

-- optional helpful index for lookups by exercise_id
create index if not exists idx_user_with_exercise_work_exercise_id on public.user_with_exercise_work (exercise_id);

-- generic helper to upsert touch row
create
or replace function public.touch_user_with_exercise_work (p_user_id bigint, p_exercise_id uuid) returns void language plpgsql security invoker
set
    search_path = '' as $$
begin
  insert into public.user_with_exercise_work (user_id, exercise_id, created_at, updated_at)
  values (p_user_id, p_exercise_id, timezone('utc', now()), timezone('utc', now()))
  on conflict (user_id, exercise_id)
  do update set updated_at = excluded.updated_at;
end;
$$;

-- trigger from exercise_records
create
or replace function public.trg_touch_user_with_exercise_from_records () returns trigger language plpgsql security invoker
set
    search_path = '' as $$
begin
  perform public.touch_user_with_exercise_work(new.user_id, new.exercise_id);
  return null; -- AFTER trigger, return value ignored
end;
$$;

drop trigger if exists exercise_records_touch_user_exercise on public.exercise_records;

create trigger exercise_records_touch_user_exercise
after insert
or
update on public.exercise_records for each row
execute function public.trg_touch_user_with_exercise_from_records ();

-- trigger from exercise_comments
create
or replace function public.trg_touch_user_with_exercise_from_comments () returns trigger language plpgsql security invoker
set
    search_path = '' as $$
begin
  perform public.touch_user_with_exercise_work(new.user_id, new.exercise_id);
  return null; -- AFTER trigger, return value ignored
end;
$$;

drop trigger if exists exercise_comments_touch_user_exercise on public.exercise_comments;

create trigger exercise_comments_touch_user_exercise
after insert
or
update on public.exercise_comments for each row
execute function public.trg_touch_user_with_exercise_from_comments ();

-- metcon_exercise_records are not wired here because they reference metcon_exercises
-- (no exercise_id). Confirm desired schema before adding analogous triggers.