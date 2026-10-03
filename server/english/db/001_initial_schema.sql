-- ══════════════════════════════════════════════════════════════════
-- ENGLISH PRACTICE MODULE — BASE SQL MIGRATION (ADDITIVE ONLY)
-- All tables prefixed with english_ (ZERO impact on existing tables)
-- ══════════════════════════════════════════════════════════════════

-- 1. Foydalanuvchi profili
CREATE TABLE IF NOT EXISTS english_profiles (
  telegram_id BIGINT PRIMARY KEY,
  display_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female')),
  rules_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Kunlik limitlar
CREATE TABLE IF NOT EXISTS english_usage (
  telegram_id BIGINT NOT NULL,
  date DATE NOT NULL,
  kind TEXT NOT NULL, -- 'writing', 'speaking'
  count INT DEFAULT 1,
  PRIMARY KEY (telegram_id, date, kind)
);

-- 3. Writing savollar banki
CREATE TABLE IF NOT EXISTS english_writing_prompts (
  id TEXT PRIMARY KEY,
  exam_type TEXT NOT NULL, -- 'ielts', 'multilevel'
  task_type TEXT NOT NULL, -- 'task_2'
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL, -- 'easy', 'medium', 'hard'
  availability TEXT DEFAULT 'all',
  text TEXT NOT NULL,
  is_original BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Writing topshirilgan insholar
CREATE TABLE IF NOT EXISTS english_writing_submissions (
  id TEXT PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  exam_type TEXT NOT NULL,
  prompt_id TEXT NOT NULL,
  text TEXT NOT NULL,
  word_count INT NOT NULL,
  seconds_used INT NOT NULL,
  timer_mode TEXT NOT NULL, -- 'none', '20', '40', '60'
  overtime BOOLEAN DEFAULT false,
  result_json JSONB,
  score_overall NUMERIC(3,1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Speaking savollar banki
CREATE TABLE IF NOT EXISTS english_speaking_questions (
  id TEXT PRIMARY KEY,
  exam_type TEXT NOT NULL,
  section TEXT NOT NULL, -- 'part_1', 'part_2', 'part_3'
  topic TEXT NOT NULL,
  text TEXT NOT NULL,
  cue_card_json JSONB,
  linked_id TEXT
);

-- 6. Speaking AI sessiyalari
CREATE TABLE IF NOT EXISTS english_speaking_sessions (
  id TEXT PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  exam_type TEXT NOT NULL,
  section TEXT NOT NULL,
  status TEXT NOT NULL, -- 'active', 'completed', 'abandoned'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  result_json JSONB,
  score_overall NUMERIC(3,1)
);

-- 7. Speaking nutq navbatlari (turns)
CREATE TABLE IF NOT EXISTS english_speaking_turns (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT CHECK (role IN ('examiner', 'candidate')),
  text TEXT NOT NULL,
  audio_seconds NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Partner Speaking kutish navbati
CREATE TABLE IF NOT EXISTS english_queue (
  telegram_id BIGINT PRIMARY KEY,
  exam_type TEXT NOT NULL,
  gender TEXT NOT NULL,
  wants TEXT CHECK (wants IN ('any', 'male', 'female')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Partner Speaking xonalari
CREATE TABLE IF NOT EXISTS english_rooms (
  id TEXT PRIMARY KEY,
  exam_type TEXT NOT NULL,
  user_a BIGINT NOT NULL,
  user_b BIGINT NOT NULL,
  status TEXT NOT NULL, -- 'active', 'finished'
  current_section TEXT,
  current_question_id TEXT,
  turn_user BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- 10. Partner bloklash va hisobotlar
CREATE TABLE IF NOT EXISTS english_blocks (
  user_id BIGINT NOT NULL,
  blocked_user_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, blocked_user_id)
);

CREATE TABLE IF NOT EXISTS english_reports (
  id TEXT PRIMARY KEY,
  reporter_id BIGINT NOT NULL,
  reported_id BIGINT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS english_partner_ratings (
  id TEXT PRIMARY KEY,
  rater_id BIGINT NOT NULL,
  partner_id BIGINT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
