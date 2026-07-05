-- Cosine-similarity search over the creative-mechanism library.
-- Called by app/tools/mechanisms.py via PostgREST RPC. The function name and
-- parameter names MUST match that .rpc(...) call exactly:
--   .rpc("match_creative_mechanisms",
--        {"query_embedding": str(embedding), "match_count": <int>})
-- The client sends query_embedding as a pgvector text literal ("[0.1, ...]"),
-- which PostgREST casts to vector(384). The Python side re-ranks the returned
-- candidates (small-business boosts); this function only returns the pool
-- ordered by similarity.

create or replace function public.match_creative_mechanisms(
  query_embedding vector(384),
  match_count int default 20
)
returns table (
  id text,
  name text,
  definition text,
  why_it_works text,
  best_for_business text[],
  best_for_goals text[],
  budget_level text[],
  format_note text,
  small_biz_example text,
  examples text[],
  risk_note text,
  similarity double precision
)
language sql
stable
as $$
  select
    m.id,
    m.name,
    m.definition,
    m.why_it_works,
    m.best_for_business,
    m.best_for_goals,
    m.budget_level,
    m.format_note,
    m.small_biz_example,
    m.examples,
    m.risk_note,
    1 - (m.embedding <=> query_embedding) as similarity  -- <=> is cosine distance
  from public.creative_mechanisms m
  where m.embedding is not null
  order by m.embedding <=> query_embedding   -- nearest (most similar) first
  limit greatest(match_count, 1);
$$;

-- Backend-only, like the tables it reads (see 003_creative_library_grants.sql).
revoke execute on function public.match_creative_mechanisms(vector, int) from public;
grant execute on function public.match_creative_mechanisms(vector, int) to service_role;
