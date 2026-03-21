import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = path.join(process.cwd(), "data", "ceo-support.db");

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Initialize schema inline (can't read external files at runtime in some environments)
const schema = `
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
  status TEXT DEFAULT 'in_progress',
  priority TEXT DEFAULT 'P2',
  category TEXT DEFAULT 'documents',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Server connections table
CREATE TABLE IF NOT EXISTS server_connections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  auth_token TEXT,
  status TEXT DEFAULT 'disconnected',
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
`;
db.exec(schema);

export interface Document {
  id: string;
  title: string;
  content_zh: string | null;
  content_en: string | null;
  created_at: string;
  updated_at: string;
  voice_recording_id: string | null;
  mind_map_data: string | null;
  tags: string | null;
  status: "draft" | "review" | "final";
}

export interface VoiceRecording {
  id: string;
  audio_url: string | null;
  transcript: string;
  language: "zh" | "en" | "mixed";
  created_at: string;
  document_id: string | null;
}

// Document operations
export function createDocument(title: string, content_zh?: string): Document {
  const id = crypto.randomUUID();
  const stmt = db.prepare(`
    INSERT INTO documents (id, title, content_zh)
    VALUES (?, ?, ?)
  `);
  stmt.run(id, title, content_zh || null);
  return getDocument(id)!;
}

export function getDocument(id: string): Document | null {
  const stmt = db.prepare("SELECT * FROM documents WHERE id = ?");
  return stmt.get(id) as Document | null;
}

export function getAllDocuments(): Document[] {
  const stmt = db.prepare("SELECT * FROM documents ORDER BY updated_at DESC");
  return stmt.all() as Document[];
}

export function updateDocument(id: string, updates: Partial<Document>): Document | null {
  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title);
  }
  if (updates.content_zh !== undefined) {
    fields.push("content_zh = ?");
    values.push(updates.content_zh);
  }
  if (updates.content_en !== undefined) {
    fields.push("content_en = ?");
    values.push(updates.content_en);
  }
  if (updates.status !== undefined) {
    fields.push("status = ?");
    values.push(updates.status);
  }

  if (fields.length === 0) return getDocument(id);

  values.push(id);
  const stmt = db.prepare(`
    UPDATE documents SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(...values);
  return getDocument(id);
}

export function deleteDocument(id: string): boolean {
  const stmt = db.prepare("DELETE FROM documents WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

// Voice Recording operations
export function createVoiceRecording(transcript: string, language: "zh" | "en" | "mixed" = "zh"): VoiceRecording {
  const id = crypto.randomUUID();
  const stmt = db.prepare(`
    INSERT INTO voice_recordings (id, transcript, language)
    VALUES (?, ?, ?)
  `);
  stmt.run(id, transcript, language);
  return getVoiceRecording(id)!;
}

export function getVoiceRecording(id: string): VoiceRecording | null {
  const stmt = db.prepare("SELECT * FROM voice_recordings WHERE id = ?");
  return stmt.get(id) as VoiceRecording | null;
}

// Helper for generating UUIDs
const crypto = {
  randomUUID: () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },
};

// Server Connection operations
export interface ServerConnection {
  id: string;
  name: string;
  url: string;
  auth_token: string | null;
  status: "connected" | "disconnected" | "error";
  last_ping: string | null;
  created_at: string;
  updated_at: string;
}

export function getConnection(id: string): ServerConnection | null {
  const stmt = db.prepare("SELECT * FROM server_connections WHERE id = ?");
  return stmt.get(id) as ServerConnection | null;
}

export function getAllConnections(): ServerConnection[] {
  const stmt = db.prepare("SELECT * FROM server_connections ORDER BY created_at DESC");
  return stmt.all() as ServerConnection[];
}

export function createConnection(
  name: string,
  url: string,
  authToken?: string
): ServerConnection {
  const id = crypto.randomUUID();
  const stmt = db.prepare(`
    INSERT INTO server_connections (id, name, url, auth_token)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, name, url, authToken || null);
  return getConnection(id)!;
}

export function updateConnection(
  id: string,
  updates: Partial<Pick<ServerConnection, "name" | "url" | "auth_token" | "status">>
): ServerConnection | null {
  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (updates.name !== undefined) {
    fields.push("name = ?");
    values.push(updates.name);
  }
  if (updates.url !== undefined) {
    fields.push("url = ?");
    values.push(updates.url);
  }
  if (updates.auth_token !== undefined) {
    fields.push("auth_token = ?");
    values.push(updates.auth_token);
  }
  if (updates.status !== undefined) {
    fields.push("status = ?");
    values.push(updates.status);
  }

  if (fields.length === 0) return getConnection(id);

  values.push(id);
  const stmt = db.prepare(`
    UPDATE server_connections SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(...values);
  return getConnection(id);
}

export function deleteConnection(id: string): boolean {
  const stmt = db.prepare("DELETE FROM server_connections WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

export default db;
