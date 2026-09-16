-- REGION: LEEWAY / LEOLA'S LIBRARY / PERSISTENCE
-- TAG: LW-LEOLA-DATA-V1
-- WHAT: Canonical PostgreSQL schema for members, library cards, reading, games, videos, and Stripe donation receipts.
-- WHY: Turn the library experience into a durable product rather than browser-only state.
-- WHO: Leola's Library backend runtime; administrative access remains separate.
-- WHERE: PostgreSQL-compatible persistent store.
-- HOW: Minimal personal data, pseudonymous activity IDs, foreign-key integrity, auditable timestamps.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 120),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','deleted')),
  analytics_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS library_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  card_number text NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','replaced','revoked'))
);

CREATE TABLE IF NOT EXISTS books (
  id text PRIMARY KEY,
  title text NOT NULL,
  edition text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO books (id,title,edition) VALUES
  ('needle-and-yarn','Needle & Yarn: A Love Story','legacy-active'),
  ('crochet-mastery','Crochet Mastery: A Complete Guide','legacy-active')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS book_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  book_id text NOT NULL REFERENCES books(id),
  checked_out_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  returned_at timestamptz,
  status text NOT NULL DEFAULT 'checked_out' CHECK (status IN ('checked_out','returned','expired'))
);

CREATE UNIQUE INDEX IF NOT EXISTS one_open_loan_per_member_book
ON book_loans(member_id, book_id)
WHERE returned_at IS NULL AND status = 'checked_out';

CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  session_key uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  entry_route text,
  referrer_host text
);

CREATE INDEX IF NOT EXISTS visits_member_started_idx ON visits(member_id, started_at DESC);
CREATE INDEX IF NOT EXISTS visits_session_idx ON visits(session_key);

CREATE TABLE IF NOT EXISTS reading_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  session_key uuid NOT NULL,
  book_id text NOT NULL REFERENCES books(id),
  chapter_id text,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  active_seconds integer NOT NULL DEFAULT 0 CHECK (active_seconds >= 0),
  progress_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS reading_member_book_idx ON reading_sessions(member_id, book_id, started_at DESC);

CREATE TABLE IF NOT EXISTS game_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  game_id text NOT NULL,
  level text,
  best_score integer,
  progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_played_at timestamptz NOT NULL DEFAULT now(),
  last_played_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id, game_id)
);

CREATE TABLE IF NOT EXISTS video_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  video_id text NOT NULL,
  lesson_id text,
  watched_seconds integer NOT NULL DEFAULT 0 CHECK (watched_seconds >= 0),
  completed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id, video_id)
);

CREATE TABLE IF NOT EXISTS learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  lesson_id text NOT NULL,
  status text NOT NULL DEFAULT 'started' CHECK (status IN ('started','practicing','completed')),
  mastery_score numeric(5,2) CHECK (mastery_score BETWEEN 0 AND 100),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL CHECK (status IN ('pending','paid','failed','refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  session_key uuid,
  event_type text NOT NULL,
  object_type text,
  object_id text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  properties jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS activity_member_time_idx ON activity_events(member_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS activity_type_time_idx ON activity_events(event_type, occurred_at DESC);
