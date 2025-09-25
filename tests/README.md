# SSE Chat App - Test Suite

## Overview

This test suite provides comprehensive testing for the SSE Chat App, covering all basic functionality requirements and multi-client scenarios.

## Test Structure

### 1. Server Tests (`server.test.js`)
Tests the backend functionality including:
- **Message Sending and Receiving** (Requirement 1.2)
  - Valid message processing
  - Message storage in memory
  - Multiple message handling
- **Empty Message Prevention** (Requirement 1.2)
  - Empty message rejection
  - Whitespace-only message rejection
  - Missing field validation
- **HTML Escaping for XSS Protection** (Requirements 1.4, 5.1)
  - HTML tag escaping in messages
  - Multiple HTML entity escaping
  - Complex XSS attempt handling
- **Input Validation**
  - Message length limits (500 characters)
  - Username length limits (50 characters)
  - Invalid JSON handling
  - Data type validation
- **Message Storage and Limits**
  - 100 message history limit
- **Error Handling**
  - Missing request body handling
  - Empty request body handling

### 2. Client Tests (`client.test.js`)
Tests the frontend functionality including:
- **HTML Escaping Client-side** (Requirements 1.4, 5.1)
  - HTML tag escaping
  - HTML entity escaping
  - Null/undefined handling
  - Complex XSS attempt prevention
- **Input Validation** (Requirement 1.2)
  - Username and message validation
  - Length limit enforcement
  - Japanese character support
  - Special character validation

### 3. Integration Tests (`integration.test.js`)
Tests multi-client scenarios including:
- **Multiple Client Connection Management** (Requirement 2.4)
  - Client connection tracking
  - Message broadcasting to multiple clients
  - Broadcast validation with client count
- **SSE Connection Management** (Requirement 4.2)
  - Connection status information
  - Concurrent message sending
  - Message storage limits
  - Broadcast failure scenarios
- **Message Broadcasting Functionality** (Requirement 2.4)
  - Proper message format for broadcasting
  - HTML escaping in broadcast messages
  - Rapid message broadcasting
- **Error Handling in Multi-Client Environment**
  - Invalid message handling
  - System stability under error conditions

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Test Coverage

The test suite covers:
- ✅ Message sending/receiving basic flow
- ✅ Empty message prevention
- ✅ HTML escaping for XSS protection
- ✅ Multiple client connection handling
- ✅ Message broadcasting functionality
- ✅ SSE connection management
- ✅ Input validation
- ✅ Error handling
- ✅ Concurrent operations
- ✅ System stability under load

## Requirements Mapping

| Requirement | Test Coverage |
|-------------|---------------|
| 1.2 - Message sending and empty prevention | ✅ server.test.js, client.test.js |
| 1.4 - XSS protection via HTML escaping | ✅ server.test.js, client.test.js, integration.test.js |
| 2.4 - Multiple client broadcasting | ✅ integration.test.js |
| 4.2 - Concurrent connection support | ✅ integration.test.js |
| 5.1 - Security (HTML escaping) | ✅ All test files |

## Test Statistics

- **Total Tests**: 66
- **Test Suites**: 3
- **Coverage Areas**: Server-side logic, Client-side logic, Integration scenarios
- **Requirements Covered**: 1.2, 1.4, 2.4, 4.2, 5.1

## Notes

- Tests use isolated test server instances to avoid interference
- Client-side tests use JSDOM for DOM simulation
- Integration tests focus on multi-client scenarios without actual SSE connections for reliability
- All XSS prevention mechanisms are thoroughly tested
- Error handling is tested for both single and multi-client scenarios