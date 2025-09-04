# Global Context: Agentic Legal Drafting IDE

## 1. Problem Definition & Scope

**Problem Statement**: Legal professionals require a powerful, secure drafting environment that leverages AI assistance without compromising client confidentiality. Cloud-based AI tools pose a security risk by sending sensitive data to third-party servers. This project aims to create a desktop IDE that integrates an AI agent running entirely locally.

**Target Users**: Legal professionals (lawyers, paralegals, etc.) who draft complex legal documents and require high levels of security and confidentiality.

**Core Objective**: To build a standalone, desktop-based agentic IDE for legal drafting that runs a local AI agent, ensuring all data processing occurs on the user's machine.

**Key Features** (Updated based on research):
- A familiar, professional-grade editing environment based on VS Code with built-in Cline extension.
- A sophisticated stateful AI agent with ReAct (Reason and Act) loops for complex legal reasoning and document drafting.
- Enterprise-grade authentication with OAuth 2.0 integration and secure credential management.
- Local-first AI backend (Gemini CLI) with conversational state management to ensure 100% data privacy.
- Production-ready error handling, logging, and monitoring for professional deployment.
- Specialized legal workflows with document templates, precedent integration, and compliance audit trails.
- Secure, appliance-like experience with automated updates and dependency management.

## 2. Solution Architecture

The architecture is based on forking and customizing a stack of open-source technologies to create a cohesive, purpose-built application.

**Technology Stack** (Updated based on research):
- **IDE Foundation**: A fork of **VS Code (Code - OSS)**, built using **Electron**, **Node.js**, and **TypeScript**. This provides the core editor functionality.
- **Agentic UI**: A modified version of the **Cline** VS Code extension integrated as a built-in extension. Its **React**-based UI will be preserved, with enhanced authentication and stateful interaction capabilities.
- **Authentication System**: VS Code native **AuthenticationProvider** with **OAuth 2.0** flow using `google-auth-library` and secure credential storage via **SecretStorage API**.
- **AI Engine**: The **Gemini CLI** as a stateful agent with **ReAct loops**, supporting both interactive conversational mode and structured JSON output. Communication via persistent **child_process** with streaming output processing.
- **Error Handling**: Comprehensive error management with **correlation IDs**, structured logging, and user-friendly error mapping for production deployment.
- **Document Generation**: **Pandoc** will be used as a universal document converter for creating polished outputs (PDF, HTML, DOCX) from **Markdown** source files.
- **Build & Distribution**:
    - **Build System**: **Yarn** and **Gulp**, following the patterns established by the **VSCodium** project.
    - **Branding**: Customization is managed via the `product.json` file.
    - **Installers**: Cross-platform installers will be created for **Windows (MSI), macOS (DMG), and Linux (AppImage, .deb)**.

**Architectural Diagram** (Updated based on research):
1.  **User** interacts with the **Custom IDE (VS Code Fork)** with built-in Cline extension.
2.  **Authentication Flow**: VS Code's AuthenticationProvider handles OAuth 2.0 flow with browser redirect and secure credential storage.
3.  **Stateful Agent Interaction**: User prompts from the Cline UI are sent to the `GeminiCliHandler` which manages persistent CLI processes.
4.  **ReAct Loop Processing**: The GeminiCliHandler parses conversational output including reasoning phases, tool calls, and user confirmations.
5.  **Streaming Output**: Real-time output processing with incremental UI updates and state management.
6.  **Error Handling**: Comprehensive error management with correlation IDs and user-friendly messaging.
7.  **Legal Specialization**: Integration with legal document templates, precedent databases, and compliance audit trails.
8.  **Document Assembly**: The IDE uses **Pandoc** to convert multiple Markdown files into polished legal documents (PDF, DOCX).

## 3. Key Constraints & Guidelines

**Security & Privacy**:
- **Local-First is Mandatory**: No user data, prompts, or document content may be sent to any external or third-party server. All AI processing must be handled by the local Gemini CLI.
- **No Telemetry**: The build must be configured (via `product.json`) to disable all telemetry and data collection inherited from VS Code.

**Licensing & Distribution**:
- **Open Source**: The core application is built on the MIT-licensed Code - OSS. All bundled components (like the modified Cline) must have compatible open-source licenses.
- **Branding**: The final product must not use any Microsoft trademarks (e.g., "Visual Studio Code"). It must have its own unique name and branding.
- **Extension Marketplace**: The IDE will not connect to the official Microsoft VS Code Marketplace. All essential extensions (i.e., the modified Cline) must be bundled as "built-in" extensions. An alternative like OpenVSX may be configured for optional, user-installed extensions.

**Development & Maintenance**:
- **Upstream Synchronization**: A formal, regular process must be established to merge updates from the upstream `microsoft/vscode` repository. This is critical for security and stability. The VSCodium project's patch-based approach is the recommended model.
- **Code Quality**: Follow existing code styles and patterns within the VS Code and Cline codebases.
- **Cross-Platform Builds**: The CI/CD pipeline must produce signed and notarized installers for Windows and macOS to ensure a trustworthy user installation experience.

**Technical Constraints** (Updated based on research):
- **Electron Compatibility**: All components must be compatible with the Electron runtime environment.
- **Cross-Platform**: The solution must work on Windows, macOS, and Linux with consistent authentication and CLI integration.
- **Performance**: The IDE must remain responsive during stateful AI interactions. Long-running Gemini CLI conversations should not block the UI.
- **Reliability**: The system must gracefully handle failures (authentication errors, CLI crashes, network issues) with comprehensive error handling and recovery mechanisms.
- **Security**: Enterprise-grade security with OAuth 2.0, secure credential storage, command injection prevention, and audit logging.
- **Stateful Interaction**: Support for conversational AI with ReAct loops, context preservation, and user approval workflows.

## 4. Research Impact and Architectural Evolution

**Critical Research Findings**: Comprehensive research documented in `context-engine/intake/Gemini CLI VS Code Integration Guide.md` revealed that the initial architectural assumptions were significantly incomplete. The Gemini CLI is not a simple command-line tool but a sophisticated stateful agent requiring fundamental changes to the integration approach.

**Key Architectural Changes**:
- **From Transactional to Conversational**: Shifted from simple command execution to stateful agent interaction with ReAct loops
- **Authentication Complexity**: Added enterprise-grade OAuth 2.0 flow with VS Code native integration
- **Error Handling Sophistication**: Implemented correlation IDs, structured logging, and comprehensive error mapping
- **Production Readiness**: Added monitoring, diagnostics, and automated dependency management

**Implementation Impact**: These findings require a complete rewrite of the AI integration layer, moving from a simple PoC to a production-ready system with enterprise security and reliability requirements.

## 5. Project Phases (Revised)

1.  **Foundation & Authentication**: Establish VS Code fork with Cline integration and implement production-grade OAuth 2.0 authentication system.
2.  **Stateful Agent Integration**: Develop sophisticated CLI interaction engine with ReAct loop processing and conversational state management.
3.  **Production Architecture**: Implement comprehensive error handling, logging, monitoring, and dependency management systems.
4.  **Legal Domain Specialization**: Build legal-specific features including document templates, precedent integration, and compliance audit trails.
5.  **Deployment & Maintenance**: Set up CI/CD, code signing, automated release packaging, and upstream synchronization processes.
