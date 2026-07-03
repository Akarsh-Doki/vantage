-- 002 created the creative-library tables but granted no privileges, so the
-- backend's service_role gets "42501 permission denied" on ingest.
-- Shared product content: backend-only access, nothing for client roles
-- (anon/authenticated get no grants — the library is not client-readable).
grant select, insert, update on public.creative_mechanisms to service_role;
grant select, insert, update on public.creative_campaigns to service_role;
