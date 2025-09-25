/**
 * PostgreSQL Database Manager for SSE Chat App
 * Handles message storage and retrieval with connection pooling
 */

const { Pool } = require('pg');

class ChatDatabase {
  constructor() {
    // PostgreSQL connection configuration
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of connections in the pool
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
    });

    // Initialize database tables
    this.initializeDatabase();
  }

  /**
   * Initialize database tables if they don't exist
   */
  async initializeDatabase() {
    try {
      const client = await this.pool.connect();
      
      // Create messages table
      await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY,
          username VARCHAR(50) NOT NULL,
          message TEXT NOT NULL,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create index for better query performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_messages_timestamp 
        ON messages (timestamp DESC)
      `);

      client.release();
      console.log('[Database] PostgreSQL tables initialized successfully');
    } catch (error) {
      console.error('[Database] Error initializing database:', error);
      throw error;
    }
  }

  /**
   * Add a new message to the database
   * @param {Object} message - Message object with id, username, message, timestamp
   * @returns {Promise<Object>} - The inserted message
   */
  async addMessage(message) {
    try {
      const client = await this.pool.connect();
      
      const query = `
        INSERT INTO messages (id, username, message, timestamp)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const values = [
        message.id,
        message.username,
        message.message,
        message.timestamp
      ];

      const result = await client.query(query, values);
      client.release();

      console.log(`[Database] Message added: ${message.id}`);
      return result.rows[0];
    } catch (error) {
      console.error('[Database] Error adding message:', error);
      throw error;
    }
  }

  /**
   * Get recent messages (limited to prevent memory issues)
   * @param {number} limit - Maximum number of messages to retrieve (default: 100)
   * @returns {Promise<Array>} - Array of recent messages
   */
  async getRecentMessages(limit = 100) {
    try {
      const client = await this.pool.connect();
      
      const query = `
        SELECT id, username, message, timestamp
        FROM messages
        ORDER BY timestamp DESC
        LIMIT $1
      `;

      const result = await client.query(query, [limit]);
      client.release();

      // Return messages in chronological order (oldest first)
      return result.rows.reverse();
    } catch (error) {
      console.error('[Database] Error getting recent messages:', error);
      throw error;
    }
  }

  /**
   * Get total message count
   * @returns {Promise<number>} - Total number of messages
   */
  async getMessageCount() {
    try {
      const client = await this.pool.connect();
      
      const query = 'SELECT COUNT(*) as count FROM messages';
      const result = await client.query(query);
      client.release();

      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('[Database] Error getting message count:', error);
      throw error;
    }
  }

  /**
   * Clean up old messages to prevent database bloat
   * Keeps only the most recent messages based on the limit
   * @param {number} keepCount - Number of recent messages to keep (default: 1000)
   */
  async cleanupOldMessages(keepCount = 1000) {
    try {
      const client = await this.pool.connect();
      
      // Delete messages older than the keepCount most recent ones
      const query = `
        DELETE FROM messages
        WHERE id NOT IN (
          SELECT id FROM messages
          ORDER BY timestamp DESC
          LIMIT $1
        )
      `;

      const result = await client.query(query, [keepCount]);
      client.release();

      if (result.rowCount > 0) {
        console.log(`[Database] Cleaned up ${result.rowCount} old messages`);
      }

      return result.rowCount;
    } catch (error) {
      console.error('[Database] Error cleaning up old messages:', error);
      throw error;
    }
  }

  /**
   * Get database connection status
   * @returns {Promise<boolean>} - True if database is connected
   */
  async isConnected() {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error('[Database] Connection check failed:', error);
      return false;
    }
  }

  /**
   * Close all database connections
   */
  async close() {
    try {
      await this.pool.end();
      console.log('[Database] All connections closed');
    } catch (error) {
      console.error('[Database] Error closing connections:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} - Database statistics
   */
  async getStats() {
    try {
      const client = await this.pool.connect();
      
      const queries = await Promise.all([
        client.query('SELECT COUNT(*) as total_messages FROM messages'),
        client.query('SELECT COUNT(DISTINCT username) as unique_users FROM messages'),
        client.query(`
          SELECT DATE_TRUNC('day', timestamp) as date, COUNT(*) as count
          FROM messages
          WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
          GROUP BY DATE_TRUNC('day', timestamp)
          ORDER BY date DESC
        `)
      ]);

      client.release();

      return {
        totalMessages: parseInt(queries[0].rows[0].total_messages),
        uniqueUsers: parseInt(queries[1].rows[0].unique_users),
        dailyActivity: queries[2].rows
      };
    } catch (error) {
      console.error('[Database] Error getting stats:', error);
      throw error;
    }
  }
}

module.exports = ChatDatabase;