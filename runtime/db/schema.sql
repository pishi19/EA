CREATE TABLE IF NOT EXISTS workstreams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tags TEXT,
  goals TEXT,
  owners TEXT
); 