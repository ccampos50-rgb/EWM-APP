-- Week 3: Storage bucket for task + incident photos, Realtime publication

-- ─────────────────────────────────────────────────────────────
-- Storage bucket for task-photos (photo proof + incidents)
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'task-photos',
  'task-photos',
  false,
  10 * 1024 * 1024,  -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Workers can upload to paths scoped by their own profile id
create policy "task_photos_worker_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'task-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Workers read their own; managers with site access read any photo tied to their sites.
-- Simplified: authenticated users can read any object they uploaded or any object in a site they access.
-- For MVP we allow authenticated reads; tighten later.
create policy "task_photos_authenticated_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'task-photos');

-- ─────────────────────────────────────────────────────────────
-- Realtime: publish shifts, tasks, task_events so admin live boards can subscribe
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table shifts;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table task_events;
alter publication supabase_realtime add table incidents;

-- Enable replica identity full so Realtime gets full row data on updates
alter table shifts replica identity full;
alter table tasks replica identity full;
alter table task_events replica identity full;
alter table incidents replica identity full;

-- ─────────────────────────────────────────────────────────────
-- Useful view: live board rows per site (denormalized for speed)
-- ─────────────────────────────────────────────────────────────
create or replace view live_board_rows as
select
  t.id as task_id,
  t.shift_id,
  t.site_id,
  t.template_code,
  t.target_ref,
  t.status as task_status,
  t.started_at,
  t.completed_at,
  t.duration_seconds,
  tt.label as template_label,
  tt.expected_minutes,
  s.worker_id,
  s.status as shift_status,
  p.full_name as worker_name,
  p.avatar_url,
  case
    when t.status = 'in_progress' and t.started_at is not null
      and (extract(epoch from (now() - t.started_at))/60) > tt.expected_minutes
    then true else false
  end as running_over
from tasks t
join shifts s on s.id = t.shift_id
join profiles p on p.id = s.worker_id
left join task_templates tt on tt.code = t.template_code;
