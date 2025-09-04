# Task INFRA-001: Core IDE Integration - Plan

## 1. High-Level Plan (Revised)

Based on comprehensive research findings, this task establishes the foundational technical components of the Agentic Legal Drafting IDE. The plan has been significantly revised to address the complexity of stateful CLI integration, sophisticated authentication flows, and production-ready architecture patterns.

**Key Architectural Changes:**
- Gemini CLI integration as stateful agent with ReAct loops
- VS Code native authentication using AuthenticationProvider pattern
- Streaming output processing with real-time UI updates
- Comprehensive error handling and logging framework

## 2. Detailed Steps (Revised)

### Step 2.1: Establish VS Code Development Environment

*   **Action**: Verify existing VS Code fork setup (already completed in initial PoC)
*   **Action**: Validate build system integration for Cline extension
    *   Confirm `extensions/cline/` directory structure
    *   Verify `gulpfile.extensions.js` includes Cline compilation
    *   Test TypeScript compilation for Cline extension
*   **Action**: Set up development workflow
    *   Configure watch mode for extension development: `npm run watch-extensions`
    *   Set up debugging configuration for extension host

### Step 2.2: Implement VS Code Native Authentication Provider

*   **Action**: Create `GeminiAuthenticationProvider` class implementing `vscode.AuthenticationProvider`
    *   Implement required methods: `getSessions()`, `createSession()`, `removeSession()`
    *   Set up OAuth 2.0 flow with browser redirect handling
    *   Integrate with VS Code's `SecretStorage` for secure credential persistence
*   **Action**: Register authentication provider in extension activation
    *   Add authentication contribution to `package.json`
    *   Register provider with VS Code authentication system
*   **Action**: Implement multi-method credential resolution
    *   Priority order: VS Code session → GEMINI_API_KEY → Google Cloud ADC → OAuth flow
    *   Create `AuthenticationService` for centralized credential management

### Step 2.3: Develop Production-Ready GeminiCLI Provider

*   **Action**: Create enhanced `GeminiCliHandler` implementing `ApiHandler` interface
    *   Replace simple PoC with stateful CLI interaction patterns
    *   Implement ReAct loop parsing for conversational output
    *   Add support for streaming output with real-time UI updates
*   **Action**: Implement comprehensive CLI interaction patterns
    *   Support for interactive mode vs `--json` structured output
    *   Handle slash commands and CLI state management
    *   Implement proper process lifecycle management
*   **Action**: Add robust error handling framework
    *   Map HTTP error codes to user-friendly messages
    *   Implement retry logic with exponential backoff
    *   Create correlation IDs for cross-process debugging

### Step 2.4: Implement Advanced Configuration and Context Management

*   **Action**: Create configuration hierarchy support
    *   Read settings from system, user, and project-level `settings.json` files
    *   Implement GEMINI.md context file discovery and parsing
    *   Add VS Code settings UI for Gemini CLI configuration options
*   **Action**: Implement CLI dependency management
    *   Add version checking on extension activation
    *   Provide user guidance for CLI installation/updates
    *   Create automated update flow via integrated terminal

### Step 2.5: Build and Test Integrated System

*   **Action**: Build VS Code with integrated Cline extension
    *   Run `npm run compile-extensions-build` to compile all extensions
    *   Test extension loading and activation
    *   Verify authentication provider registration
*   **Action**: Create comprehensive test suite
    *   Unit tests for `GeminiCliHandler` with mock CLI
    *   Integration tests for authentication flow
    *   End-to-end tests with actual Gemini CLI
*   **Action**: Validate production readiness
    *   Test error handling scenarios (network failures, auth failures, CLI errors)
    *   Verify logging and correlation ID functionality
    *   Test update mechanisms and dependency checking

### Step 2.6: Documentation and Deployment Preparation

*   **Action**: Create user documentation
    *   Authentication setup guide (Google Cloud project configuration)
    *   CLI installation and configuration instructions
    *   Troubleshooting guide for common issues
*   **Action**: Prepare deployment artifacts
    *   Create installation packages for target platforms
    *   Set up code signing for Windows/macOS distributions
    *   Prepare update distribution mechanism

## 3. Risk Mitigation and Rollback Plan

**High-Risk Areas Identified:**
- OAuth 2.0 authentication flow complexity
- Stateful CLI interaction parsing
- Cross-process error correlation
- Production security requirements

**Rollback Strategy:**
- Maintain current PoC as fallback implementation
- Version control all configuration changes
- Document all architectural decisions for future reference
- Create automated testing to prevent regressions

**Contingency Plans:**
- If OAuth flow fails: Fall back to API key authentication only
- If stateful CLI parsing fails: Use `--json` mode exclusively
- If VS Code integration fails: Deploy as standalone extension
