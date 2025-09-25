/**
 * Responsive Design Tests for SSE Chat App
 * Tests CSS media queries and responsive behavior
 * Task 11: レスポンシブデザインの動作確認
 * Requirements: 3.2
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

describe('SSE Chat App - Responsive Design Tests', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    // Read the actual HTML and CSS files
    const htmlContent = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
    const cssContent = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');

    // Create DOM with the actual HTML
    dom = new JSDOM(htmlContent, {
      url: 'http://localhost:8000',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;

    // Inject CSS into the document
    const styleElement = document.createElement('style');
    styleElement.textContent = cssContent;
    document.head.appendChild(styleElement);

    // Mock window.matchMedia for media query testing
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  describe('HTML構造テスト (HTML Structure Tests)', () => {
    test('should have proper viewport meta tag for mobile', () => {
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      expect(viewportMeta).toBeTruthy();
      expect(viewportMeta.getAttribute('content')).toContain('width=device-width');
      expect(viewportMeta.getAttribute('content')).toContain('initial-scale=1.0');
    });

    test('should have all required responsive elements', () => {
      // Check for main container
      const container = document.querySelector('.container');
      expect(container).toBeTruthy();

      // Check for messages container
      const messagesContainer = document.querySelector('#messages');
      expect(messagesContainer).toBeTruthy();
      expect(messagesContainer.classList.contains('messages-container')).toBe(true);

      // Check for form elements
      const chatForm = document.querySelector('#chatForm');
      expect(chatForm).toBeTruthy();
      expect(chatForm.classList.contains('chat-form')).toBe(true);

      // Check for input elements
      const usernameInput = document.querySelector('#username');
      const messageInput = document.querySelector('#messageInput');
      const sendButton = document.querySelector('#sendButton');

      expect(usernameInput).toBeTruthy();
      expect(messageInput).toBeTruthy();
      expect(sendButton).toBeTruthy();
    });

    test('should have proper semantic HTML structure', () => {
      // Check for header
      const header = document.querySelector('header');
      expect(header).toBeTruthy();

      // Check for main content area
      const main = document.querySelector('main');
      expect(main).toBeTruthy();

      // Check for form structure
      const form = document.querySelector('form');
      expect(form).toBeTruthy();

      // Check for proper input labels
      const labels = document.querySelectorAll('label');
      expect(labels.length).toBeGreaterThan(0);

      // Verify label-input associations
      labels.forEach(label => {
        const forAttribute = label.getAttribute('for');
        if (forAttribute) {
          const associatedInput = document.querySelector(`#${forAttribute}`);
          expect(associatedInput).toBeTruthy();
        }
      });
    });
  });

  describe('CSSレスポンシブ機能テスト (CSS Responsive Features Tests)', () => {
    test('should have mobile-first responsive CSS structure', () => {
      const styleElement = document.querySelector('style');
      const cssText = styleElement.textContent;

      // Check for mobile media queries
      expect(cssText).toContain('@media (max-width: 768px)');
      expect(cssText).toContain('@media (max-width: 480px)');
      expect(cssText).toContain('@media (max-width: 320px)');

      // Check for responsive container styles
      expect(cssText).toContain('.container');
      expect(cssText).toContain('max-width');
      expect(cssText).toContain('margin: 0 auto');

      // Check for flexible layout properties
      expect(cssText).toContain('display: flex');
      expect(cssText).toContain('flex-direction: column');
    });

    test('should have proper responsive typography', () => {
      const styleElement = document.querySelector('style');
      const cssText = styleElement.textContent;

      // Check for responsive font sizes
      expect(cssText).toMatch(/font-size:\s*2rem/); // Desktop header
      expect(cssText).toMatch(/font-size:\s*1\.75rem/); // Tablet header
      expect(cssText).toMatch(/font-size:\s*1\.5rem/); // Mobile header

      // Check for responsive line heights
      expect(cssText).toContain('line-height');
    });

    test('should have responsive spacing and layout', () => {
      const styleElement = document.querySelector('style');
      const cssText = styleElement.textContent;

      // Check for responsive padding
      expect(cssText).toMatch(/padding:\s*20px/); // Desktop
      expect(cssText).toMatch(/padding:\s*16px/); // Tablet
      expect(cssText).toMatch(/padding:\s*12px/); // Mobile

      // Check for responsive margins
      expect(cssText).toMatch(/margin-bottom:\s*30px/); // Desktop
      expect(cssText).toMatch(/margin-bottom:\s*20px/); // Tablet
      expect(cssText).toMatch(/margin-bottom:\s*16px/); // Mobile
    });

    test('should have responsive message container', () => {
      const styleElement = document.querySelector('style');
      const cssText = styleElement.textContent;

      // Check for responsive message container heights
      expect(cssText).toMatch(/min-height:\s*400px/); // Desktop
      expect(cssText).toMatch(/min-height:\s*300px/); // Tablet
      expect(cssText).toMatch(/min-height:\s*250px/); // Mobile
      expect(cssText).toMatch(/min-height:\s*200px/); // Small mobile

      // Check for responsive max heights
      expect(cssText).toMatch(/max-height:\s*500px/); // Desktop
      expect(cssText).toMatch(/max-height:\s*400px/); // Tablet
      expect(cssText).toMatch(/max-height:\s*350px/); // Mobile
    });
  });

  describe('アクセシビリティ機能テスト (Accessibility Features Tests)', () => {
    test('should have accessibility-friendly CSS', () => {
      const styleElement = document.querySelector('style');
      const cssText = styleElement.textContent;

      // Check for high contrast mode support
      expect(cssText).toContain('@media (prefers-contrast: high)');

      // Check for reduced motion support
      expect(cssText).toContain('@media (prefers-reduced-motion: reduce)');

      // Check for focus-visible styles
      expect(cssText).toContain(':focus-visible');

      // Check for proper focus indicators
      expect(cssText).toContain('outline:');
    });

    test('should have proper ARIA attributes in HTML', () => {
      // Check for form accessibility
      const form = document.querySelector('form');
      expect(form).toBeTruthy();

      // Check for input labels
      const inputs = document.querySelectorAll('input');
      inputs.forEach(input => {
        const id = input.getAttribute('id');
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          expect(label).toBeTruthy();
        }
      });

      // Check for required attributes
      const requiredInputs = document.querySelectorAll('input[required]');
      expect(requiredInputs.length).toBeGreaterThan(0);
    });

    test('should have semantic HTML elements', () => {
      // Check for semantic elements
      expect(document.querySelector('header')).toBeTruthy();
      expect(document.querySelector('main')).toBeTruthy();
      expect(document.querySelector('form')).toBeTruthy();

      // Check for proper heading hierarchy
      const h1 = document.querySelector('h1');
      expect(h1).toBeTruthy();
      expect(h1.textContent).toContain('リアルタイムチャット');
    });
  });

  describe('レスポンシブレイアウトテスト (Responsive Layout Tests)', () => {
    test('should have flexible container layout', () => {
      const container = document.querySelector('.container');
      expect(container).toBeTruthy();

      // Simulate different screen sizes by checking CSS
      const styleElement = document.querySelector('style');
      const cssText = styleElement.textContent;

      // Check that container has responsive properties
      expect(cssText).toMatch(/\.container\s*{[^}]*max-width:\s*800px/);
      expect(cssText).toMatch(/\.container\s*{[^}]*margin:\s*0 auto/);
    });

    test('should have responsive form layout', () => {
      const form = document.querySelector('#chatForm');
      expect(form).toBeTruthy();

      const styleElement = document.querySelector('style');
      const cssText = styleElement.textContent;

      // Check for responsive form styles
      expect(cssText).toContain('.chat-form');
      expect(cssText).toContain('.input-group');

      // Check for responsive input styles
      expect(cssText).toMatch(/width:\s*100%/);
    });

    test('should have responsive message display', () => {
      const messagesContainer = document.querySelector('#messages');
      expect(messagesContainer).toBeTruthy();

      const styleElement = document.querySelector('style');
      const cssText = styleElement.textContent;

      // Check for responsive message styles
      expect(cssText).toContain('.message');
      expect(cssText).toContain('.message-header');
      expect(cssText).toContain('.message-content');

      // Check for responsive message header layout
      expect(cssText).toMatch(/@media \(max-width: 480px\)[^}]*\.message-header[^}]*flex-direction:\s*column/);
    });
  });

  describe('モバイル最適化テスト (Mobile Optimization Tests)', () => {
    test('should have touch-friendly button sizes', () => {
      const sendButton = document.querySelector('#sendButton');
      expect(sendButton).toBeTruthy();

      const styleElement = document.querySelector('style');
      const cssText = styleElement.textContent;

      // Check for adequate button padding for touch
      expect(cssText).toMatch(/\.send-button[^}]*padding:\s*12px/);
    });

    test('should have mobile-optimized input fields', () => {
      const inputs = document.querySelectorAll('input');
      expect(inputs.length).toBeGreaterThan(0);

      inputs.forEach(input => {
        // Check for mobile-friendly attributes
        expect(input.getAttribute('maxlength')).toBeTruthy();
      });

      const styleElement = document.querySelector('style');
      const cssText = styleElement.textContent;

      // Check for mobile input styling
      expect(cssText).toMatch(/\.input-group input[^}]*padding:\s*12px/);
    });

    test('should have proper mobile scrolling', () => {
      const messagesContainer = document.querySelector('#messages');
      expect(messagesContainer).toBeTruthy();

      const styleElement = document.querySelector('style');
      const cssText = styleElement.textContent;

      // Check for scrollbar styling
      expect(cssText).toContain('::-webkit-scrollbar');
      expect(cssText).toContain('overflow-y: auto');
    });
  });

  describe('CSS Grid/Flexbox レスポンシブテスト (CSS Grid/Flexbox Responsive Tests)', () => {
    test('should use flexbox for responsive layout', () => {
      const styleElement = document.querySelector('style');
      const cssText = styleElement.textContent;

      // Check for flexbox usage
      expect(cssText).toContain('display: flex');
      expect(cssText).toContain('flex-direction: column');
      expect(cssText).toContain('flex: 1');

      // Check for responsive flex properties
      expect(cssText).toMatch(/justify-content/);
      expect(cssText).toMatch(/align-items/);
    });

    test('should have responsive gap and spacing', () => {
      const styleElement = document.querySelector('style');
      const cssText = styleElement.textContent;

      // Check for responsive gaps
      expect(cssText).toMatch(/gap:\s*20px/); // Desktop
      expect(cssText).toMatch(/gap:\s*16px/); // Mobile

      // Check for responsive margins and padding
      expect(cssText).toMatch(/margin-bottom:\s*\d+px/);
      expect(cssText).toMatch(/padding:\s*\d+px/);
    });
  });

  describe('エラー表示レスポンシブテスト (Error Display Responsive Tests)', () => {
    test('should have responsive error message styles', () => {
      const styleElement = document.querySelector('style');
      const cssText = styleElement.textContent;

      // Check for error message responsive styles
      expect(cssText).toContain('.message-notification');
      expect(cssText).toContain('.validation-errors');

      // Check for mobile error message adjustments
      expect(cssText).toMatch(/@media \(max-width: 480px\)[^}]*\.message-notification[^}]*padding:\s*10px/);
      expect(cssText).toMatch(/@media \(max-width: 480px\)[^}]*\.validation-errors[^}]*padding:\s*12px/);
    });

    test('should have responsive connection status', () => {
      const styleElement = document.querySelector('style');
      const cssText = styleElement.textContent;

      // Check for connection status responsive styles
      expect(cssText).toContain('.connection-status');

      // Check for mobile connection status adjustments
      expect(cssText).toMatch(/@media \(max-width: 480px\)[^}]*\.connection-status[^}]*padding:\s*6px/);
    });
  });
});