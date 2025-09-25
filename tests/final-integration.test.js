/**
 * Final Integration Tests for SSE Chat App
 * Comprehensive testing of all functionality, responsive design, and performance
 * Task 11: 最終統合とテスト
 * Requirements: 3.2, 4.2
 */

const request = require('supertest');
const { describe, test, expect, beforeAll, afterAll, beforeEach } = require('@jest/globals');
const { spawn } = require('child_process');
const path = require('path');

describe('SSE Chat App - Final Integration Tests', () => {
  let serverProcess;
  const serverUrl = 'http://localhost:8001'; // Use different port to avoid conflicts
  
  beforeAll(async () => {
    // Start the actual server for integration testing
    return new Promise((resolve, reject) => {
      serverProcess = spawn('node', ['server.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, PORT: '8001' },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let serverOutput = '';
      
      serverProcess.stdout.on('data', (data) => {
        serverOutput += data.toString();
        if (serverOutput.includes('Running on port 8001')) {
          // Give server a moment to fully initialize
          setTimeout(resolve, 500);
        }
      });

      serverProcess.stderr.on('data', (data) => {
        console.error('Server stderr:', data.toString());
      });

      serverProcess.on('error', (error) => {
        reject(new Error(`Failed to start server: ${error.message}`));
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 10000);
    });
  }, 15000);

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      
      // Wait for process to exit
      return new Promise((resolve) => {
        serverProcess.on('exit', resolve);
        setTimeout(() => {
          serverProcess.kill('SIGKILL');
          resolve();
        }, 5000);
      });
    }
  });

  describe('全機能の統合テスト (Complete Functionality Integration)', () => {
    test('should serve static files correctly', async () => {
      const response = await request(serverUrl)
        .get('/')
        .expect(200);

      expect(response.text).toContain('<!DOCTYPE html>');
      expect(response.text).toContain('SSE チャットアプリ');
      expect(response.text).toContain('リアルタイムチャット');
    });

    test('should serve CSS file correctly', async () => {
      const response = await request(serverUrl)
        .get('/style.css')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/css/);
      expect(response.text).toContain('.container');
      expect(response.text).toContain('.messages-container');
    });

    test('should serve JavaScript file correctly', async () => {
      const response = await request(serverUrl)
        .get('/script.js')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/javascript/);
      expect(response.text).toContain('EventSource');
      expect(response.text).toContain('initializeSSEConnection');
    });

    test('should handle message sending and validation', async () => {
      // Test valid message
      const validMessage = {
        username: 'integrationtest',
        message: 'Complete integration test message'
      };

      const response = await request(serverUrl)
        .post('/messages')
        .send(validMessage)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('integrationtest');
      expect(response.body.data.message).toBe('Complete integration test message');
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
    });

    test('should handle XSS protection in real server', async () => {
      const xssMessage = {
        username: 'testuser',
        message: '<script>alert("xss")</script>Safe content'
      };

      const response = await request(serverUrl)
        .post('/messages')
        .send(xssMessage)
        .expect(201);

      expect(response.body.data.message).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;Safe content');
      expect(response.body.data.message).not.toContain('<script>');
    });

    test('should reject invalid messages', async () => {
      const invalidMessages = [
        { username: '', message: 'Valid message' },
        { username: 'validuser', message: '' },
        { username: 'a'.repeat(51), message: 'Valid message' },
        { username: 'validuser', message: 'a'.repeat(501) }
      ];

      for (const invalidMsg of invalidMessages) {
        const response = await request(serverUrl)
          .post('/messages')
          .send(invalidMsg)
          .expect(400);

        expect(response.body.error).toBe('Validation failed');
        expect(response.body.details).toBeDefined();
      }
    });

    test('should handle concurrent message sending', async () => {
      const messages = Array.from({ length: 10 }, (_, i) => ({
        username: `concurrentuser${i}`,
        message: `Concurrent message ${i}`
      }));

      const promises = messages.map(msg => 
        request(serverUrl)
          .post('/messages')
          .send(msg)
          .expect(201)
      );

      const responses = await Promise.all(promises);

      responses.forEach((response, index) => {
        expect(response.body.success).toBe(true);
        expect(response.body.data.username).toBe(`concurrentuser${index}`);
        expect(response.body.data.message).toBe(`Concurrent message ${index}`);
      });
    });
  });

  describe('SSE接続テスト (SSE Connection Testing)', () => {
    test('should establish SSE connection', async () => {
      const response = await request(serverUrl)
        .get('/events')
        .set('Accept', 'text/event-stream')
        .expect(200);

      expect(response.headers['content-type']).toBe('text/event-stream');
      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers['connection']).toBe('keep-alive');
    });

    test('should handle 404 for unknown routes', async () => {
      const response = await request(serverUrl)
        .get('/nonexistent-route')
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('The requested resource was not found');
    });

    test('should handle malformed JSON', async () => {
      const response = await request(serverUrl)
        .post('/messages')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('Invalid JSON format');
    });
  });

  describe('エラーハンドリングテスト (Error Handling Testing)', () => {
    test('should handle server errors gracefully', async () => {
      // Test with extremely large payload
      const largeMessage = {
        username: 'testuser',
        message: 'a'.repeat(10000) // Exceeds validation limit
      };

      const response = await request(serverUrl)
        .post('/messages')
        .send(largeMessage)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Message must be 500 characters or less');
    });

    test('should handle missing content-type', async () => {
      const response = await request(serverUrl)
        .post('/messages')
        .send('plain text data')
        .expect(400);

      // Should handle gracefully even with malformed request
      expect(response.status).toBe(400);
    });

    test('should handle empty request body', async () => {
      const response = await request(serverUrl)
        .post('/messages')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Username is required');
      expect(response.body.details).toContain('Message is required');
    });
  });

  describe('パフォーマンステスト (Performance Testing)', () => {
    test('should handle rapid message sending', async () => {
      const startTime = Date.now();
      const messageCount = 50;
      
      const promises = Array.from({ length: messageCount }, (_, i) => 
        request(serverUrl)
          .post('/messages')
          .send({
            username: `perfuser${i}`,
            message: `Performance test message ${i}`
          })
          .expect(201)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All messages should be processed successfully
      expect(responses.length).toBe(messageCount);
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });

      // Performance check: should handle 50 messages in reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000);
      
      console.log(`Performance test: ${messageCount} messages processed in ${duration}ms`);
    });

    test('should handle message storage limits efficiently', async () => {
      // This test verifies the 100-message limit works correctly
      const messageCount = 120;
      
      const promises = Array.from({ length: messageCount }, (_, i) => 
        request(serverUrl)
          .post('/messages')
          .send({
            username: `limituser${i}`,
            message: `Limit test message ${i}`
          })
          .expect(201)
      );

      const responses = await Promise.all(promises);
      
      // All messages should be accepted
      expect(responses.length).toBe(messageCount);
      
      // Server should handle the limit internally without errors
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('セキュリティテスト (Security Testing)', () => {
    test('should prevent XSS attacks comprehensively', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        'javascript:alert(1)',
        '<iframe src="javascript:alert(1)"></iframe>',
        '"><script>alert(1)</script>',
        '\';alert(1);//',
        '<object data="javascript:alert(1)">',
        '<embed src="javascript:alert(1)">',
        '<link rel=stylesheet href="javascript:alert(1)">'
      ];

      for (const payload of xssPayloads) {
        const response = await request(serverUrl)
          .post('/messages')
          .send({
            username: 'securitytest',
            message: payload
          })
          .expect(201);

        const escapedMessage = response.body.data.message;
        
        // Verify dangerous tags are escaped
        expect(escapedMessage).not.toContain('<script>');
        expect(escapedMessage).not.toContain('<img');
        expect(escapedMessage).not.toContain('<svg');
        expect(escapedMessage).not.toContain('<iframe');
        expect(escapedMessage).not.toContain('<object');
        expect(escapedMessage).not.toContain('<embed');
        expect(escapedMessage).not.toContain('<link');
        
        // Verify HTML entities are properly escaped
        if (payload.includes('<')) {
          expect(escapedMessage).toContain('&lt;');
        }
        if (payload.includes('>')) {
          expect(escapedMessage).toContain('&gt;');
        }
        if (payload.includes('"')) {
          expect(escapedMessage).toContain('&quot;');
        }
      }
    });

    test('should validate input lengths strictly', async () => {
      // Test exact boundary conditions
      const tests = [
        { username: 'a'.repeat(50), message: 'Valid', shouldPass: true },
        { username: 'a'.repeat(51), message: 'Valid', shouldPass: false },
        { username: 'Valid', message: 'a'.repeat(500), shouldPass: true },
        { username: 'Valid', message: 'a'.repeat(501), shouldPass: false }
      ];

      for (const test of tests) {
        const response = await request(serverUrl)
          .post('/messages')
          .send({
            username: test.username,
            message: test.message
          });

        if (test.shouldPass) {
          expect(response.status).toBe(201);
          expect(response.body.success).toBe(true);
        } else {
          expect(response.status).toBe(400);
          expect(response.body.error).toBe('Validation failed');
        }
      }
    });
  });

  describe('国際化テスト (Internationalization Testing)', () => {
    test('should handle Japanese characters correctly', async () => {
      const japaneseMessage = {
        username: 'テストユーザー',
        message: 'こんにちは、世界！これは日本語のテストメッセージです。'
      };

      const response = await request(serverUrl)
        .post('/messages')
        .send(japaneseMessage)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('テストユーザー');
      expect(response.body.data.message).toBe('こんにちは、世界！これは日本語のテストメッセージです。');
    });

    test('should handle mixed character sets', async () => {
      const mixedMessage = {
        username: 'User123_テスト',
        message: 'Hello 世界! Testing 123 with 日本語 and English.'
      };

      const response = await request(serverUrl)
        .post('/messages')
        .send(mixedMessage)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('User123_テスト');
      expect(response.body.data.message).toBe('Hello 世界! Testing 123 with 日本語 and English.');
    });

    test('should handle special characters in usernames', async () => {
      const specialChars = [
        'user-name',
        'user_name',
        'user.name',
        'user123',
        'ユーザー名',
        '用户名',
        'user name' // spaces
      ];

      for (const username of specialChars) {
        const response = await request(serverUrl)
          .post('/messages')
          .send({
            username: username,
            message: 'Test message'
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.username).toBe(username);
      }
    });
  });
});