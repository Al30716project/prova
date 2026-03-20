import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'football.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance on modest hardware
db.pragma('journal_mode = WAL');

export function initDb() {
  // Competitions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS competitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_key TEXT UNIQUE,
      name TEXT NOT NULL,
      country TEXT,
      type TEXT, -- league, cup
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Teams table
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_key TEXT UNIQUE,
      name TEXT NOT NULL,
      short_name TEXT,
      tla TEXT,
      crest TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Matches table
  db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_key TEXT UNIQUE,
      competition_id INTEGER,
      utc_kickoff DATETIME NOT NULL,
      home_team_id INTEGER,
      away_team_id INTEGER,
      status TEXT,
      home_score INTEGER,
      away_score INTEGER,
      stage TEXT,
      group_name TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(competition_id) REFERENCES competitions(id),
      FOREIGN KEY(home_team_id) REFERENCES teams(id),
      FOREIGN KEY(away_team_id) REFERENCES teams(id)
    )
  `);

  // Predictions table (frozen snapshots)
  db.exec(`
    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      model_version TEXT,
      prob_home REAL,
      prob_draw REAL,
      prob_away REAL,
      fair_home REAL,
      fair_draw REAL,
      fair_away REAL,
      expected_goals_home REAL,
      expected_goals_away REAL,
      reliability_score INTEGER,
      data_coverage_score INTEGER,
      theoretical_signal TEXT,
      operational_signal TEXT,
      prob_over_25 REAL,
      prob_btts REAL,
      explanations_json TEXT,
      is_frozen INTEGER DEFAULT 0,
      UNIQUE(match_id),
      FOREIGN KEY(match_id) REFERENCES matches(id)
    )
  `);

  // Migration: Clean up duplicate predictions before adding unique index if needed
  // (Though we added UNIQUE in CREATE TABLE, for existing DBs we might need an index)
  try {
    db.exec(`
      DELETE FROM predictions 
      WHERE id NOT IN (
        SELECT MAX(id) 
        FROM predictions 
        GROUP BY match_id
      )
    `);
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id)`);
  } catch (e) {
    console.warn("Migration warning (predictions unique index):", e);
  }

  // Migration: Add missing columns if they don't exist
  const tableInfo = db.prepare("PRAGMA table_info(predictions)").all() as any[];
  const columnNames = tableInfo.map(c => c.name);

  if (!columnNames.includes('fair_home')) {
    db.exec("ALTER TABLE predictions ADD COLUMN fair_home REAL");
  }
  if (!columnNames.includes('fair_draw')) {
    db.exec("ALTER TABLE predictions ADD COLUMN fair_draw REAL");
  }
  if (!columnNames.includes('fair_away')) {
    db.exec("ALTER TABLE predictions ADD COLUMN fair_away REAL");
  }
  if (!columnNames.includes('theoretical_signal')) {
    db.exec("ALTER TABLE predictions ADD COLUMN theoretical_signal TEXT");
  }
  if (!columnNames.includes('operational_signal')) {
    db.exec("ALTER TABLE predictions ADD COLUMN operational_signal TEXT");
  }
  if (!columnNames.includes('prob_over_25')) {
    db.exec("ALTER TABLE predictions ADD COLUMN prob_over_25 REAL");
  }
  if (!columnNames.includes('prob_btts')) {
    db.exec("ALTER TABLE predictions ADD COLUMN prob_btts REAL");
  }

  // Manual Adjustments
  db.exec(`
    CREATE TABLE IF NOT EXISTS manual_adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER,
      type TEXT, -- injury, news, tactical
      magnitude REAL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(match_id) REFERENCES matches(id)
    )
  `);

  // Cache manifest
  db.exec(`
    CREATE TABLE IF NOT EXISTS cache_manifest (
      key TEXT PRIMARY KEY,
      last_fetched DATETIME,
      expires_at DATETIME
    )
  `);
}

export default db;
