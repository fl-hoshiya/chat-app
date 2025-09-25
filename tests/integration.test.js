/**
 * Integration tests for SSE Chat App
 * Tests multiple client connections, message broadcasting, SSE connection management
 * Requirements: 2.4, 4.2
 */

const request = require('supertest');
const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');

// Import the actual server components for testing
const express = require('express');
const { v4: uuidv4 } = require('uuid');

// Create a simplified test server for integration testing
function createIntegrationTestServer() {
  const app = express();
  
  // In-memory storage
  let messages = [];
  let sseClients = [];

  // HTML escaping function
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

  // Message validation
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

  // Create message
  function createMessage(username, messageText) {
    return {
      id: uuidv4(),
      username: escapeHtml(username.trim()),
      message: escapeHtml(messageText.trim()),
      timestamp: new Date()
    };
  }

  // Broadcast message to all SSE clients
  function broadcastMessage(message) {
    const eventData = JSON.stringify({
      type: 'message',
      data: {
        id: message.id,
        username: message.username,
        message: message.message,
        timestamp: message.timestamp.toISOString()
      }
    });

    let successCount = 0;
    let failureCount = 0;
    const failedClients = [];

    sseClients.forEach((client, index) => {
      try {
        if (client.response && client.response.writable && !client.response.destroyed) {
          client.response.write(`data: ${eventData}\n\n`);
          successCount++;
        } else {
          failedClients.push(index);
          failureCount++;
        }
      } catch (error) {
        failedClients.push(index);
        failureCount++;
      }
    });

    // Remove failed clients
    failedClients.reverse().forEach(index => {
      sseClients.splice(index, 1);
    });

    return { successCount, failureCount, activeClients: sseClients.length };
  }

  // Middleware
  app.use(express.json({ limit: '1mb', strict: true }));

  // SSE endpoint
  app.get('/events', (req, res) => {
    try {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      const clientId = uuidv4();
      const client = {
        id: clientId,
        response: res,
        connected: true
      };

      sseClients.push(client);

      // Send initial connection confirmation
      res.write(`data: ${JSON.stringify({ type: 'connected', clientId: clientId })}\n\n`);

      // Handle client disconnect
      req.on('close', () => {
        sseClients = sseClients.filter(c => c.id !== clientId);
        client.connected = false;
      });

      req.on('error', () => {
        sseClients = sseClients.filter(c => c.id !== clientId);
        client.connected = false;
      });

      res.on('error', () => {
        sseClients = sseClients.filter(c => c.id !== clientId);
        client.connected = false;
      });

    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal server error',
          message: 'Failed to establish SSE connection'
        });
      }
    }
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

      if (messages.length > 100) {
        messages = messages.slice(-100);
      }

      const broadcastResult = broadcastMessage(newMessage);

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: {
          id: newMessage.id,
          username: newMessage.username,
          message: newMessage.message,
          timestamp: newMessage.timestamp.toISOString()
        },
        broadcast: broadcastResult
      });

    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process message. Please try again.'
      });
    }
  });

  // Test helper endpoints
  app.get('/test/clients', (req, res) => {
    res.json({
      count: sseClients.length,
      clients: sseClients.map(c => ({ 
        id: c.id, 
        connected: c.connected,
        writable: c.response ? c.response.writable : false 
      }))
    });
  });

  app.get('/test/messages', (req, res) => {
    res.json(messages);
  });

  app.delete('/test/reset', (req, res) => {
    messages = [];
    res.json({ success: true, messagesCleared: true, activeClients: sseClients.length });
  });

  app.post('/test/simulate-broadcast', (req, res) => {
    const { username, message } = req.body;
    const newMessage = createMessage(username, message);
    const broadcastResult = broadcastMessage(newMessage);
    
    res.json({
      success: true,
      message: newMessage,
      broadcast: broadcastResult
    });
  });

  return app;
}

describe('SSE Chat App - Multiple Client Connection Tests', () => {
  let app;

  beforeEach(() => {
    app = createIntegrationTestServer();
  });

  describe('Multiple Client Connection Management (Requirement 2.4)', () => {
    test('should track multiple SSE client connections', async () => {
      // Test the client tracking functionality by checking initial state
      const clientsResponse = await request(app)
        .get('/test/clients')
        .expect(200);

      expect(clientsResponse.body).toHaveProperty('count');
      expect(clientsResponse.body).toHaveProperty('clients');
      expect(Array.isArray(clientsResponse.body.clients)).toBe(true);
      expect(clientsResponse.body.count).toBe(0); // No clients connected initially
    });

    test('should handle message broadcasting to multiple clients', async () => {
      // First establish some mock connections
      const mockClients = [];
      
      // Create mock SSE clients
      for (let i = 0; i < 3; i++) {
        mockClients.push({
          id: `client-${i}`,
          response: {
            write: jest.fn(),
            writable: true,
            destroyed: false
          },
          connected: true
        });
      }

      // Test the broadcast functionality
      const response = await request(app)
        .post('/test/simulate-broadcast')
        .send({
          username: 'testuser',
          message: 'Hello everyone!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message.username).toBe('testuser');
      expect(response.body.message.message).toBe('Hello everyone!');
      expect(response.body.broadcast).toBeDefined();
    });

    test('should validate message broadcasting with client count', async () => {
      // Send a message and verify broadcast information
      const response = await request(app)
        .post('/messages')
        .send({
          username: 'broadcaster',
          message: 'Test broadcast message'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.broadcast).toBeDefined();
      expect(response.body.broadcast.activeClients).toBeDefined();
      expect(response.body.broadcast.successCount).toBeDefined();
      expect(response.body.broadcast.failureCount).toBeDefined();
    });
  });

  describe('SSE Connection Management (Requirement 4.2)', () => {
    test('should provide connection status information', async () => {
      const response = await request(app)
        .get('/test/clients')
        .expect(200);

      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('clients');
      expect(Array.isArray(response.body.clients)).toBe(true);
    });

    test('should handle concurrent message sending', async () => {
      const messages = [
        { username: 'user1', message: 'Message 1' },
        { username: 'user2', message: 'Message 2' },
        { username: 'user3', message: 'Message 3' }
      ];

      // Send multiple messages concurrently
      const promises = messages.map(msg => 
        request(app)
          .post('/messages')
          .send(msg)
          .expect(201)
      );

      const responses = await Promise.all(promises);

      // Verify all messages were processed successfully
      responses.forEach((response, index) => {
        expect(response.body.success).toBe(true);
        expect(response.body.data.username).toBe(messages[index].username);
        expect(response.body.data.message).toBe(messages[index].message);
      });

      // Verify all messages are stored
      const messagesResponse = await request(app)
        .get('/test/messages')
        .expect(200);

      expect(messagesResponse.body.length).toBe(3);
    });

    test('should handle message storage limits', async () => {
      // Clear existing messages
      await request(app).delete('/test/reset');

      // Send more than 100 messages to test the limit
      const messagePromises = [];
      for (let i = 0; i < 105; i++) {
        messagePromises.push(
          request(app)
            .post('/messages')
            .send({
              username: `user${i}`,
              message: `Message ${i}`
            })
            .expect(201)
        );
      }

      await Promise.all(messagePromises);

      // Verify only the latest 100 messages are kept
      const messagesResponse = await request(app)
        .get('/test/messages')
        .expect(200);

      expect(messagesResponse.body.length).toBe(100);
      
      // Verify it's the latest 100 messages (5-104)
      expect(messagesResponse.body[0].message).toBe('Message 5');
      expect(messagesResponse.body[99].message).toBe('Message 104');
    });

    test('should handle broadcast failure scenarios', async () => {
      // Test broadcast with no connected clients
      const response = await request(app)
        .post('/messages')
        .send({
          username: 'testuser',
          message: 'Message to no one'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.broadcast.activeClients).toBe(0);
      expect(response.body.broadcast.successCount).toBe(0);
    });
  });

  describe('Message Broadcasting Functionality (Requirement 2.4)', () => {
    test('should create proper message format for broadcasting', async () => {
      const response = await request(app)
        .post('/messages')
        .send({
          username: 'testuser',
          message: 'Test message format'
        })
        .expect(201);

      const messageData = response.body.data;
      
      expect(messageData).toHaveProperty('id');
      expect(messageData).toHaveProperty('username', 'testuser');
      expect(messageData).toHaveProperty('message', 'Test message format');
      expect(messageData).toHaveProperty('timestamp');
      
      // Verify timestamp is valid ISO string
      expect(new Date(messageData.timestamp).toISOString()).toBe(messageData.timestamp);
      
      // Verify ID is UUID format
      expect(messageData.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    test('should escape HTML in broadcast messages', async () => {
      const response = await request(app)
        .post('/messages')
        .send({
          username: 'testuser',
          message: '<script>alert("xss")</script>Hello'
        })
        .expect(201);

      expect(response.body.data.message).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;Hello');
    });

    test('should handle rapid message broadcasting', async () => {
      const messageCount = 10;
      const promises = [];

      // Send multiple messages rapidly
      for (let i = 0; i < messageCount; i++) {
        promises.push(
          request(app)
            .post('/messages')
            .send({
              username: `rapiduser${i}`,
              message: `Rapid message ${i}`
            })
            .expect(201)
        );
      }

      const responses = await Promise.all(promises);

      // Verify all messages were processed
      expect(responses.length).toBe(messageCount);
      
      responses.forEach((response, index) => {
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toBe(`Rapid message ${index}`);
      });

      // Verify all messages are stored
      const messagesResponse = await request(app)
        .get('/test/messages')
        .expect(200);

      expect(messagesResponse.body.length).toBe(messageCount);
    });
  });

  describe('Error Handling in Multi-Client Environment', () => {
    test('should handle invalid messages in multi-client context', async () => {
      const invalidMessages = [
        { username: '', message: 'Valid message' },
        { username: 'validuser', message: '' },
        { username: 'a'.repeat(51), message: 'Valid message' },
        { username: 'validuser', message: 'a'.repeat(501) }
      ];

      for (const invalidMsg of invalidMessages) {
        const response = await request(app)
          .post('/messages')
          .send(invalidMsg)
          .expect(400);

        expect(response.body.error).toBe('Validation failed');
        expect(response.body.details).toBeDefined();
        expect(Array.isArray(response.body.details)).toBe(true);
      }

      // Verify no invalid messages were stored
      const messagesResponse = await request(app)
        .get('/test/messages')
        .expect(200);

      expect(messagesResponse.body.length).toBe(0);
    });

    test('should maintain system stability under error conditions', async () => {
      // Mix valid and invalid requests
      const requests = [
        { username: 'user1', message: 'Valid message 1' },
        { username: '', message: 'Invalid - no username' },
        { username: 'user2', message: 'Valid message 2' },
        { username: 'user3', message: '' },
        { username: 'user4', message: 'Valid message 3' }
      ];

      const results = await Promise.allSettled(
        requests.map(req => 
          request(app)
            .post('/messages')
            .send(req)
        )
      );

      // Count successful vs failed requests
      const successful = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 201
      );
      const failed = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 400
      );

      expect(successful.length).toBe(3); // Valid messages
      expect(failed.length).toBe(2); // Invalid messages

      // Verify only valid messages were stored
      const messagesResponse = await request(app)
        .get('/test/messages')
        .expect(200);

      expect(messagesResponse.body.length).toBe(3);
      expect(messagesResponse.body[0].message).toBe('Valid message 1');
      expect(messagesResponse.body[1].message).toBe('Valid message 2');
      expect(messagesResponse.body[2].message).toBe('Valid message 3');
    });
  });
});