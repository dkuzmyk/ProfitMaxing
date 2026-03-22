-- Profiles verification reference
--
-- Purpose:
-- Keep the "who can write real journal data" operations in one place.
-- This is not a schema migration. It is an admin reference script you can
-- copy from when you want to inspect or approve users in Supabase SQL Editor.

-- -----------------------------------------------------------------------------
-- 1. List all profiles
-- -----------------------------------------------------------------------------
-- What it does:
-- Shows every profile row, the email attached to it, and whether that user is
-- currently allowed to create/update/delete real journal entries.
select id, email, is_verified, created_at, updated_at
from public.profiles
order by created_at desc;

-- -----------------------------------------------------------------------------
-- 2. Approve a specific user
-- -----------------------------------------------------------------------------
-- What it does:
-- Grants write access for one user by setting `is_verified = true`.
-- Replace the email below before running.
--
-- Example:
update public.profiles
set is_verified = true,
    updated_at = timezone('utc', now())
where email = 'friend@example.com';

-- -----------------------------------------------------------------------------
-- 3. Revoke a specific user
-- -----------------------------------------------------------------------------
-- What it does:
-- Removes write access for one user by setting `is_verified = false`.
-- Replace the email below before running.
--
-- Example:
update public.profiles
set is_verified = false,
    updated_at = timezone('utc', now())
where email = 'friend@example.com';

-- -----------------------------------------------------------------------------
-- 4. Approve every existing user
-- -----------------------------------------------------------------------------
-- What it does:
-- Marks all current profiles as verified. Useful for a trusted hobby project
-- where you already know every current user should have write access.
--
-- Example:
update public.profiles
set is_verified = true,
    updated_at = timezone('utc', now());

-- -----------------------------------------------------------------------------
-- 5. Check one user quickly
-- -----------------------------------------------------------------------------
-- What it does:
-- Returns a single profile row so you can confirm whether that user is
-- verified before troubleshooting write access.
--
-- Example:
select id, email, is_verified
from public.profiles
where email = 'friend@example.com';
