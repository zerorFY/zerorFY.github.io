-- Idempotent migration for the single-room END PARTY action.
-- It grants delete access only to the dedicated birthday table and bucket.

drop policy if exists "birthday photos public delete" on public.birthday_photos;
create policy "birthday photos public delete"
on public.birthday_photos for delete
to anon
using (true);

drop policy if exists "birthday storage public delete" on storage.objects;
create policy "birthday storage public delete"
on storage.objects for delete
to anon
using (bucket_id = 'maxwell-birthday');
