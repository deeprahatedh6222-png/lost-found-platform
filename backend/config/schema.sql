-- =============================================================
-- Lost & Found Platform — Supabase Schema
-- Run this in the Supabase SQL Editor (supabase.com → SQL Editor)
-- =============================================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 60),
  email      TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── ITEMS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type   TEXT NOT NULL CHECK (item_type IN ('lost', 'found')),
  title       TEXT NOT NULL CHECK (char_length(title) <= 100),
  description TEXT NOT NULL CHECK (char_length(description) <= 1000),
  category    TEXT NOT NULL DEFAULT 'Other'
              CHECK (category IN ('Electronics', 'Documents', 'Wallet / Bag', 'Keys', 'Clothing', 'Jewelry', 'Other')),
  location    TEXT NOT NULL CHECK (char_length(location) <= 120),
  event_date  DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open'
              CHECK (status IN ('open', 'claimed', 'resolved')),
  image_url   TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_items_filters ON items (item_type, category, status, created_at DESC);

-- ─── CLAIMS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS claims (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id     UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message     TEXT NOT NULL CHECK (char_length(message) <= 500),
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (item_id, claimant_id)
);

-- ─── AUTO-UPDATE updated_at TRIGGER ─────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_items_updated_at
  BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_claims_updated_at
  BEFORE UPDATE ON claims FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── STORAGE ─────────────────────────────────────────────────
-- Create a public bucket in Supabase Dashboard:
--   Storage → New Bucket → Name: "item-images" → Public: ON
