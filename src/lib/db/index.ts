import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "ceo-support.db");

// Ensure data directory exists
import fs from "fs";
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Initialize schema
const schemaPath = path.join(__dirname, "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf-8");
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

export default db;
