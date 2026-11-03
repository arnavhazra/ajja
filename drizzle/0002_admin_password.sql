ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS failed_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS locked_until timestamptz;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_changed_at timestamptz;
