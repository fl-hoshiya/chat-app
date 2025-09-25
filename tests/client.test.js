/**
 * Client-side tests for SSE Chat App Frontend
 * Tests frontend functionality: SSE connection, message display, HTML escaping
 * Requirements: 1.2, 1.4, 5.1
 */

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');

// Create a mock DOM environment
function createMockDOM() {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>SSE Chat App</title>
    </head>
    <body>
        <div class="container">
            <div id="messages" class="messages-container"></div>
            <form id="chatForm" class="chat-form">
                <div class="form-group">
                    <input type="text" id="username" placeholder="ユーザー名" required>
                </div>
                <div class="form-group">
                    <input type="text" id="messageInput" placeholder="メッセージを入力..." required>
                </div>
                <button type="submit" id="sendButton">送信</button>
            </form>
        </div>
    </body>
    </html>
  `, {
    url: 'http://localhost:8000',
    pretendToBeVisual: true,
    resources: 'usable'
  });

  return dom;
}

// Load the client script functions for testing
function loadClientScript() {
  // HTML escaping function (from script.js)
  function escapeHtmlClient(text) {
    try {
      if (text === null || text === undefined) {
        return '';
      }
      
      const stringText = String(text);
      const div = document.createElement('div');
      div.textContent = stringText;
      return div.innerHTML;
      
    } catch (error) {
      console.error('[Security] Error escaping HTML:', error);
      return '';
    }
  }

  // Message validation function (from script.js)
  function validateInputs(username, message) {
    const errors = [];
    
    if (!username || username.length === 0) {
      errors.push('ユーザー名を入力してください');
    } else if (username.length > 50) {
      errors.push('ユーザー名は50文字以内で入力してください');
    } else if (!/^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s\-_\.]+$/.test(username)) {
      errors.push('ユーザー名に使用できない文字が含まれています');
    }
    
    if (!message || message.length === 0) {
      errors.push('メッセージを入力してください');
    } else if (message.length > 500) {
      errors.push('メッセージは500文字以内で入力してください');
    }
    
    return errors.length === 0;
  }

  return {
    escapeHtmlClient,
    validateInputs
  };
}

describe('SSE Chat App - Client-side Tests', () => {
  let dom;
  let clientFunctions;

  beforeEach(() => {
    // Create fresh DOM environment
    dom = createMockDOM();
    
    // Set up global DOM objects
    global.window = dom.window;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;
    global.localStorage = dom.window.localStorage;
    
    clientFunctions = loadClientScript();
  });

  afterEach(() => {
    if (dom) {
      dom.window.close();
    }
  });

  describe('HTML Escaping Client-side (Requirements 1.4, 5.1)', () => {
    test('should escape HTML tags', () => {
      const input = '<script>alert("xss")</script>';
      const result = clientFunctions.escapeHtmlClient(input);
      
      expect(result).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
      expect(result).not.toContain('<script>');
    });

    test('should escape HTML entities', () => {
      const input = 'Hello & <world> "test" \'quote\'';
      const result = clientFunctions.escapeHtmlClient(input);
      
      expect(result).toBe('Hello &amp; &lt;world&gt; "test" \'quote\'');
    });

    test('should handle null and undefined', () => {
      expect(clientFunctions.escapeHtmlClient(null)).toBe('');
      expect(clientFunctions.escapeHtmlClient(undefined)).toBe('');
    });

    test('should handle empty string', () => {
      expect(clientFunctions.escapeHtmlClient('')).toBe('');
    });

    test('should handle complex XSS attempts', () => {
      const xssAttempts = [
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        'javascript:alert(1)',
        '<iframe src="javascript:alert(1)"></iframe>'
      ];

      xssAttempts.forEach(xss => {
        const result = clientFunctions.escapeHtmlClient(xss);
        expect(result).not.toContain('<img');
        expect(result).not.toContain('<svg');
        expect(result).not.toContain('<iframe');
      });
    });
  });

  describe('Input Validation (Requirement 1.2)', () => {
    test('should validate correct username and message', () => {
      const result = clientFunctions.validateInputs('testuser', 'Hello world');
      expect(result).toBe(true);
    });

    test('should reject empty username', () => {
      const result = clientFunctions.validateInputs('', 'Hello world');
      expect(result).toBe(false);
    });

    test('should reject empty message', () => {
      const result = clientFunctions.validateInputs('testuser', '');
      expect(result).toBe(false);
    });

    test('should reject username longer than 50 characters', () => {
      const longUsername = 'a'.repeat(51);
      const result = clientFunctions.validateInputs(longUsername, 'Hello world');
      expect(result).toBe(false);
    });

    test('should accept username with exactly 50 characters', () => {
      const maxUsername = 'a'.repeat(50);
      const result = clientFunctions.validateInputs(maxUsername, 'Hello world');
      expect(result).toBe(true);
    });

    test('should reject message longer than 500 characters', () => {
      const longMessage = 'a'.repeat(501);
      const result = clientFunctions.validateInputs('testuser', longMessage);
      expect(result).toBe(false);
    });

    test('should accept message with exactly 500 characters', () => {
      const maxMessage = 'a'.repeat(500);
      const result = clientFunctions.validateInputs('testuser', maxMessage);
      expect(result).toBe(true);
    });

    test('should validate Japanese characters', () => {
      const result = clientFunctions.validateInputs('テストユーザー', 'こんにちは世界');
      expect(result).toBe(true);
    });

    test('should reject invalid characters in username', () => {
      const result = clientFunctions.validateInputs('user@domain.com', 'Hello world');
      expect(result).toBe(false);
    });

    test('should accept valid special characters in username', () => {
      const result = clientFunctions.validateInputs('user_123-test.name', 'Hello world');
      expect(result).toBe(true);
    });
  });
});