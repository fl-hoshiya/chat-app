const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 8000;

// In-memory message storage
let messages = [];

// SSE client connections management
let sseClients = [];

// HTML escaping function for XSS protection
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

// Message validation functions
function validateMessage(username, message) {
  const errors = [];
  
  // Check if username is provided and is a string
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
  
  // Check if message is provided and is a string
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

// Create message object with HTML escaping for XSS protection
function createMessage(username, messageText) {
  return {
    id: uuidv4(),
    username: escapeHtml(username.trim()),
    message: escapeHtml(messageText.trim()),
    timestamp: new Date()
  };
}

// Broadcast message to all connected SSE clients
function broadcastMessage(message) {
  if (sseClients.length === 0) {
    console.log('[Broadcast] No clients connected, skipping broadcast');
    return;
  }

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

  // Send to all connected clients
  sseClients.forEach((client, index) => {
    try {
      // Check if response is still writable
      if (client.response.writable) {
        client.response.write(`data: ${eventData}\n\n`);
        successCount++;
      } else {
        console.warn(`[Broadcast] Client ${client.id} response not writable, marking for removal`);
        failedClients.push(index);
        failureCount++;
      }
    } catch (error) {
      console.error(`[Broadcast] Error sending message to client ${client.id}:`, error.message);
      console.error(`[Broadcast] Error details:`, {
        code: error.code,
        errno: error.errno,
        syscall: error.syscall
      });
      failedClients.push(index);
      failureCount++;
    }
  });

  // Remove failed clients (iterate in reverse to maintain indices)
  failedClients.reverse().forEach(index => {
    const removedClient = sseClients.splice(index, 1)[0];
    console.log(`[Broadcast] Removed failed client: ${removedClient.id}`);
  });

  console.log(`[Broadcast] Message sent - Success: ${successCount}, Failed: ${failureCount}, Active clients: ${sseClients.length}`);

  if (failureCount > 0) {
    throw new Error(`Failed to send message to ${failureCount} clients`);
  }
}

// Middleware for parsing JSON requests with error handling
app.use(express.json({
  limit: '1mb',
  strict: true
}));

// Error handling middleware for JSON parsing errors
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('[Middleware] JSON parsing error:', error.message);
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid JSON format',
      details: ['Request body contains invalid JSON']
    });
  }
  next(error);
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// SSE endpoint for real-time message streaming
app.get('/events', (req, res) => {
  try {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Create client object
    const clientId = uuidv4();
    const client = {
      id: clientId,
      response: res
    };

    // Add client to the list
    sseClients.push(client);
    console.log(`[SSE] Client connected: ${clientId}. Total clients: ${sseClients.length}`);

    // Send initial connection confirmation
    try {
      res.write(`data: ${JSON.stringify({ type: 'connected', clientId: clientId })}\n\n`);
    } catch (writeError) {
      console.error(`[SSE] Failed to send initial message to client ${clientId}:`, writeError);
      sseClients = sseClients.filter(c => c.id !== clientId);
      return;
    }

    // Handle client disconnect
    req.on('close', () => {
      // Remove client from the list
      sseClients = sseClients.filter(c => c.id !== clientId);
      console.log(`[SSE] Client disconnected: ${clientId}. Total clients: ${sseClients.length}`);
    });

    // Handle connection errors
    req.on('error', (err) => {
      console.error(`[SSE] Connection error for client ${clientId}:`, err.message);
      console.error(`[SSE] Error details:`, {
        code: err.code,
        errno: err.errno,
        syscall: err.syscall
      });
      sseClients = sseClients.filter(c => c.id !== clientId);
    });

    // Handle response errors
    res.on('error', (err) => {
      console.error(`[SSE] Response error for client ${clientId}:`, err.message);
      sseClients = sseClients.filter(c => c.id !== clientId);
    });

  } catch (error) {
    console.error('[SSE] Failed to establish SSE connection:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to establish SSE connection'
      });
    }
  }
});

// Basic route for serving the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Message sending endpoint
app.post('/messages', (req, res) => {
  try {
    // Check if request body exists
    if (!req.body) {
      console.warn('[API] POST /messages - Missing request body');
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Request body is required',
        details: ['Request body cannot be empty']
      });
    }

    const { username, message } = req.body;

    // Log the incoming request (without sensitive data)
    console.log(`[API] POST /messages - User: ${username ? username.substring(0, 20) : 'undefined'}, Message length: ${message ? message.length : 0}`);

    // Validate the message
    const validationErrors = validateMessage(username, message);
    if (validationErrors.length > 0) {
      console.warn('[API] POST /messages - Validation failed:', validationErrors);
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: validationErrors
      });
    }

    // Create and store the message
    const newMessage = createMessage(username, message);
    messages.push(newMessage);

    // Limit message history to prevent memory issues
    if (messages.length > 100) {
      messages = messages.slice(-100);
      console.log('[Memory] Message history trimmed to 100 messages');
    }

    // Broadcast to all connected clients
    try {
      broadcastMessage(newMessage);
    } catch (broadcastError) {
      console.error('[Broadcast] Failed to broadcast message:', broadcastError);
      // Still return success since message was saved, but log the broadcast failure
    }

    // Return success response
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

    console.log(`[API] Message sent successfully - ID: ${newMessage.id}`);

  } catch (error) {
    console.error('[API] Error processing message:', error);
    console.error('[API] Error stack:', error.stack);
    
    // Don't expose internal error details to client
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process message. Please try again.'
      });
    }
  }
});

// 404 handler for unknown routes
app.use('*', (req, res) => {
  console.warn(`[404] Unknown route accessed: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('[Global Error Handler] Unhandled error:', error);
  console.error('[Global Error Handler] Error stack:', error.stack);
  
  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      ...(isDevelopment && { details: error.message, stack: error.stack })
    });
  }
});

// Start the server with error handling
const server = app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
  console.log(`[Server] Access the chat app at http://localhost:${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('[Server] Failed to start server:', error);
  
  if (error.code === 'EADDRINUSE') {
    console.error(`[Server] Port ${PORT} is already in use`);
    process.exit(1);
  } else if (error.code === 'EACCES') {
    console.error(`[Server] Permission denied to bind to port ${PORT}`);
    process.exit(1);
  } else {
    console.error('[Server] Unexpected server error:', error);
    process.exit(1);
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});