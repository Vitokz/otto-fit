-- Backfill user_with_exercise_work from existing data
-- Logic:
--  - Consider CURRENT records only (exercise_records.state = 'current')
--  - Consider ALL non-deleted comments (exercise_comments.state in ('active','completed'))
--  - For each (user_id, exercise_id) take the most recent updated_at as last activity
--  - Upsert into user_with_exercise_work, preserving earliest created_at and setting updated_at to the latest activity
begin;

with
    record_touches as (
        select
            er.user_id,
            er.exercise_id,
            max(er.updated_at) as last_activity
        from
            public.exercise_records er
        where
            er.state = 'current'
        group by
            er.user_id,
            er.exercise_id
    ),
    comment_touches as (
        select
            ec.user_id,
            ec.exercise_id,
            max(ec.updated_at) as last_activity
        from
            public.exercise_comments ec
        where
            ec.state in ('active', 'completed')
        group by
            ec.user_id,
            ec.exercise_id
    ),
    aggregated as (
        select
            user_id,
            exercise_id,
            last_activity
        from
            record_touches
        union all
        select
            user_id,
            exercise_id,
            last_activity
        from
            comment_touches
    ),
    per_pair as (
        select
            user_id,
            exercise_id,
            max(last_activity) as last_activity
        from
            aggregated
        group by
            user_id,
            exercise_id
    )
insert into
    public.user_with_exercise_work (user_id, exercise_id, created_at, updated_at)
select
    p.user_id,
    p.exercise_id,
    p.last_activity,
    p.last_activity
from
    per_pair p on conflict (user_id, exercise_id)
do
update
set
    updated_at = greatest(
        public.user_with_exercise_work.updated_at,
        excluded.updated_at
    );

commit;