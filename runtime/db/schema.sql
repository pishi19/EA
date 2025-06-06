CREATE TABLE IF NOT EXISTS workstreams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tags TEXT,
  goals TEXT,
  owners TEXT
);

CREATE TABLE IF NOT EXISTS loop_metadata (
    uuid TEXT PRIMARY KEY,
    title TEXT,
    score REAL,
    status TEXT,
    workstream TEXT
);

CREATE TABLE IF NOT EXISTS loop_feedback (
    uuid TEXT,
    tag TEXT,
    FOREIGN KEY (uuid) REFERENCES loop_metadata (uuid)
);

CREATE TABLE IF NOT EXISTS tasks (
  uuid TEXT PRIMARY KEY,
  workstream TEXT,
  verb TEXT,
  vector BLOB,
  source_loop_id TEXT
); 