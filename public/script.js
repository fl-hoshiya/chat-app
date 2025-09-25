// SSE Chat App - Frontend JavaScript Implementation

// Global variables
let eventSource = null;
let isConnected = false;

// DOM elements
const messagesContainer = document.getElementById('messages');
const chatForm = document.getElementById('chatForm');
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadMessageHistory();
    initializeSSEConnection();
    initializeEventHandlers();
});

/**
 * Load message history from database
 * Implements persistent message storage functionality
 */
async function loadMessageHistory() {
    try {
        console.log('[History] Loading message history...');
        
        const response = await fetch('/messages/recent?limit=50');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.messages) {
            console.log(`[History] Loaded ${data.messages.length} messages from history`);
            
            // Display historical messages
            data.messages.forEach(message => {
                displayMessage(message);
            });
            
            // Show loading indicator
            if (data.messages.length > 0) {
                showSuccessMessage(`${data.messages.length}件の過去のメッセージを読み込みました`);
            }
        }
        
    } catch (error) {
        console.error('[History] Failed to load message history:', error);
        showErrorMessage('過去のメッセージの読み込みに失敗しました。新しいメッセージは正常に表示されます。', 'warning');
    }
}

/**
 * Initialize SSE connection to the server
 * Implements requirement 2.1: SSE-based real-time message delivery
 * Implements requirement 6.2: Frontend uses HTML + CSS + Vanilla JavaScript
 * Implements requirement 4.3: SSE connection error handling
 */
function initializeSSEConnection() {
    try {
        // Close existing connection if any
        if (eventSource) {
            eventSource.close();
        }

        // Create EventSource connection to /events endpoint
        eventSource = new EventSource('/events');
        
        // Handle successful connection
        eventSource.onopen = function(event) {
            console.log('[SSE] Connection established successfully');
            isConnected = true;
            updateConnectionStatus(true);
            clearErrorMessages();
        };
        
        // Handle incoming messages
        eventSource.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                handleIncomingMessage(data);
            } catch (error) {
                console.error('[SSE] Error parsing message:', error);
                showErrorMessage('メッセージの解析に失敗しました。データが破損している可能性があります。');
            }
        };
        
        // Handle connection errors
        eventSource.onerror = function(event) {
            console.error('[SSE] Connection error occurred:', event);
            isConnected = false;
            updateConnectionStatus(false);
            
            // Determine error type and show appropriate message
            if (eventSource.readyState === EventSource.CONNECTING) {
                console.log('[SSE] Attempting to reconnect...');
                showErrorMessage('サーバーへの接続を試行中です...', 'warning');
            } else if (eventSource.readyState === EventSource.CLOSED) {
                console.error('[SSE] Connection closed unexpectedly');
                showErrorMessage('サーバーとの接続が切断されました。自動的に再接続を試行します。', 'error');
                
                // Attempt to reconnect after a delay
                setTimeout(() => {
                    console.log('[SSE] Attempting automatic reconnection...');
                    initializeSSEConnection();
                }, 3000);
            }
        };
        
    } catch (error) {
        console.error('[SSE] Failed to initialize connection:', error);
        isConnected = false;
        updateConnectionStatus(false);
        showErrorMessage('サーバーへの接続を開始できませんでした。ページを再読み込みしてください。', 'error');
    }
}

/**
 * Handle incoming SSE messages
 * Implements requirement 2.1: Real-time message reception via SSE
 */
function handleIncomingMessage(data) {
    switch (data.type) {
        case 'connected':
            console.log('Connected to server with client ID:', data.clientId);
            break;
            
        case 'message':
            displayMessage(data.data);
            break;
            
        default:
            console.log('Unknown message type:', data.type);
    }
}

/**
 * Update connection status indicator
 */
function updateConnectionStatus(connected) {
    // This will be implemented in subtask 7.3 for UI updates
    if (connected) {
        console.log('✅ Connected to chat server');
    } else {
        console.log('❌ Disconnected from chat server');
    }
}
/**
 
* Initialize event handlers for form submission and user interactions
 * Implements requirement 1.1: Message sending when user clicks send button
 * Implements requirement 1.2: Prevent sending empty messages
 * Implements requirement 1.3: Clear input field after sending
 */
function initializeEventHandlers() {
    // Handle form submission
    chatForm.addEventListener('submit', handleFormSubmit);
    
    // Handle Enter key in message input
    messageInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleFormSubmit(event);
        }
    });
    
    // Real-time validation for empty message prevention
    messageInput.addEventListener('input', validateMessageInput);
    usernameInput.addEventListener('input', validateUsernameInput);
}

/**
 * Handle form submission for sending messages
 * Implements requirement 1.1: Message sending functionality
 * Implements requirement 1.2: Empty message prevention
 * Implements requirement 1.3: Input field clearing after send
 * Implements requirement 4.3: Message sending error handling
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const username = usernameInput.value.trim();
    const message = messageInput.value.trim();
    
    // Clear any existing error messages
    clearErrorMessages();
    
    // Validate inputs before sending
    if (!validateInputs(username, message)) {
        return;
    }
    
    // Check if connected to server
    if (!isConnected) {
        showErrorMessage('サーバーに接続されていません。接続を確認してから再試行してください。', 'warning');
        return;
    }
    
    // Disable send button to prevent double submission
    sendButton.disabled = true;
    const originalButtonText = sendButton.textContent;
    sendButton.textContent = '送信中...';
    
    try {
        await sendMessage(username, message);
        
        // Clear message input after successful send (requirement 1.3)
        messageInput.value = '';
        messageInput.focus();
        updateCharacterCount();
        
        // Show success feedback briefly
        showSuccessMessage('メッセージを送信しました');
        
    } catch (error) {
        console.error('[Form] Failed to send message:', error);
        
        // Show specific error message based on error type
        if (error.details && error.details.length > 0) {
            showValidationErrors(error.details);
        } else {
            showErrorMessage(error.message || 'メッセージの送信に失敗しました。もう一度お試しください。', 'error');
        }
        
        // Focus back to message input for retry
        messageInput.focus();
        
    } finally {
        // Re-enable send button
        sendButton.disabled = false;
        sendButton.textContent = originalButtonText;
    }
}

/**
 * Send message to server using fetch API
 * Implements requirement 1.1: Message transmission to server
 * Implements requirement 4.3: Message sending error handling
 */
async function sendMessage(username, message) {
    try {
        const response = await fetch('/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                message: message
            }),
            // Add timeout to prevent hanging requests
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (!response.ok) {
            let errorMessage = 'メッセージの送信に失敗しました';
            let errorDetails = [];
            
            try {
                const errorData = await response.json();
                
                // Handle different error status codes
                switch (response.status) {
                    case 400:
                        errorMessage = '入力データに問題があります';
                        if (errorData.details && Array.isArray(errorData.details)) {
                            errorDetails = errorData.details;
                        }
                        break;
                    case 413:
                        errorMessage = 'メッセージが大きすぎます';
                        break;
                    case 429:
                        errorMessage = '送信頻度が高すぎます。しばらく待ってから再試行してください';
                        break;
                    case 500:
                        errorMessage = 'サーバーエラーが発生しました。しばらく待ってから再試行してください';
                        break;
                    default:
                        errorMessage = `サーバーエラー (${response.status}): ${errorData.message || 'Unknown error'}`;
                }
                
                console.error('[API] Server error response:', errorData);
            } catch (parseError) {
                console.error('[API] Failed to parse error response:', parseError);
                errorMessage = `HTTP ${response.status}: サーバーからの応答を解析できませんでした`;
            }
            
            const error = new Error(errorMessage);
            error.status = response.status;
            error.details = errorDetails;
            throw error;
        }
        
        const result = await response.json();
        console.log('[API] Message sent successfully:', result);
        return result;
        
    } catch (error) {
        // Handle network errors, timeouts, and other fetch failures
        if (error.name === 'AbortError') {
            console.error('[API] Request timeout');
            throw new Error('リクエストがタイムアウトしました。ネットワーク接続を確認してください。');
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error('[API] Network error:', error);
            throw new Error('ネットワークエラーが発生しました。インターネット接続を確認してください。');
        } else {
            // Re-throw the error if it's already a handled error
            throw error;
        }
    }
}

/**
 * Validate inputs before sending message
 * Implements requirement 1.2: Empty message prevention
 * Implements requirement 4.3: Input validation error display
 */
function validateInputs(username, message) {
    const errors = [];
    
    // Validate username
    if (!username || username.length === 0) {
        errors.push('ユーザー名を入力してください');
        highlightInputError(usernameInput);
    } else if (username.length > 50) {
        errors.push('ユーザー名は50文字以内で入力してください');
        highlightInputError(usernameInput);
    } else if (!/^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s\-_\.]+$/.test(username)) {
        errors.push('ユーザー名に使用できない文字が含まれています');
        highlightInputError(usernameInput);
    } else {
        clearInputError(usernameInput);
    }
    
    // Validate message
    if (!message || message.length === 0) {
        errors.push('メッセージを入力してください');
        highlightInputError(messageInput);
    } else if (message.length > 500) {
        errors.push('メッセージは500文字以内で入力してください');
        highlightInputError(messageInput);
    } else {
        clearInputError(messageInput);
    }
    
    if (errors.length > 0) {
        showValidationErrors(errors);
        return false;
    }
    
    return true;
}

/**
 * Real-time validation for message input
 * Implements requirement 1.2: Empty message prevention
 * Implements requirement 4.3: Real-time input validation
 */
function validateMessageInput() {
    const message = messageInput.value;
    const trimmedMessage = message.trim();
    const isValid = trimmedMessage.length > 0 && message.length <= 500;
    
    // Update send button state
    updateSendButtonState();
    
    // Update character count display
    updateCharacterCount();
    
    // Clear error styling if input becomes valid
    if (isValid || message.length === 0) {
        clearInputError(messageInput);
    }
}

/**
 * Real-time validation for username input
 * Implements requirement 4.3: Real-time input validation
 */
function validateUsernameInput() {
    const username = usernameInput.value;
    const trimmedUsername = username.trim();
    const isValidLength = trimmedUsername.length > 0 && username.length <= 50;
    const isValidFormat = /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s\-_\.]*$/.test(username);
    const isValid = isValidLength && isValidFormat;
    
    // Update send button state
    updateSendButtonState();
    
    // Clear error styling if input becomes valid
    if (isValid || username.length === 0) {
        clearInputError(usernameInput);
    }
}

/**
 * Update send button state based on all validation criteria
 */
function updateSendButtonState() {
    const username = usernameInput.value.trim();
    const message = messageInput.value.trim();
    
    const isUsernameValid = username.length > 0 && 
                           username.length <= 50 && 
                           /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s\-_\.]+$/.test(username);
    
    const isMessageValid = message.length > 0 && messageInput.value.length <= 500;
    
    const isConnected = eventSource && eventSource.readyState === EventSource.OPEN;
    
    sendButton.disabled = !isUsernameValid || !isMessageValid || !isConnected;
}

/**
 * Update character count for message input
 */
function updateCharacterCount() {
    const currentLength = messageInput.value.length;
    const maxLength = 500;
    
    // This will be enhanced in subtask 7.3 for UI updates
    if (currentLength > maxLength * 0.9) {
        console.log(`文字数: ${currentLength}/${maxLength}`);
    }
}

/**
 * Show error message to user
 */
function showErrorMessage(message) {
    // Simple alert for now - will be enhanced in subtask 7.3
    alert(message);
}/**
 * D
isplay received message in the UI
 * Implements requirement 2.2: Automatic message list updates
 * Implements requirement 2.3: Display own messages in message list
 * Implements requirement 5.2: Display sanitized safe content only
 */
function displayMessage(messageData) {
    try {
        // Validate message data structure
        if (!messageData || typeof messageData !== 'object') {
            console.error('[Display] Invalid message data:', messageData);
            return;
        }
        
        if (!messageData.id || !messageData.username || !messageData.message || !messageData.timestamp) {
            console.error('[Display] Missing required message fields:', messageData);
            return;
        }
        
        // Check for duplicate messages
        const existingMessage = document.querySelector(`[data-message-id="${messageData.id}"]`);
        if (existingMessage) {
            console.warn('[Display] Duplicate message ignored:', messageData.id);
            return;
        }
        
        const messageElement = createMessageElement(messageData);
        messagesContainer.appendChild(messageElement);
        
        // Auto-scroll to latest message (requirement 2.2)
        scrollToLatestMessage();
        
    } catch (error) {
        console.error('[Display] Error displaying message:', error);
        console.error('[Display] Message data:', messageData);
    }
}

/**
 * Create DOM element for a message
 * Implements requirement 5.2: HTML escaping on client side
 * Implements requirement 3.4: Display username with messages
 */
function createMessageElement(messageData) {
    try {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.setAttribute('data-message-id', messageData.id);
        
        // Create username element with safe fallback
        const usernameSpan = document.createElement('span');
        usernameSpan.className = 'message-username';
        usernameSpan.textContent = escapeHtmlClient(messageData.username || '匿名');
        
        // Create timestamp element with safe fallback
        const timestampSpan = document.createElement('span');
        timestampSpan.className = 'message-timestamp';
        try {
            timestampSpan.textContent = formatTimestamp(messageData.timestamp);
        } catch (timestampError) {
            console.warn('[Display] Invalid timestamp:', messageData.timestamp);
            timestampSpan.textContent = '時刻不明';
        }
        
        // Create message content element with safe fallback
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = escapeHtmlClient(messageData.message || '[メッセージが空です]');
        
        // Create header with username and timestamp
        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';
        headerDiv.appendChild(usernameSpan);
        headerDiv.appendChild(timestampSpan);
        
        // Assemble the complete message element
        messageDiv.appendChild(headerDiv);
        messageDiv.appendChild(contentDiv);
        
        return messageDiv;
        
    } catch (error) {
        console.error('[Display] Error creating message element:', error);
        
        // Return a fallback error message element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message message-error';
        errorDiv.textContent = 'メッセージの表示でエラーが発生しました';
        return errorDiv;
    }
}

/**
 * Client-side HTML escaping for XSS protection
 * Implements requirement 5.2: Client-side HTML escaping
 * Implements requirement 4.3: Safe text processing with error handling
 */
function escapeHtmlClient(text) {
    try {
        // Handle null, undefined, or non-string inputs
        if (text === null || text === undefined) {
            return '';
        }
        
        // Convert to string if not already
        const stringText = String(text);
        
        const div = document.createElement('div');
        div.textContent = stringText;
        return div.innerHTML;
        
    } catch (error) {
        console.error('[Security] Error escaping HTML:', error);
        // Return empty string as safe fallback
        return '';
    }
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If message is from today, show only time
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // If message is from this year, show month/day and time
    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleString('ja-JP', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // For older messages, show full date and time
    return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Auto-scroll to the latest message
 * Implements requirement 2.2: Automatic message list updates with scroll
 */
function scrollToLatestMessage() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Enhanced connection status update with UI feedback
 * Implements visual feedback for connection status
 */
function updateConnectionStatus(connected) {
    // Create or update status indicator
    let statusIndicator = document.getElementById('connection-status');
    
    if (!statusIndicator) {
        statusIndicator = document.createElement('div');
        statusIndicator.id = 'connection-status';
        statusIndicator.className = 'connection-status';
        
        // Insert at the top of the container
        const container = document.querySelector('.container');
        container.insertBefore(statusIndicator, container.firstChild);
    }
    
    if (connected) {
        statusIndicator.textContent = '✅ サーバーに接続中';
        statusIndicator.className = 'connection-status connected';
        console.log('✅ Connected to chat server');
    } else {
        statusIndicator.textContent = '❌ サーバーとの接続が切断されました';
        statusIndicator.className = 'connection-status disconnected';
        console.log('❌ Disconnected from chat server');
    }
}

/**
 * Enhanced error message display with better UI
 * Implements requirement 4.3: Error message display functionality
 */
function showErrorMessage(message, type = 'error') {
    // Remove any existing error messages first
    clearErrorMessages();
    
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = `message-notification ${type}`;
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'polite');
    
    // Create message content
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    errorDiv.appendChild(messageSpan);
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'エラーメッセージを閉じる');
    closeButton.onclick = () => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    };
    errorDiv.appendChild(closeButton);
    
    // Insert error message above the form
    chatForm.parentNode.insertBefore(errorDiv, chatForm);
    
    // Auto-remove error message after appropriate time based on type
    const autoRemoveTime = type === 'warning' ? 7000 : 10000;
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, autoRemoveTime);
    
    // Log to console with appropriate level
    if (type === 'error') {
        console.error('[UI] Error:', message);
    } else if (type === 'warning') {
        console.warn('[UI] Warning:', message);
    } else {
        console.log('[UI] Info:', message);
    }
}

/**
 * Show validation errors with specific styling
 * Implements requirement 4.3: Input validation error display
 */
function showValidationErrors(errors) {
    // Remove any existing error messages first
    clearErrorMessages();
    
    // Create validation error container
    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-errors';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'polite');
    
    // Create title
    const title = document.createElement('div');
    title.className = 'validation-title';
    title.textContent = '入力エラー:';
    errorDiv.appendChild(title);
    
    // Create error list
    const errorList = document.createElement('ul');
    errors.forEach(error => {
        const listItem = document.createElement('li');
        listItem.textContent = error;
        errorList.appendChild(listItem);
    });
    errorDiv.appendChild(errorList);
    
    // Insert above the form
    chatForm.parentNode.insertBefore(errorDiv, chatForm);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 8000);
    
    console.warn('[UI] Validation errors:', errors);
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'message-notification success';
    successDiv.setAttribute('role', 'status');
    successDiv.setAttribute('aria-live', 'polite');
    successDiv.textContent = message;
    
    // Insert above the form
    chatForm.parentNode.insertBefore(successDiv, chatForm);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
    
    console.log('[UI] Success:', message);
}

/**
 * Clear all error and notification messages
 */
function clearErrorMessages() {
    const notifications = document.querySelectorAll('.message-notification, .validation-errors');
    notifications.forEach(notification => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });
}

/**
 * Highlight input field with error styling
 */
function highlightInputError(inputElement) {
    inputElement.classList.add('input-error');
    
    // Remove error styling when user starts typing
    const removeErrorStyling = () => {
        inputElement.classList.remove('input-error');
        inputElement.removeEventListener('input', removeErrorStyling);
    };
    
    inputElement.addEventListener('input', removeErrorStyling);
}

/**
 * Clear input error styling
 */
function clearInputError(inputElement) {
    inputElement.classList.remove('input-error');
}

/**
 * Enhanced character count display
 */
function updateCharacterCount() {
    const currentLength = messageInput.value.length;
    const maxLength = 500;
    
    // Create or update character counter
    let charCounter = document.getElementById('char-counter');
    
    if (!charCounter) {
        charCounter = document.createElement('div');
        charCounter.id = 'char-counter';
        charCounter.className = 'char-counter';
        
        // Insert after message input
        messageInput.parentNode.appendChild(charCounter);
    }
    
    charCounter.textContent = `${currentLength}/${maxLength}`;
    
    // Change color when approaching limit
    if (currentLength > maxLength * 0.9) {
        charCounter.className = 'char-counter warning';
    } else if (currentLength > maxLength * 0.8) {
        charCounter.className = 'char-counter caution';
    } else {
        charCounter.className = 'char-counter';
    }
}

/**
 * Username persistence functionality
 * Implements requirement 3.4: Username setting functionality
 */
function initializeUsernamePersistence() {
    // Load saved username from localStorage
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername) {
        usernameInput.value = savedUsername;
    }
    
    // Save username when it changes
    usernameInput.addEventListener('blur', function() {
        const username = usernameInput.value.trim();
        if (username) {
            localStorage.setItem('chatUsername', username);
        }
    });
}

// Initialize username persistence when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeUsernamePersistence();
});

/**
 * Clean up resources when page is unloaded
 */
window.addEventListener('beforeunload', function() {
    if (eventSource) {
        eventSource.close();
    }
});