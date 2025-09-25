/**
 * Server-side tests for SSE Chat App
 * Tests basic functionality: message sending/receiving, empty message prevention, HTML escaping
 * Requirements: 1.2, 1.4, 5.1
 */

const request = require('supertest');
const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');

// Import server functions for testing
const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Create a test server instance
function createTestServer() {
  const app = express();
  
  // In-memory message storage for testing
  let messages = [];
  let sseClients = [];

  // HTML escaping function (same as in server.js)
  function escapeHtml(text) {
    const htmlEscapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return text.replace(/[&<>"'/]/g, (match) => htmlEscapeMap[match]);
  }

  // Message validation functions (same as in server.js)
  function validateMessage(username, message) {
    const errors = [];
    
    if (username === undefined || username === null) {
      errors.push('Username is required');
    } else if (typeof username !== 'string') {
      errors.push('Username must be a string');
    } else if (username.trim().length === 0) {
      errors.push('Username cannot be empty');
    } else if (username.trim().length > 50) {
      errors.push('Username must be 50 characters or less');
    } else if (!/^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s\-_\.]+$/.test(username.trim())) {
      errors.push('Username contains invalid characters');
    }
    
    if (message === undefined || message === null) {
      errors.push('Message is required');
    } else if (typeof message !== 'string') {
      errors.push('Message must be a string');
    } else if (message.trim().length === 0) {
      errors.push('Message cannot be empty');
    } else if (message.trim().length > 500) {
      errors.push('Message must be 500 characters or less');
    }
    
    return errors;
  }

  // Create message object (same as in server.js)
  function createMessage(username, messageText) {
    return {
      id: uuidv4(),
      username: escapeHtml(username.trim()),
      message: escapeHtml(messageText.trim()),
      timestamp: new Date()
    };
  }

  // Middleware
  app.use(express.json({ limit: '1mb', strict: true }));
  
  // Error handling middleware for JSON parsing
  app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid JSON format',
        details: ['Request body contains invalid JSON']
      });
    }
    next(error);
  });

  // Message sending endpoint
  app.post('/messages', (req, res) => {
    try {
      if (!req.body) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Request body is required',
          details: ['Request body cannot be empty']
        });
      }

      const { username, message } = req.body;
      
      const validationErrors = validateMessage(username, message);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid input data',
          details: validationErrors
        });
      }

      const newMessage = createMessage(username, message);
      messages.push(newMessage);

      // Limit message history
      if (messages.length > 100) {
        messages = messages.slice(-100);
      }

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: {
          id: newMessage.id,
          username: newMessage.username,
          message: newMessage.message,
          timestamp: newMessage.timestamp.toISOString()
        }
      });

    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process message. Please try again.'
      });
    }
  });

  // Test helper endpoints
  app.get('/test/messages', (req, res) => {
    res.json(messages);
  });

  app.delete('/test/messages', (req, res) => {
    messages = [];
    res.json({ success: true });
  });

  // Expose test functions
  app.escapeHtml = escapeHtml;
  app.validateMessage = validateMessage;
  app.createMessage = createMessage;

  return app;
}

describe('SSE Chat App - Basic Functionality Tests', () => {
  let app;

  beforeEach(() => {
    app = createTestServer();
  });

  describe('Message Sending and Receiving (Requirement 1.2)', () => {
    test('should successfully send a valid message', async () => {
      const messageData = {
        username: 'testuser',
        message: 'Hello, world!'
      };

      const response = await request(app)
        .post('/messages')
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Message sent successfully');
      expect(response.body.data).toMatchObject({
        username: 'testuser',
        message: 'Hello, world!'
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
    });

    test('should store message in memory', async () => {
      const messageData = {
        username: 'testuser',
        message: 'Test message'
      };

      await request(app)
        .post('/messages')
        .send(messageData)
        .expect(201);

      const messagesResponse = await request(app)
        .get('/test/messages')
        .expect(200);

      expect(messagesResponse.body).toHaveLength(1);
      expect(messagesResponse.body[0]).toMatchObject({
        username: 'testuser',
        message: 'Test message'
      });
    });

    test('should handle multiple messages correctly', async () => {
      const messages = [
        { username: 'user1', message: 'First message' },
        { username: 'user2', message: 'Second message' },
        { username: 'user1', message: 'Third message' }
      ];

      for (const msg of messages) {
        await request(app)
          .post('/messages')
          .send(msg)
          .expect(201);
      }

      const messagesResponse = await request(app)
        .get('/test/messages')
        .expect(200);

      expect(messagesResponse.body).toHaveLength(3);
      expect(messagesResponse.body[0].message).toBe('First message');
      expect(messagesResponse.body[1].message).toBe('Second message');
      expect(messagesResponse.body[2].message).toBe('Third message');
    });
  });

  describe('Empty Message Prevention (Requirement 1.2)', () => {
    test('should reject empty message', async () => {
      const messageData = {
        username: 'testuser',
        message: ''
      };

      const response = await request(app)
        .post('/messages')
        .send(messageData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Message cannot be empty');
    });

    test('should reject message with only whitespace', async () => {
      const messageData = {
        username: 'testuser',
        message: '   \n\t   '
      };

      const response = await request(app)
        .post('/messages')
        .send(messageData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Message cannot be empty');
    });

    test('should reject missing message field', async () => {
      const messageData = {
        username: 'testuser'
        // message field is missing
      };

      const response = await request(app)
        .post('/messages')
        .send(messageData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Message is required');
    });

    test('should reject null message', async () => {
      const messageData = {
        username: 'testuser',
        message: null
      };

      const response = await request(app)
        .post('/messages')
        .send(messageData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Message is required');
    });

    test('should reject empty username', async () => {
      const messageData = {
        username: '',
        message: 'Valid message'
      };

      const response = await request(app)
        .post('/messages')
        .send(messageData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Username cannot be empty');
    });

    test('should reject missing username field', async () => {
      const messageData = {
        message: 'Valid message'
        // username field is missing
      };

      const response = await request(app)
        .post('/messages')
        .send(messageData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Username is required');
    });
  });

  describe('HTML Escaping for XSS Protection (Requirements 1.4, 5.1)', () => {
    test('should escape HTML tags in message', async () => {
      const messageData = {
        username: 'testuser',
        message: '<script>alert("xss")</script>Hello'
      };

      const response = await request(app)
        .post('/messages')
        .send(messageData)
        .expect(201);

      expect(response.body.data.message).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;Hello');
    });

    test('should escape HTML tags in message', async () => {
      const messageData = {
        username: 'user123',
        message: '<img src=x onerror=alert(1)>'
      };

      const response = await request(app)
        .post('/messages')
        .send(messageData)
        .expect(201);

      expect(response.body.data.message).toBe('&lt;img src=x onerror=alert(1)&gt;');
    });

    test('should escape HTML entities in username when valid characters are used', async () => {
      const messageData = {
        username: 'user-test_123',  // Valid username format
        message: 'Hello world'
      };

      const response = await request(app)
        .post('/messages')
        .send(messageData)
        .expect(201);

      expect(response.body.data.username).toBe('user-test_123');
    });

    test('should escape multiple HTML entities', async () => {
      const messageData = {
        username: 'usertest',  // Use valid username without &
        message: 'Hello & <welcome> "friends" \'here\' /path'
      };

      const response = await request(app)
        .post('/messages')
        .send(messageData)
        .expect(201);

      expect(response.body.data.username).toBe('usertest');
      expect(response.body.data.message).toBe('Hello &amp; &lt;welcome&gt; &quot;friends&quot; &#x27;here&#x27; &#x2F;path');
    });

    test('should handle complex XSS attempts', async () => {
      const xssAttempts = [
        '<script>document.cookie</script>',
        'javascript:alert(1)',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        '"><script>alert(1)</script>',
        '\';alert(1);//'
      ];

      for (const xss of xssAttempts) {
        const messageData = {
          username: 'testuser',
          message: xss
        };

        const response = await request(app)
          .post('/messages')
          .send(messageData)
          .expect(201);

        // Verify that dangerous HTML tags are escaped
        expect(response.body.data.message).not.toContain('<script>');
        expect(response.body.data.message).not.toContain('<img');
        expect(response.body.data.message).not.toContain('<svg');
        expect(response.body.data.message).not.toContain('<iframe');
        expect(response.body.data.message).not.toContain('<object');
        
        // For XSS attempts with HTML tags, verify they are escaped
        if (xss.includes('<') && xss.includes('>')) {
          expect(response.body.data.message).toContain('&lt;');
          expect(response.body.data.message).toContain('&gt;');
        }
      }
    });
  });

  describe('Input Validation', () => {
    test('should reject message longer than 500 characters', async () => {
      const longMessage = 'a'.repeat(501);
      const messageData = {
        username: 'testuser',
        message: longMessage
      };

      const response = await request(app)
        .post('/messages')
        .send(messageData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Message must be 500 characters or less');
    });

    test('should accept message with exactly 500 characters', async () => {
      const maxMessage = 'a'.repeat(500);
      const messageData = {
        username: 'testuser',
        message: maxMessage
      };

      const response = await request(app)
        .post('/messages')
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('should reject username longer than 50 characters', async () => {
      const longUsername = 'a'.repeat(51);
      const messageData = {
        username: longUsername,
        message: 'Valid message'
      };

      const response = await request(app)
        .post('/messages')
        .send(messageData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Username must be 50 characters or less');
    });

    test('should accept username with exactly 50 characters', async () => {
      const maxUsername = 'a'.repeat(50);
      const messageData = {
        username: maxUsername,
        message: 'Valid message'
      };

      const response = await request(app)
        .post('/messages')
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('should reject invalid JSON', async () => {
      const response = await request(app)
        .post('/messages')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('Invalid JSON format');
    });

    test('should reject non-string username', async () => {
      const messageData = {
        username: 123,
        message: 'Valid message'
      };

      const response = await request(app)
        .post('/messages')
        .send(messageData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Username must be a string');
    });

    test('should reject non-string message', async () => {
      const messageData = {
        username: 'testuser',
        message: 123
      };

      const response = await request(app)
        .post('/messages')
        .send(messageData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Message must be a string');
    });
  });

  describe('Message Storage and Limits', () => {
    test('should limit message history to 100 messages', async () => {
      // Clear existing messages
      await request(app).delete('/test/messages');

      // Send 105 messages
      for (let i = 1; i <= 105; i++) {
        await request(app)
          .post('/messages')
          .send({
            username: `user${i}`,
            message: `Message ${i}`
          })
          .expect(201);
      }

      const messagesResponse = await request(app)
        .get('/test/messages')
        .expect(200);

      // Should only keep the latest 100 messages
      expect(messagesResponse.body).toHaveLength(100);
      expect(messagesResponse.body[0].message).toBe('Message 6'); // First kept message
      expect(messagesResponse.body[99].message).toBe('Message 105'); // Last message
    });
  });

  describe('Error Handling', () => {
    test('should handle missing request body', async () => {
      const response = await request(app)
        .post('/messages')
        .expect(400);

      // The actual server returns validation failed when body is empty object
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Username is required');
      expect(response.body.details).toContain('Message is required');
    });

    test('should handle empty request body', async () => {
      const response = await request(app)
        .post('/messages')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Username is required');
      expect(response.body.details).toContain('Message is required');
    });
  });
});

describe('HTML Escaping Function Unit Tests', () => {
  let app;

  beforeEach(() => {
    app = createTestServer();
  });

  test('should escape ampersand', () => {
    expect(app.escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  test('should escape less than', () => {
    expect(app.escapeHtml('5 < 10')).toBe('5 &lt; 10');
  });

  test('should escape greater than', () => {
    expect(app.escapeHtml('10 > 5')).toBe('10 &gt; 5');
  });

  test('should escape double quotes', () => {
    expect(app.escapeHtml('Say "hello"')).toBe('Say &quot;hello&quot;');
  });

  test('should escape single quotes', () => {
    expect(app.escapeHtml("It's working")).toBe('It&#x27;s working');
  });

  test('should escape forward slash', () => {
    expect(app.escapeHtml('path/to/file')).toBe('path&#x2F;to&#x2F;file');
  });

  test('should handle empty string', () => {
    expect(app.escapeHtml('')).toBe('');
  });

  test('should handle string with no special characters', () => {
    expect(app.escapeHtml('Hello World 123')).toBe('Hello World 123');
  });

  test('should handle multiple special characters', () => {
    expect(app.escapeHtml('<script>alert("XSS & more")</script>'))
      .toBe('&lt;script&gt;alert(&quot;XSS &amp; more&quot;)&lt;&#x2F;script&gt;');
  });
});

describe('Message Validation Function Unit Tests', () => {
  let app;

  beforeEach(() => {
    app = createTestServer();
  });

  test('should return no errors for valid input', () => {
    const errors = app.validateMessage('testuser', 'Hello world');
    expect(errors).toHaveLength(0);
  });

  test('should validate Japanese characters in username', () => {
    const errors = app.validateMessage('テストユーザー', 'こんにちは');
    expect(errors).toHaveLength(0);
  });

  test('should validate mixed characters in username', () => {
    const errors = app.validateMessage('user_123-test.name', 'Valid message');
    expect(errors).toHaveLength(0);
  });

  test('should reject invalid characters in username', () => {
    const errors = app.validateMessage('user@domain.com', 'Valid message');
    expect(errors).toContain('Username contains invalid characters');
  });

  test('should handle edge cases for username length', () => {
    const errors50 = app.validateMessage('a'.repeat(50), 'Valid message');
    expect(errors50).toHaveLength(0);

    const errors51 = app.validateMessage('a'.repeat(51), 'Valid message');
    expect(errors51).toContain('Username must be 50 characters or less');
  });

  test('should handle edge cases for message length', () => {
    const errors500 = app.validateMessage('testuser', 'a'.repeat(500));
    expect(errors500).toHaveLength(0);

    const errors501 = app.validateMessage('testuser', 'a'.repeat(501));
    expect(errors501).toContain('Message must be 500 characters or less');
  });
});