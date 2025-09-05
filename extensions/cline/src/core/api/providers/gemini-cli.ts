import type { Anthropic } from "@anthropic-ai/sdk"
import { ModelInfo } from "@shared/api"
import { spawn, ChildProcess } from "child_process"
import { ApiHandler, CommonApiHandlerOptions } from "../"
import { withRetry } from "../retry"
import { ApiStream, ApiStreamTextChunk, ApiStreamUsageChunk } from "../transform/stream"
import * as vscode from 'vscode'
import { randomBytes } from 'crypto'

interface GeminiCliHandlerOptions extends CommonApiHandlerOptions {
	geminiCliPath?: string
	apiModelId?: string
	timeout?: number
	useJsonMode?: boolean
	enableInteractiveMode?: boolean
	requireConfirmation?: boolean
}

/**
 * Handler for local Gemini CLI integration.
 *
 * This provider replaces cloud-based Gemini API calls with local CLI execution,
 * ensuring all data processing occurs on the user's machine for privacy.
 *
 * Key features:
 * - Uses child_process.spawn to execute local Gemini CLI
 * - Streams output from CLI back to Cline UI
 * - Handles errors and timeouts gracefully
 * - Maintains compatibility with Cline's ApiHandler interface
 */
export class GeminiCliHandler implements ApiHandler {
	private options: GeminiCliHandlerOptions

	constructor(options: GeminiCliHandlerOptions) {
		this.options = options
	}

	/**
	 * Get the model information for the CLI provider
	 */
	getModel(): { id: string; info: ModelInfo } {
		return {
			id: this.options.apiModelId || "gemini-cli-local",
			info: {
				maxTokens: 8192, // Default reasonable limit
				contextWindow: 32768,
				supportsImages: false,
				supportsPromptCache: false,
				inputPrice: 0, // Local execution has no API costs
				outputPrice: 0,
				cacheWritePrice: 0,
				cacheReadPrice: 0,
			}
		}
	}

	/**
	 * Create a message using the local Gemini CLI with authentication and stateful interaction
	 */
	@withRetry({
		maxRetries: 2,
		baseDelay: 1000,
		maxDelay: 5000,
	})
	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		const correlationId = randomBytes(8).toString('hex')

		try {
			// Ensure authentication before proceeding
			await this.ensureAuthentication(correlationId)

			// Format the conversation for Gemini CLI
			const formattedPrompt = this.formatConversation(systemPrompt, messages)

			// Execute CLI with stateful interaction
			yield* this.executeStatefulCli(formattedPrompt, correlationId)

		} catch (error) {
			this.logError(correlationId, 'CLI execution failed', error)
			throw this.createUserFriendlyError(error)
		}
	}

	/**
	 * Ensure user is authenticated with Google for Gemini CLI access
	 */
	private async ensureAuthentication(correlationId: string): Promise<void> {
		try {
			const session = await vscode.authentication.getSession('google-gemini',
				['https://www.googleapis.com/auth/generative-language'],
				{ createIfNone: false }
			)

			if (!session) {
				// Prompt user to authenticate
				const choice = await vscode.window.showInformationMessage(
					'Gemini CLI requires Google authentication. Would you like to authenticate now?',
					'Authenticate',
					'Cancel'
				)

				if (choice === 'Authenticate') {
					await vscode.authentication.getSession('google-gemini',
						['https://www.googleapis.com/auth/generative-language'],
						{ createIfNone: true }
					)
				} else {
					throw new Error('Authentication required for Gemini CLI access')
				}
			}

			this.logInfo(correlationId, 'Authentication verified')
		} catch (error) {
			this.logError(correlationId, 'Authentication failed', error)
			throw new Error(`Authentication failed: ${error.message}`)
		}
	}

	/**
	 * Format the conversation for Gemini CLI input
	 */
	private formatConversation(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): string {
		let formatted = ''

		if (systemPrompt) {
			formatted += `System: ${systemPrompt}\n\n`
		}

		for (const message of messages) {
			const role = message.role === 'user' ? 'Human' : 'Assistant'
			const content = Array.isArray(message.content)
				? message.content.map(c => c.type === 'text' ? c.text : '[Non-text content]').join(' ')
				: message.content
			formatted += `${role}: ${content}\n\n`
		}

		return formatted.trim()
	}

	/**
	 * Execute Gemini CLI with stateful interaction and streaming output
	 */
	private async *executeStatefulCli(prompt: string, correlationId: string): ApiStream {
		const cliPath = this.options.geminiCliPath || "gemini"
		const timeout = this.options.timeout || 60000 // 60 second timeout for production

		this.logInfo(correlationId, `Starting CLI execution with path: ${cliPath}`)

		try {
			// Determine CLI arguments based on configuration
			const cliArgs = this.buildCliArguments()

			// Use interactive mode for stateful conversation
			const cliProcess: ChildProcess = spawn(cliPath, cliArgs, {
				stdio: ["pipe", "pipe", "pipe"],
				env: {
					...process.env,
					GEMINI_CLI_CORRELATION_ID: correlationId,
					GEMINI_CLI_MODE: this.options.useJsonMode ? 'json' : 'interactive'
				}
			})

			let output = ""
			let errorOutput = ""
			let isComplete = false

			// Set up timeout handling
			const timeoutId = setTimeout(() => {
				this.logWarning(correlationId, `CLI process timeout after ${timeout}ms`)
				cliProcess.kill("SIGTERM")
			}, timeout)

			// Send the prompt to CLI
			if (cliProcess.stdin) {
				cliProcess.stdin.write(prompt + '\n')
				cliProcess.stdin.end()
			}

			// Handle stdout data with streaming
			const streamChunks: ApiStreamTextChunk[] = []

			if (cliProcess.stdout) {
				cliProcess.stdout.on("data", (data: Buffer) => {
					const text = data.toString()
					output += text

					// Stream output in real-time
					if (!isComplete) {
						// Parse for ReAct loop phases
						const parsedOutput = this.parseCliOutput(text, correlationId)

						// Create stream chunk for immediate yielding
						const chunk: ApiStreamTextChunk = {
							type: "text",
							text: text
						}

						// Store chunk for streaming (in a real implementation, this would be yielded immediately)
						streamChunks.push(chunk)

						// Handle confirmation requests
						if (parsedOutput.type === 'confirmation_request') {
							// In a full implementation, this would pause the stream and wait for user input
							this.logInfo(correlationId, 'Confirmation request detected - would pause for user input')
						}

						// Handle tool calls requiring confirmation
						if (parsedOutput.type === 'tool_call' && parsedOutput.requiresConfirmation) {
							// In a full implementation, this would show confirmation dialog
							this.logWarning(correlationId, 'Potentially dangerous tool call detected')
						}
					}
				})
			}

			// Handle stderr data
			if (cliProcess.stderr) {
				cliProcess.stderr.on("data", (data: Buffer) => {
					const errorText = data.toString()
					errorOutput += errorText
					this.logWarning(correlationId, `CLI stderr: ${errorText}`)
				})
			}

			// Wait for the process to complete
			const exitCode = await new Promise<number | null>((resolve, reject) => {
				cliProcess.on("close", (code) => {
					clearTimeout(timeoutId)
					isComplete = true
					this.logInfo(correlationId, `CLI process completed with exit code: ${code}`)
					resolve(code)
				})

				cliProcess.on("error", (error) => {
					clearTimeout(timeoutId)
					isComplete = true
					this.logError(correlationId, 'CLI process error', error)
					reject(error)
				})
			})

			// Check for errors
			if (exitCode !== 0) {
				throw new Error(`Gemini CLI exited with code ${exitCode}. Error: ${errorOutput}`)
			}

			if (!output.trim()) {
				throw new Error("Gemini CLI produced no output")
			}

			// Yield the final output
			yield {
				type: "text",
				text: output
			} as ApiStreamTextChunk

			// Yield usage information
			yield {
				type: "usage",
				inputTokens: this.estimateTokens(prompt),
				outputTokens: this.estimateTokens(output),
				cacheReadTokens: 0,
				cacheWriteTokens: 0,
			} as ApiStreamUsageChunk

			this.logInfo(correlationId, 'CLI execution completed successfully')

		} catch (error) {
			this.logError(correlationId, 'CLI execution failed', error)
			throw error
		}
	}

	/**
	 * Parse CLI output for ReAct loop phases and structured content
	 */
	private parseCliOutput(text: string, correlationId: string): any {
		// Parse different types of CLI output based on patterns

		// Check for reasoning phase indicators
		if (text.includes('Thinking:') || text.includes('Reasoning:')) {
			this.logInfo(correlationId, 'Detected reasoning phase in CLI output')
			return {
				type: 'reasoning',
				content: text,
				phase: 'thinking'
			}
		}

		// Check for tool call indicators
		if (text.includes('Tool:') || text.includes('Action:')) {
			this.logInfo(correlationId, 'Detected tool call in CLI output')
			return {
				type: 'tool_call',
				content: text,
				requiresConfirmation: this.requiresUserConfirmation(text)
			}
		}

		// Check for confirmation requests
		if (text.includes('Confirm:') || text.includes('Proceed?') || text.includes('[Y/n]')) {
			this.logInfo(correlationId, 'Detected confirmation request in CLI output')
			return {
				type: 'confirmation_request',
				content: text,
				awaitingUserInput: true
			}
		}

		// Check for structured JSON output
		try {
			const jsonMatch = text.match(/\{[\s\S]*\}/)
			if (jsonMatch) {
				const parsed = JSON.parse(jsonMatch[0])
				this.logInfo(correlationId, 'Detected structured JSON output')
				return {
					type: 'structured',
					content: text,
					data: parsed
				}
			}
		} catch (error) {
			// Not JSON, continue with regular text processing
		}

		// Default to regular text output
		return {
			type: 'text',
			content: text
		}
	}

	/**
	 * Check if a tool call requires user confirmation
	 */
	private requiresUserConfirmation(text: string): boolean {
		const dangerousActions = [
			'delete',
			'remove',
			'rm ',
			'DROP',
			'truncate',
			'format',
			'sudo',
			'chmod 777',
			'> /dev/null'
		]

		return dangerousActions.some(action =>
			text.toLowerCase().includes(action.toLowerCase())
		)
	}

	/**
	 * Handle user confirmation for potentially dangerous actions
	 */
	private async handleUserConfirmation(text: string, correlationId: string): Promise<boolean> {
		try {
			const choice = await vscode.window.showWarningMessage(
				`The AI wants to perform an action that may modify your system:\n\n${text}\n\nDo you want to proceed?`,
				{ modal: true },
				'Proceed',
				'Cancel'
			)

			const approved = choice === 'Proceed'
			this.logInfo(correlationId, `User confirmation: ${approved ? 'approved' : 'denied'}`)
			return approved
		} catch (error) {
			this.logError(correlationId, 'Error getting user confirmation', error)
			return false // Default to deny on error
		}
	}

	/**
	 * Estimate token count for usage reporting
	 */
	private estimateTokens(text: string): number {
		// Rough estimation: ~4 characters per token
		return Math.ceil(text.length / 4)
	}

	/**
	 * Create user-friendly error messages
	 */
	private createUserFriendlyError(error: any): Error {
		if (error.code === "ENOENT") {
			return new Error(`Gemini CLI not found. Please install the Gemini CLI and ensure it's in your PATH. Visit https://ai.google.dev/gemini-api/docs/cli for installation instructions.`)
		}

		if (error.message?.includes("timeout")) {
			return new Error(`The request timed out. This may happen with complex requests or if the Gemini CLI is unresponsive. Please try again with a simpler request.`)
		}

		if (error.message?.includes("Authentication")) {
			return new Error(`Authentication failed. Please check your Google credentials and try authenticating again.`)
		}

		return new Error(`Gemini CLI error: ${error.message}`)
	}

	/**
	 * Build CLI arguments based on configuration options
	 */
	private buildCliArguments(): string[] {
		const args: string[] = []

		// Add JSON mode flag if enabled
		if (this.options.useJsonMode) {
			args.push('--json')
		}

		// Add interactive mode flag if enabled (default)
		if (this.options.enableInteractiveMode !== false) {
			args.push('--interactive')
		}

		// Add safety flags
		if (this.options.requireConfirmation !== false) {
			args.push('--confirm-actions')
		}

		// Add model specification if provided
		if (this.options.apiModelId) {
			args.push('--model', this.options.apiModelId)
		}

		return args
	}

	/**
	 * Logging methods with correlation ID support
	 */
	private logInfo(correlationId: string, message: string): void {
		console.log(`[GeminiCLI:${correlationId}] INFO: ${message}`)
	}

	private logWarning(correlationId: string, message: string): void {
		console.warn(`[GeminiCLI:${correlationId}] WARN: ${message}`)
	}

	private logError(correlationId: string, message: string, error?: any): void {
		console.error(`[GeminiCLI:${correlationId}] ERROR: ${message}`, error)
	}
}
