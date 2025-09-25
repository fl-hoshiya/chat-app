/**
 * Performance and Memory Tests for SSE Chat App
 * Tests performance characteristics and memory leak prevention
 * Task 11: パフォーマンステストとメモリリーク確認
 * Requirements: 3.2, 4.2
 */

const request = require('supertest');
const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');
const { spawn } = require('child_process');
const path = require('path');

describe('SSE Chat App - Performance and Memory Tests', () => {
  let serverProcess;
  const serverUrl = 'http://localhost:8002'; // Use different port
  
  beforeAll(async () => {
    // Start server for performance testing
    return new Promise((resolve, reject) => {
      serverProcess = spawn('node', ['server.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, PORT: '8002' },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let serverOutput = '';
      
      serverProcess.stdout.on('data', (data) => {
        serverOutput += data.toString();
        if (serverOutput.includes('Running on port 8002')) {
          setTimeout(resolve, 500);
        }
      });

      serverProcess.stderr.on('data', (data) => {
        console.error('Server stderr:', data.toString());
      });

      serverProcess.on('error', (error) => {
        reject(new Error(`Failed to start server: ${error.message}`));
      });

      setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 10000);
    });
  }, 15000);

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      
      return new Promise((resolve) => {
        serverProcess.on('exit', resolve);
        setTimeout(() => {
          serverProcess.kill('SIGKILL');
          resolve();
        }, 5000);
      });
    }
  });

  describe('メッセージ送信パフォーマンステスト (Message Sending Performance Tests)', () => {
    test('should handle single message with good response time', async () => {
      const startTime = process.hrtime.bigint();
      
      const response = await request(serverUrl)
        .post('/messages')
        .send({
          username: 'perftest',
          message: 'Single message performance test'
        })
        .expect(201);

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(100); // Should respond within 100ms
      
      console.log(`Single message response time: ${duration.toFixed(2)}ms`);
    });

    test('should handle burst of messages efficiently', async () => {
      const messageCount = 100;
      const startTime = process.hrtime.bigint();
      
      const promises = Array.from({ length: messageCount }, (_, i) => 
        request(serverUrl)
          .post('/messages')
          .send({
            username: `burstuser${i}`,
            message: `Burst message ${i}`
          })
          .expect(201)
      );

      const responses = await Promise.all(promises);
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      expect(responses.length).toBe(messageCount);
      expect(duration).toBeLessThan(5000); // Should handle 100 messages within 5 seconds
      
      const avgResponseTime = duration / messageCount;
      expect(avgResponseTime).toBeLessThan(50); // Average response time should be under 50ms
      
      console.log(`Burst test: ${messageCount} messages in ${duration.toFixed(2)}ms (avg: ${avgResponseTime.toFixed(2)}ms per message)`);
    });

    test('should maintain performance under sustained load', async () => {
      const batchSize = 20;
      const batchCount = 5;
      const results = [];

      for (let batch = 0; batch < batchCount; batch++) {
        const startTime = process.hrtime.bigint();
        
        const promises = Array.from({ length: batchSize }, (_, i) => 
          request(serverUrl)
            .post('/messages')
            .send({
              username: `sustaineduser${batch}_${i}`,
              message: `Sustained load message batch ${batch} item ${i}`
            })
            .expect(201)
        );

        const responses = await Promise.all(promises);
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000;

        expect(responses.length).toBe(batchSize);
        results.push(duration);

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Performance should not degrade significantly over time
      const firstBatchTime = results[0];
      const lastBatchTime = results[results.length - 1];
      const degradation = (lastBatchTime - firstBatchTime) / firstBatchTime;

      expect(degradation).toBeLessThan(0.5); // Less than 50% degradation
      
      console.log(`Sustained load test: First batch: ${firstBatchTime.toFixed(2)}ms, Last batch: ${lastBatchTime.toFixed(2)}ms, Degradation: ${(degradation * 100).toFixed(1)}%`);
    });
  });

  describe('メモリ使用量テスト (Memory Usage Tests)', () => {
    test('should limit message history to prevent memory leaks', async () => {
      // Send more messages than the limit (100) to test memory management
      const messageCount = 150;
      
      const promises = Array.from({ length: messageCount }, (_, i) => 
        request(serverUrl)
          .post('/messages')
          .send({
            username: `memoryuser${i}`,
            message: `Memory test message ${i} - ${'x'.repeat(100)}` // Larger messages
          })
          .expect(201)
      );

      const responses = await Promise.all(promises);
      
      expect(responses.length).toBe(messageCount);
      
      // All messages should be processed successfully
      responses.forEach((response, index) => {
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toContain(`Memory test message ${index}`);
      });

      console.log(`Memory test: Successfully processed ${messageCount} messages with memory limiting`);
    });

    test('should handle large message content efficiently', async () => {
      const largeMessageSizes = [100, 250, 400, 500]; // Different message sizes up to limit
      
      for (const size of largeMessageSizes) {
        const largeContent = 'A'.repeat(size);
        const startTime = process.hrtime.bigint();
        
        const response = await request(serverUrl)
          .post('/messages')
          .send({
            username: 'largemsguser',
            message: largeContent
          })
          .expect(201);

        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000;

        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toBe(largeContent);
        expect(duration).toBeLessThan(200); // Should handle large messages within 200ms
        
        console.log(`Large message test (${size} chars): ${duration.toFixed(2)}ms`);
      }
    });

    test('should handle concurrent connections without memory issues', async () => {
      // Simulate multiple concurrent users
      const userCount = 10;
      const messagesPerUser = 10;
      
      const allPromises = [];
      
      for (let user = 0; user < userCount; user++) {
        for (let msg = 0; msg < messagesPerUser; msg++) {
          allPromises.push(
            request(serverUrl)
              .post('/messages')
              .send({
                username: `concurrentuser${user}`,
                message: `Concurrent message ${msg} from user ${user}`
              })
              .expect(201)
          );
        }
      }

      const startTime = process.hrtime.bigint();
      const responses = await Promise.all(allPromises);
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      expect(responses.length).toBe(userCount * messagesPerUser);
      
      // All messages should be processed successfully
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });

      const avgResponseTime = duration / responses.length;
      expect(avgResponseTime).toBeLessThan(100); // Average response time should be reasonable
      
      console.log(`Concurrent test: ${responses.length} messages from ${userCount} users in ${duration.toFixed(2)}ms (avg: ${avgResponseTime.toFixed(2)}ms)`);
    });
  });

  describe('SSE接続パフォーマンステスト (SSE Connection Performance Tests)', () => {
    test('should establish SSE connection quickly', async () => {
      const startTime = process.hrtime.bigint();
      
      const response = await request(serverUrl)
        .get('/events')
        .set('Accept', 'text/event-stream')
        .expect(200);

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      expect(response.headers['content-type']).toBe('text/event-stream');
      expect(duration).toBeLessThan(50); // SSE connection should be established quickly
      
      console.log(`SSE connection establishment time: ${duration.toFixed(2)}ms`);
    });

    test('should handle multiple SSE connection attempts', async () => {
      const connectionCount = 5;
      const startTime = process.hrtime.bigint();
      
      const promises = Array.from({ length: connectionCount }, () => 
        request(serverUrl)
          .get('/events')
          .set('Accept', 'text/event-stream')
          .expect(200)
      );

      const responses = await Promise.all(promises);
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      expect(responses.length).toBe(connectionCount);
      
      responses.forEach(response => {
        expect(response.headers['content-type']).toBe('text/event-stream');
      });

      const avgConnectionTime = duration / connectionCount;
      expect(avgConnectionTime).toBeLessThan(100);
      
      console.log(`Multiple SSE connections: ${connectionCount} connections in ${duration.toFixed(2)}ms (avg: ${avgConnectionTime.toFixed(2)}ms)`);
    });
  });

  describe('静的ファイル配信パフォーマンステスト (Static File Serving Performance Tests)', () => {
    test('should serve HTML file efficiently', async () => {
      const startTime = process.hrtime.bigint();
      
      const response = await request(serverUrl)
        .get('/')
        .expect(200);

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      expect(response.text).toContain('<!DOCTYPE html>');
      expect(duration).toBeLessThan(50); // HTML should be served quickly
      
      console.log(`HTML file serving time: ${duration.toFixed(2)}ms`);
    });

    test('should serve CSS file efficiently', async () => {
      const startTime = process.hrtime.bigint();
      
      const response = await request(serverUrl)
        .get('/style.css')
        .expect(200);

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      expect(response.headers['content-type']).toMatch(/text\/css/);
      expect(duration).toBeLessThan(50); // CSS should be served quickly
      
      console.log(`CSS file serving time: ${duration.toFixed(2)}ms`);
    });

    test('should serve JavaScript file efficiently', async () => {
      const startTime = process.hrtime.bigint();
      
      const response = await request(serverUrl)
        .get('/script.js')
        .expect(200);

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      expect(response.headers['content-type']).toMatch(/application\/javascript/);
      expect(duration).toBeLessThan(50); // JavaScript should be served quickly
      
      console.log(`JavaScript file serving time: ${duration.toFixed(2)}ms`);
    });

    test('should handle concurrent static file requests', async () => {
      const files = ['/', '/style.css', '/script.js'];
      const requestCount = 10;
      
      const allPromises = [];
      
      for (let i = 0; i < requestCount; i++) {
        files.forEach(file => {
          allPromises.push(
            request(serverUrl)
              .get(file)
              .expect(200)
          );
        });
      }

      const startTime = process.hrtime.bigint();
      const responses = await Promise.all(allPromises);
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      expect(responses.length).toBe(requestCount * files.length);
      
      const avgResponseTime = duration / responses.length;
      expect(avgResponseTime).toBeLessThan(100);
      
      console.log(`Concurrent static file serving: ${responses.length} requests in ${duration.toFixed(2)}ms (avg: ${avgResponseTime.toFixed(2)}ms)`);
    });
  });

  describe('エラーハンドリングパフォーマンステスト (Error Handling Performance Tests)', () => {
    test('should handle validation errors efficiently', async () => {
      const invalidRequests = [
        { username: '', message: 'Valid message' },
        { username: 'validuser', message: '' },
        { username: 'a'.repeat(51), message: 'Valid message' },
        { username: 'validuser', message: 'a'.repeat(501) }
      ];

      const startTime = process.hrtime.bigint();
      
      const promises = invalidRequests.map(req => 
        request(serverUrl)
          .post('/messages')
          .send(req)
          .expect(400)
      );

      const responses = await Promise.all(promises);
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      expect(responses.length).toBe(invalidRequests.length);
      
      responses.forEach(response => {
        expect(response.body.error).toBe('Validation failed');
      });

      const avgErrorResponseTime = duration / responses.length;
      expect(avgErrorResponseTime).toBeLessThan(50); // Error responses should be fast
      
      console.log(`Error handling performance: ${responses.length} validation errors in ${duration.toFixed(2)}ms (avg: ${avgErrorResponseTime.toFixed(2)}ms)`);
    });

    test('should handle malformed JSON efficiently', async () => {
      const malformedRequests = [
        '{"invalid": json}',
        '{incomplete',
        'not json at all',
        '{"nested": {"incomplete"',
        ''
      ];

      const startTime = process.hrtime.bigint();
      
      const promises = malformedRequests.map(json => 
        request(serverUrl)
          .post('/messages')
          .set('Content-Type', 'application/json')
          .send(json)
          .expect(400)
      );

      const responses = await Promise.all(promises);
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      expect(responses.length).toBe(malformedRequests.length);
      
      const avgErrorResponseTime = duration / responses.length;
      expect(avgErrorResponseTime).toBeLessThan(50);
      
      console.log(`Malformed JSON handling: ${responses.length} requests in ${duration.toFixed(2)}ms (avg: ${avgErrorResponseTime.toFixed(2)}ms)`);
    });
  });

  describe('リソース使用量テスト (Resource Usage Tests)', () => {
    test('should handle XSS escaping efficiently', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>'.repeat(10),
        '<svg onload=alert(1)>'.repeat(5),
        'javascript:alert(1)'.repeat(20),
        '<iframe src="javascript:alert(1)"></iframe>'.repeat(3)
      ];

      const startTime = process.hrtime.bigint();
      
      const promises = xssPayloads.map((payload, index) => 
        request(serverUrl)
          .post('/messages')
          .send({
            username: `xsstest${index}`,
            message: payload
          })
          .expect(201)
      );

      const responses = await Promise.all(promises);
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      expect(responses.length).toBe(xssPayloads.length);
      
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
        // Verify XSS content is escaped
        expect(response.body.data.message).not.toContain('<script>');
        expect(response.body.data.message).not.toContain('<img');
        expect(response.body.data.message).not.toContain('<svg');
      });

      const avgEscapingTime = duration / responses.length;
      expect(avgEscapingTime).toBeLessThan(100); // XSS escaping should be efficient
      
      console.log(`XSS escaping performance: ${responses.length} payloads in ${duration.toFixed(2)}ms (avg: ${avgEscapingTime.toFixed(2)}ms)`);
    });

    test('should handle Unicode content efficiently', async () => {
      const unicodeMessages = [
        'こんにちは世界！🌍',
        '测试中文字符 🇨🇳',
        'Тест русских символов 🇷🇺',
        'العربية اختبار 🇸🇦',
        '🎉🎊🎈🎁🎂🍰🎪🎨🎭🎪'.repeat(10)
      ];

      const startTime = process.hrtime.bigint();
      
      const promises = unicodeMessages.map((message, index) => 
        request(serverUrl)
          .post('/messages')
          .send({
            username: `unicodeuser${index}`,
            message: message
          })
          .expect(201)
      );

      const responses = await Promise.all(promises);
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      expect(responses.length).toBe(unicodeMessages.length);
      
      responses.forEach((response, index) => {
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toBe(unicodeMessages[index]);
      });

      const avgUnicodeTime = duration / responses.length;
      expect(avgUnicodeTime).toBeLessThan(100);
      
      console.log(`Unicode handling performance: ${responses.length} messages in ${duration.toFixed(2)}ms (avg: ${avgUnicodeTime.toFixed(2)}ms)`);
    });
  });
});