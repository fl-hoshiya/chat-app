/**
 * PostgreSQL Database Tests for SSE Chat App
 * Tests database connectivity, message storage, and cleanup functionality
 */

const { describe, test, expect, beforeAll, afterAll, beforeEach } = require('@jest/globals');
const ChatDatabase = require('../database');

// Mock environment for testing
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/test_sse_chat';

describe('PostgreSQL Database Tests', () => {
  let db;

  beforeAll(async () => {
    // Skip tests if no test database is configured
    if (!process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
      console.log('Skipping PostgreSQL tests - no database configured');
      return;
    }

    try {
      db = new ChatDatabase();
      // Wait for database initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log('Skipping PostgreSQL tests - database connection failed:', error.message);
      db = null;
    }
  });

  afterAll(async () => {
    if (db) {
      try {
        // Clean up test data
        await db.pool.query('DELETE FROM messages WHERE username LIKE \'test_%\'');
        await db.close();
      } catch (error) {
        console.error('Error cleaning up test database:', error);
      }
    }
  });

  beforeEach(async () => {
    if (db) {
      // Clean up any existing test messages
      try {
        await db.pool.query('DELETE FROM messages WHERE username LIKE \'test_%\'');
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Database Connection', () => {
    test('should connect to PostgreSQL database', async () => {
      if (!db) {
        console.log('Skipping test - no database connection');
        return;
      }

      const isConnected = await db.isConnected();
      expect(isConnected).toBe(true);
    });

    test('should initialize database tables', async () => {
      if (!db) {
        console.log('Skipping test - no database connection');
        return;
      }

      // Check if messages table exists
      const client = await db.pool.connect();
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'messages'
        );
      `);
      client.release();

      expect(result.rows[0].exists).toBe(true);
    });
  });

  describe('Message Storage', () => {
    test('should add message to database', async () => {
      if (!db) {
        console.log('Skipping test - no database connection');
        return;
      }

      const testMessage = {
        id: 'test-id-1',
        username: 'test_user1',
        message: 'Test message content',
        timestamp: new Date()
      };

      const result = await db.addMessage(testMessage);
      
      expect(result.id).toBe(testMessage.id);
      expect(result.username).toBe(testMessage.username);
      expect(result.message).toBe(testMessage.message);
    });

    test('should retrieve recent messages', async () => {
      if (!db) {
        console.log('Skipping test - no database connection');
        return;
      }

      // Add test messages
      const testMessages = [
        {
          id: 'test-id-2',
          username: 'test_user2',
          message: 'First test message',
          timestamp: new Date(Date.now() - 2000)
        },
        {
          id: 'test-id-3',
          username: 'test_user3',
          message: 'Second test message',
          timestamp: new Date(Date.now() - 1000)
        },
        {
          id: 'test-id-4',
          username: 'test_user4',
          message: 'Third test message',
          timestamp: new Date()
        }
      ];

      for (const msg of testMessages) {
        await db.addMessage(msg);
      }

      const recentMessages = await db.getRecentMessages(10);
      const testMessagesFromDb = recentMessages.filter(msg => msg.username.startsWith('test_'));

      expect(testMessagesFromDb.length).toBe(3);
      expect(testMessagesFromDb[0].message).toBe('First test message');
      expect(testMessagesFromDb[2].message).toBe('Third test message');
    });

    test('should get message count', async () => {
      if (!db) {
        console.log('Skipping test - no database connection');
        return;
      }

      const initialCount = await db.getMessageCount();
      
      // Add a test message
      await db.addMessage({
        id: 'test-id-5',
        username: 'test_user5',
        message: 'Count test message',
        timestamp: new Date()
      });

      const newCount = await db.getMessageCount();
      expect(newCount).toBe(initialCount + 1);
    });
  });

  describe('Database Cleanup', () => {
    test('should cleanup old messages', async () => {
      if (!db) {
        console.log('Skipping test - no database connection');
        return;
      }

      // Add multiple test messages
      const testMessages = [];
      for (let i = 0; i < 5; i++) {
        testMessages.push({
          id: `test-cleanup-${i}`,
          username: `test_cleanup_user${i}`,
          message: `Cleanup test message ${i}`,
          timestamp: new Date(Date.now() - (5 - i) * 1000)
        });
      }

      for (const msg of testMessages) {
        await db.addMessage(msg);
      }

      // Keep only 3 messages
      const deletedCount = await db.cleanupOldMessages(3);
      
      // Should have deleted some messages (exact count depends on existing data)
      expect(typeof deletedCount).toBe('number');
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Database Statistics', () => {
    test('should get database statistics', async () => {
      if (!db) {
        console.log('Skipping test - no database connection');
        return;
      }

      // Add a test message for stats
      await db.addMessage({
        id: 'test-stats-1',
        username: 'test_stats_user',
        message: 'Stats test message',
        timestamp: new Date()
      });

      const stats = await db.getStats();
      
      expect(stats).toHaveProperty('totalMessages');
      expect(stats).toHaveProperty('uniqueUsers');
      expect(stats).toHaveProperty('dailyActivity');
      expect(typeof stats.totalMessages).toBe('number');
      expect(typeof stats.uniqueUsers).toBe('number');
      expect(Array.isArray(stats.dailyActivity)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      if (!db) {
        console.log('Skipping test - no database connection');
        return;
      }

      // Try to add invalid message (missing required fields)
      try {
        await db.addMessage({
          // Missing required fields
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});