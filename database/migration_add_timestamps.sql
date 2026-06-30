-- Add time component to scheduled_date column
-- Convert DATE to TIMESTAMP, setting time to 00:00:00 for existing records
ALTER TABLE posts ALTER COLUMN scheduled_date TYPE TIMESTAMP USING scheduled_date::timestamp;
