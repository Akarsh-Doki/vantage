create extension if not exists vector;
create table creative_mechanisms (
  id text primary key,
  name text, definition text, why_it_works text,
  best_for_business text[], best_for_goals text[], budget_level text[],
  format_note text,
  small_biz_example text, examples text[], risk_note text,
  embedding vector(384)
);
create table creative_campaigns (
  id text primary key,
  brand text, year text, one_line text,
  mechanism text references creative_mechanisms(id),
  why text, results text, results_confidence text, source text, agency text
);
