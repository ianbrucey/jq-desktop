# Local Development and Testing Guide

## Overview

This guide provides step-by-step instructions for building and testing the Agentic Legal Drafting IDE locally. The IDE is a VS Code fork with an integrated Cline extension that uses local Gemini CLI for AI processing.

## Prerequisites

### System Requirements
- **Operating System**: macOS, Windows, or Linux
- **Node.js**: Version 18.x or 20.x (required for VS Code build)
- **Python**: Version 3.8+ (required for native module compilation)
- **Git**: Latest version
- **Memory**: Minimum 8GB RAM (16GB recommended)
- **Storage**: At least 5GB free space

### Development Tools
- **Code Editor**: VS Code (for development) or any text editor
- **Terminal**: Command line access
- **Browser**: Modern browser for OAuth authentication testing

### Platform-Specific Requirements

#### macOS
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js via Homebrew
brew install node@20
```

#### Windows
```powershell
# Install Node.js from https://nodejs.org/
# Install Python from https://python.org/
# Install Visual Studio Build Tools
npm install -g windows-build-tools
```

#### Linux (Ubuntu/Debian)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install build dependencies
sudo apt-get install -y build-essential python3 python3-pip
```

## Project Structure

```
jq-desktop/                          # Project root
├── extensions/cline/                # Integrated Cline extension
├── context-engine/                  # Task framework and documentation
├── cline-extension/                 # Original Cline source (for reference)
├── mock-gemini-cli.js              # Mock CLI for testing
├── build/                          # VS Code build configuration
├── package.json                    # Main project dependencies
└── LOCAL_DEVELOPMENT_GUIDE.md      # This guide
```

## Step 1: Initial Setup

### 1.1 Clone and Navigate to Project
```bash
# Navigate to the project directory
cd /Users/admin/projects/jq-desktop

# Verify project structure
ls -la
```

### 1.2 Install Dependencies
```bash
# Install main project dependencies
npm install

# Install Cline extension dependencies
cd extensions/cline
npm install

# Return to project root
cd ../..
```

### 1.3 Verify Node.js Version
```bash
node --version  # Should be 18.x or 20.x
npm --version   # Should be 8.x or higher
```

## Step 2: Build the VS Code Fork

### 2.1 Compile Extensions
```bash
# Compile all extensions including Cline
npm run compile-extensions-build

# Alternative: Watch mode for development
npm run watch-extensions
```

### 2.2 Build VS Code Application
```bash
# Development build (faster, for testing)
npm run compile

# Production build (slower, optimized)
npm run package
```

### 2.3 Platform-Specific Build Commands
```bash
# macOS
npm run gulp -- vscode-darwin-x64

# Windows
npm run gulp -- vscode-win32-x64

# Linux
npm run gulp -- vscode-linux-x64
```

## Step 3: Testing the Authentication System

### 3.1 Set Up Google OAuth Credentials

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the "Generative Language API"

2. **Configure OAuth 2.0**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Desktop application"
   - Add redirect URI: `http://localhost:3000/callback`

3. **Set Environment Variables**:
```bash
export GOOGLE_CLIENT_ID="your-client-id"
export GOOGLE_CLIENT_SECRET="your-client-secret"

# Alternative: Set in VS Code settings
# File > Preferences > Settings > Search "gemini"
```

### 3.2 Test Authentication Flow

1. **Launch the IDE**:
```bash
# From project root
./scripts/code.sh  # macOS/Linux
# or
./scripts/code.bat  # Windows
```

2. **Trigger Authentication**:
   - Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
   - Run command: "Authenticate with Google for Gemini CLI"
   - Browser should open for OAuth consent
   - Check status bar for authentication status

3. **Verify Authentication**:
   - Status bar should show "Gemini: Authenticated"
   - Check VS Code's authentication sessions: `Cmd+Shift+P` > "Accounts: Sign in"

## Step 4: Testing the Gemini CLI Integration

### 4.1 Set Up Mock Gemini CLI

```bash
# Make the mock CLI executable
chmod +x mock-gemini-cli.js

# Test the mock CLI directly
node mock-gemini-cli.js --prompt "Hello, test message"
```

### 4.2 Configure Cline to Use Mock CLI

1. **Open VS Code Settings**:
   - File > Preferences > Settings
   - Search for "gemini"
   - Set `gemini.cliPath` to full path of `mock-gemini-cli.js`

2. **Alternative: Environment Variable**:
```bash
export GEMINI_CLI_PATH="/Users/admin/projects/jq-desktop/mock-gemini-cli.js"
```

### 4.3 Test End-to-End Integration

1. **Open Cline Extension**:
   - Click Cline icon in Activity Bar (left sidebar)
   - Or use Command Palette: "Cline: New Task"

2. **Configure AI Provider**:
   - In Cline settings, select "gemini-cli" as the provider
   - Verify authentication status

3. **Test AI Interaction**:
   - Send a test message: "Hello, can you help me with a simple task?"
   - Verify response comes from mock CLI
   - Check for any error messages in Developer Console

## Step 5: Development Workflow

### 5.1 Development Mode Setup
```bash
# Terminal 1: Watch TypeScript compilation
npm run watch

# Terminal 2: Watch extension compilation
cd extensions/cline
npm run watch

# Terminal 3: Run the IDE
cd ../..
./scripts/code.sh --extensionDevelopmentPath=./extensions/cline
```

### 5.2 Debugging

1. **Enable Developer Tools**:
   - Help > Toggle Developer Tools
   - Check Console for errors

2. **Extension Debugging**:
   - Open `extensions/cline` in a separate VS Code window
   - Press F5 to launch Extension Development Host
   - Set breakpoints in TypeScript files

3. **Log Analysis**:
```bash
# Check extension logs
tail -f ~/.vscode/logs/*/exthost*/output.log

# Check authentication logs
grep "GeminiAuth" ~/.vscode/logs/*/exthost*/output.log
```

### 5.3 Common Development Tasks

```bash
# Clean build artifacts
npm run clean

# Rebuild everything
npm run clean && npm install && npm run compile-extensions-build

# Run tests
npm test

# Check for TypeScript errors
npm run check-types

# Format code
npm run format
```

## Step 6: Validation and Testing

### 6.1 Authentication Validation Checklist
- [ ] OAuth flow opens browser correctly
- [ ] Authentication completes without errors
- [ ] Status bar shows correct authentication status
- [ ] Sessions persist across IDE restarts
- [ ] Multiple authentication methods work (OAuth, API key)

### 6.2 CLI Integration Validation Checklist
- [ ] Mock CLI executes successfully
- [ ] Cline can communicate with CLI provider
- [ ] Responses are displayed in Cline UI
- [ ] Error handling works for CLI failures
- [ ] Correlation IDs appear in logs

### 6.3 End-to-End Testing Scenarios

1. **Fresh Installation Test**:
   - Clean VS Code settings
   - Test authentication from scratch
   - Verify first-time user experience

2. **Error Handling Test**:
   - Test with invalid OAuth credentials
   - Test with missing CLI executable
   - Verify user-friendly error messages

3. **Performance Test**:
   - Test with longer conversations
   - Monitor memory usage
   - Check for process leaks

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear node_modules and reinstall
rm -rf node_modules extensions/cline/node_modules
npm install
cd extensions/cline && npm install
```

#### Background Process Issues
If you encounter persistent git cloning or background processes:
```bash
# Check for running processes
ps aux | grep git
ps aux | grep node

# Kill any stuck processes
pkill -f "git clone"
pkill -f "node"

# Wait a moment and retry your command
```

#### Authentication Issues
- Verify Google Cloud project configuration
- Check redirect URI matches exactly
- Ensure APIs are enabled in Google Cloud Console

#### CLI Integration Issues
- Verify mock CLI is executable: `chmod +x mock-gemini-cli.js`
- Check CLI path configuration in settings
- Review correlation IDs in logs for debugging

### Debug Commands
```bash
# Check VS Code process
ps aux | grep code

# Check extension loading
code --list-extensions --show-versions

# Verbose logging
code --log debug --extensionDevelopmentPath=./extensions/cline
```

## Next Steps

After successful local testing:

1. **Install Real Gemini CLI**: Replace mock with actual Gemini CLI
2. **Production Build**: Create distributable packages
3. **Advanced Testing**: Test with real legal documents and workflows
4. **Performance Optimization**: Profile and optimize for production use

## Support and Resources

- **Project Documentation**: `context-engine/` directory
- **Task Framework**: Detailed implementation plans in `context-engine/tasks/`
- **Architecture Decisions**: `context-engine/tasks/architectural-decisions.md`
- **Implementation Progress**: `context-engine/implementation-progress-summary.md`

For issues or questions, check the troubleshooting section above or review the comprehensive documentation in the `context-engine/` directory.
