# Task INFRA-001: Core IDE Integration - Research

## 1. Research Summary

Comprehensive research has been completed and documented in `context-engine/intake/Gemini CLI VS Code Integration Guide.md`. This research revealed that the integration is significantly more complex than initially anticipated, requiring sophisticated authentication flows, stateful CLI interaction patterns, and advanced VS Code extension architecture.

## 2. Key Research Findings

### 2.1. VS Code Fork and Extension Integration

*   **Source**: Comprehensive technical analysis in the integration guide
*   **Approach**: VS Code fork is feasible using existing VSCodium patterns
*   **Build Process**: Cline can be integrated as built-in extension by copying to `extensions/` directory and adding to `gulpfile.extensions.js`
*   **Branding**: Publisher must be changed to "vscode" for built-in compatibility
*   **Architecture**: Extension bundling requires proper TypeScript compilation and dependency management

### 2.2. Cline Extension Architecture (Detailed Analysis)

*   **Source**: Direct code analysis and integration guide research
*   **ApiHandler Interface**: Core abstraction in `src/core/api/index.ts` with standardized `createMessage()` method
*   **Provider Registry**: Factory pattern in `createHandlerForProvider()` function supports 30+ providers
*   **Streaming Architecture**: Uses `ApiStream` with `ApiStreamChunk` types for real-time output processing
*   **Configuration System**: Hierarchical settings via `ApiConfiguration` interface with mode-specific options
*   **Authentication Integration**: Native support for VS Code's `AuthenticationProvider` pattern

### 2.3. Gemini CLI Integration Strategy (Completely Revised)

*   **Critical Discovery**: Gemini CLI is a **stateful agent** with ReAct (Reason and Act) loops, not a simple command-line tool
*   **Architecture Implications**:
    *   CLI engages in conversational, multi-turn interactions with reasoning phases
    *   Output includes model's internal monologue, tool calls, and user confirmation requests
    *   Requires sophisticated state machine to parse structured conversational output
    *   UI must render "thought process" and allow user approval of actions
*   **Implementation Strategy**:
    *   Use `child_process.spawn` for persistent, stateful process management
    *   Implement streaming output parser for different ReAct loop phases
    *   Support both interactive mode and `--json` flag for structured output
    *   Handle CLI's comprehensive command structure including slash commands

### 2.4. Authentication Architecture (New Research Area)

*   **OAuth 2.0 Flow**: Browser-based consent with local server redirect handling using `google-auth-library`
*   **VS Code Integration**: Use native `AuthenticationProvider` interface for consistent, secure UX
*   **Multi-Method Support**: Credential resolution order: VS Code session → Environment variable → Google Cloud ADC → OAuth flow
*   **Secure Storage**: VS Code's `SecretStorage` API with OS-native keychain integration (Keychain/Credential Manager/Keyring)
*   **User Experience**: Lazy authentication with clear status indication via StatusBarItem

### 2.5. Production Considerations (New Research Area)

*   **Error Handling**: Comprehensive HTTP error code mapping (400, 403, 429, 500, 503) with user-friendly responses
*   **Logging Strategy**: Correlation IDs across process boundaries for debugging multi-process architecture
*   **Update Management**: CLI version checking with automated dependency updates via integrated terminal
*   **Security Posture**: Command injection prevention, output sanitization, sandboxing with `--sandbox` option
