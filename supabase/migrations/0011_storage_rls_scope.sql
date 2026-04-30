-- 0011 — Tighten task-photos storage read policy.
--
-- Current policy lets ANY authenticated user read ANY photo in the task-photos
-- bucket. This works for the pilot (one tenant, all workers in same site) but
-- leaks across sites/tenants once we onboard a second one.
--
-- New policy allows read only if:
--   1. You uploaded the photo (your UID is the first folder of the path), or
--   2. You have super_admin or rvp (global view), or
--   3. You have site access for the task or incident that references this photo.

drop policy if exists "task_photos_authenticated_read" on storage.objects;

create policy "task_photos_read_scoped" on storage.objects for select
  to authenticated
  using (
    bucket_id = 'task-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or has_role('super_admin')
      or has_role('rvp')
      or exists (
        select 1 from tasks t
        where t.photo_url = storage.objects.name
          and has_site_access(t.site_id)
      )
      or exists (
        select 1 from incidents i
        where i.photo_url = storage.objects.name
          and has_site_access(i.site_id)
      )
    )
  );
