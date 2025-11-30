import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "chat-history.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  const database = db!;
  
  database.exec(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_path TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      results TEXT,
      timestamp DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS opened_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      content TEXT NOT NULL,
      score REAL,
      line_start INTEGER,
      line_end INTEGER,
      language TEXT,
      tab_order INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_files_session ON opened_files(session_id);
  `);
}

export interface ChatMessage {
  id: string;
  type: "question" | "answer";
  content: string;
  results?: SearchResultData[];
  timestamp: string;
}

export interface SearchResultData {
  file_path: string;
  content: string;
  score?: number;
  line_start?: number;
  line_end?: number;
  language?: string;
}

export interface ChatHistory {
  messages: ChatMessage[];
  openedFiles: SearchResultData[];
}

export function getOrCreateSession(repoPath: string): number {
  const database = getDb();
  
  const existing = database
    .prepare("SELECT id FROM chat_sessions WHERE repo_path = ?")
    .get(repoPath) as { id: number } | undefined;
  
  if (existing) {
    database
      .prepare("UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(existing.id);
    return existing.id;
  }
  
  const result = database
    .prepare("INSERT INTO chat_sessions (repo_path) VALUES (?)")
    .run(repoPath);
  
  return result.lastInsertRowid as number;
}

export function getChatHistory(repoPath: string): ChatHistory {
  const database = getDb();
  
  const session = database
    .prepare("SELECT id FROM chat_sessions WHERE repo_path = ?")
    .get(repoPath) as { id: number } | undefined;
  
  if (!session) {
    return { messages: [], openedFiles: [] };
  }
  
  const messages = database
    .prepare(`
      SELECT id, type, content, results, timestamp 
      FROM chat_messages 
      WHERE session_id = ? 
      ORDER BY timestamp ASC
    `)
    .all(session.id) as Array<{
      id: string;
      type: string;
      content: string;
      results: string | null;
      timestamp: string;
    }>;
  
  const openedFiles = database
    .prepare(`
      SELECT file_path, content, score, line_start, line_end, language 
      FROM opened_files 
      WHERE session_id = ? 
      ORDER BY tab_order ASC
    `)
    .all(session.id) as Array<{
      file_path: string;
      content: string;
      score: number | null;
      line_start: number | null;
      line_end: number | null;
      language: string | null;
    }>;
  
  return {
    messages: messages.map((m) => ({
      id: m.id,
      type: m.type as "question" | "answer",
      content: m.content,
      results: m.results ? JSON.parse(m.results) : undefined,
      timestamp: m.timestamp,
    })),
    openedFiles: openedFiles.map((f) => ({
      file_path: f.file_path,
      content: f.content,
      score: f.score ?? undefined,
      line_start: f.line_start ?? undefined,
      line_end: f.line_end ?? undefined,
      language: f.language ?? undefined,
    })),
  };
}

export function saveChatHistory(
  repoPath: string,
  messages: ChatMessage[],
  openedFiles: SearchResultData[]
): void {
  const database = getDb();
  const sessionId = getOrCreateSession(repoPath);
  
  const transaction = database.transaction(() => {
    database.prepare("DELETE FROM chat_messages WHERE session_id = ?").run(sessionId);
    database.prepare("DELETE FROM opened_files WHERE session_id = ?").run(sessionId);
    
    const insertMessage = database.prepare(`
      INSERT INTO chat_messages (id, session_id, type, content, results, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const msg of messages) {
      insertMessage.run(
        msg.id,
        sessionId,
        msg.type,
        msg.content,
        msg.results ? JSON.stringify(msg.results) : null,
        msg.timestamp
      );
    }
    
    const insertFile = database.prepare(`
      INSERT INTO opened_files (session_id, file_path, content, score, line_start, line_end, language, tab_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    openedFiles.forEach((file, index) => {
      insertFile.run(
        sessionId,
        file.file_path,
        file.content,
        file.score ?? null,
        file.line_start ?? null,
        file.line_end ?? null,
        file.language ?? null,
        index
      );
    });
    
    database
      .prepare("UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(sessionId);
  });
  
  transaction();
}

export function clearChatHistory(repoPath: string): void {
  const database = getDb();
  
  const session = database
    .prepare("SELECT id FROM chat_sessions WHERE repo_path = ?")
    .get(repoPath) as { id: number } | undefined;
  
  if (session) {
    database.prepare("DELETE FROM chat_messages WHERE session_id = ?").run(session.id);
    database.prepare("DELETE FROM opened_files WHERE session_id = ?").run(session.id);
  }
}

export interface RepoSession {
  repo_path: string;
  message_count: number;
  updated_at: string;
}

export function getAllSessions(): RepoSession[] {
  const database = getDb();
  
  const sessions = database
    .prepare(`
      SELECT 
        cs.repo_path,
        cs.updated_at,
        COUNT(cm.id) as message_count
      FROM chat_sessions cs
      LEFT JOIN chat_messages cm ON cs.id = cm.session_id
      GROUP BY cs.id
      ORDER BY cs.updated_at DESC
    `)
    .all() as Array<{
      repo_path: string;
      updated_at: string;
      message_count: number;
    }>;
  
  return sessions;
}

export function deleteSession(repoPath: string): void {
  const database = getDb();
  
  const session = database
    .prepare("SELECT id FROM chat_sessions WHERE repo_path = ?")
    .get(repoPath) as { id: number } | undefined;
  
  if (session) {
    database.prepare("DELETE FROM chat_messages WHERE session_id = ?").run(session.id);
    database.prepare("DELETE FROM opened_files WHERE session_id = ?").run(session.id);
    database.prepare("DELETE FROM chat_sessions WHERE id = ?").run(session.id);
  }
}
