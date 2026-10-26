CREATE TABLE visitor_totals (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  since TEXT NOT NULL DEFAULT (date('now'))
);

INSERT INTO visitor_totals (id, count) VALUES (1, 0);

CREATE TABLE visitor_sessions (
  session_id TEXT PRIMARY KEY NOT NULL CHECK (length(session_id) = 36)
) WITHOUT ROWID;

CREATE TRIGGER count_new_visit AFTER INSERT ON visitor_sessions
BEGIN
  UPDATE visitor_totals SET count = count + 1 WHERE id = 1;
END;
