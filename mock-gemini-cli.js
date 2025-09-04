#!/usr/bin/env node

/**
 * Mock Gemini CLI for testing the GeminiCLI provider integration
 * 
 * This script simulates the behavior of a local Gemini CLI tool
 * for testing purposes during the proof-of-concept phase.
 */

const args = process.argv.slice(2);

// Parse command line arguments
let prompt = "";
for (let i = 0; i < args.length; i++) {
    if (args[i] === "--prompt" && i + 1 < args.length) {
        prompt = args[i + 1];
        break;
    }
}

// Simulate processing delay
setTimeout(() => {
    // Generate a mock response
    const response = `Hello! I'm a mock Gemini CLI responding to your prompt: "${prompt}"\n\nThis is a test response to verify that the GeminiCLI provider integration is working correctly. The local CLI execution, output capture, and streaming back to the Cline UI are all functioning as expected.\n\nKey integration points verified:\n- Child process spawning ✓\n- Command line argument parsing ✓\n- Output streaming ✓\n- Error handling (this is a success case) ✓\n\nThe proof-of-concept is working!`;
    
    console.log(response);
    process.exit(0);
}, 1000); // 1 second delay to simulate processing
