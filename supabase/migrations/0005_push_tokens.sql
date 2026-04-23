-- Week 4/5: push notification tokens on profiles
-- Workers register an Expo push token on first sign-in; backend uses it
-- to send targeted notifications (new task assigned, shift reminder, etc.)

alter table profiles add column if not exists push_token text;
alter table profiles add column if not exists push_token_updated_at timestamptz;

create index if not exists profiles_push_token_idx on profiles(push_token)
  where push_token is not null;

-- Allow users to update their own push_token (separate from general update policy)
-- The existing profiles_update_self policy covers this since it allows
-- any update where id = auth.uid(). No additional policy needed.
