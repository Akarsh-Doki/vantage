-- Cosine-similarity candidate search over the creative-mechanism library.
-- Called by app/tools/mechanisms.py via PostgREST RPC; the small-business
-- boost/re-ranking happens in Python, this only returns the candidate pool.
create or replace function match_creative_mechanisms(
  query_embedding vector(384),
  match_count int default 20
)
returns table (
  id text, name text, definition text, why_it_works text,
  best_for_business text[], best_for_goals text[], budget_level text[],
  format_note text, small_biz_example text, examples text[], risk_note text,
  similarity double precision
)
language sql stable
as $$
  select
    m.id, m.name, m.definition, m.why_it_works,
    m.best_for_business, m.best_for_goals, m.budget_level,
    m.format_note, m.small_biz_example, m.examples, m.risk_note,
    1 - (m.embedding <=> query_embedding) as similarity
  from creative_mechanisms m
  order by m.embedding <=> query_embedding
  limit greatest(match_count, 1)
$$;

-- Backend-only, like the tables it reads (see 003).
revoke execute on function match_creative_mechanisms(vector, int) from public;
grant execute on function match_creative_mechanisms(vector, int) to service_role;
