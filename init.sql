-- SSE Chat App Database Initialization Script
-- This script sets up the initial database structure

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages (timestamp DESC);

-- Create index for username queries
CREATE INDEX IF NOT EXISTS idx_messages_username ON messages (username);

-- Insert sample data for testing (optional)
INSERT INTO messages (id, username, message, timestamp) VALUES 
    (gen_random_uuid(), 'システム', 'SSEチャットアプリへようこそ！', NOW()),
    (gen_random_uuid(), 'システム', 'リアルタイムでメッセージを送受信できます。', NOW())
ON CONFLICT (id) DO NOTHING;

-- Grant permissions to the chat_user
GRANT ALL PRIVILEGES ON TABLE messages TO chat_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO chat_user;