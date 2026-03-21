-- CEO Support App Database Schema
-- SQLite / PostgreSQL compatible

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content_zh TEXT,
  content_en TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  voice_recording_id TEXT,
  mind_map_data TEXT,
  tags TEXT,
  status TEXT DEFAULT 'draft'
);

-- Voice Recordings table
CREATE TABLE IF NOT EXISTS voice_recordings (
  id TEXT PRIMARY KEY,
  audio_url TEXT,
  transcript TEXT NOT NULL,
  language TEXT DEFAULT 'zh',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  document_id TEXT REFERENCES documents(id)
);

-- Translations table
CREATE TABLE IF NOT EXISTS translations (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id),
  field TEXT NOT NULL,
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  confidence REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Edit Sessions table
CREATE TABLE IF NOT EXISTS ai_edit_sessions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id),
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed', 'archived')),
  priority TEXT DEFAULT 'P2' CHECK(priority IN ('P1', 'P2')),
  category TEXT DEFAULT 'documents' CHECK(category IN ('documents', 'meetings', 'talent', 'email')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Server connections table (for Claude Code instances)
CREATE TABLE IF NOT EXISTS server_connections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  auth_token TEXT,
  status TEXT DEFAULT 'disconnected' CHECK(status IN ('connected', 'disconnected', 'error')),
  last_ping TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_document_id ON voice_recordings(document_id);
CREATE INDEX IF NOT EXISTS idx_translations_document_id ON translations(document_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
