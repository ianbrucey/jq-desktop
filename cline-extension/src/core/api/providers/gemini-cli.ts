import type { Anthropic } from "@anthropic-ai/sdk"
import { ModelInfo } from "@shared/api"
import { spawn, ChildProcess } from "child_process"
import { ApiHandler, CommonApiHandlerOptions } from "../"
import { withRetry } from "../retry"
import { ApiStream, ApiStreamTextChunk, ApiStreamUsageChunk } from "../transform/stream"

interface GeminiCliHandlerOptions extends CommonApiHandlerOptions {
	geminiCliPath?: string
	apiModelId?: string
	timeout?: number
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
	 * Create a message using the local Gemini CLI
	 */
	@withRetry({
		maxRetries: 2,
		baseDelay: 1000,
		maxDelay: 5000,
	})
	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		const cliPath = this.options.geminiCliPath || "gemini"
		const timeout = this.options.timeout || 30000 // 30 second default timeout

		// For this PoC, we'll use a hardcoded prompt to test the integration
		// In a full implementation, we would properly format the systemPrompt and messages
		const testPrompt = "Hello, this is a test from the Cline extension. Please respond with a simple greeting."

		try {
			// Spawn the Gemini CLI process
			const cliProcess: ChildProcess = spawn(cliPath, ["--prompt", testPrompt], {
				stdio: ["pipe", "pipe", "pipe"],
				timeout: timeout
			})

			let output = ""
			let errorOutput = ""

			// Set up timeout handling
			const timeoutId = setTimeout(() => {
				cliProcess.kill("SIGTERM")
			}, timeout)

			// Handle stdout data
			if (cliProcess.stdout) {
				cliProcess.stdout.on("data", (data: Buffer) => {
					const text = data.toString()
					output += text
					
					// Yield text chunks as they arrive
					const chunk: ApiStreamTextChunk = {
						type: "text",
						text: text
					}
					// Note: We can't yield from inside event handlers in this context
					// So we'll collect the output and yield it after the process completes
				})
			}

			// Handle stderr data
			if (cliProcess.stderr) {
				cliProcess.stderr.on("data", (data: Buffer) => {
					errorOutput += data.toString()
				})
			}

			// Wait for the process to complete
			const exitCode = await new Promise<number | null>((resolve, reject) => {
				cliProcess.on("close", (code) => {
					clearTimeout(timeoutId)
					resolve(code)
				})

				cliProcess.on("error", (error) => {
					clearTimeout(timeoutId)
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

			// Yield the collected output
			yield {
				type: "text",
				text: output
			} as ApiStreamTextChunk

			// Yield usage information (no actual token usage for local CLI)
			yield {
				type: "usage",
				inputTokens: 0,
				outputTokens: 0,
				cacheReadTokens: 0,
				cacheWriteTokens: 0,
			} as ApiStreamUsageChunk

		} catch (error) {
			// Handle common error scenarios
			if (error.code === "ENOENT") {
				throw new Error(`Gemini CLI not found at path: ${cliPath}. Please ensure Gemini CLI is installed and in your PATH.`)
			}
			
			if (error.message?.includes("timeout")) {
				throw new Error(`Gemini CLI timed out after ${timeout}ms. The request may be too complex or the CLI may be unresponsive.`)
			}

			throw new Error(`Gemini CLI error: ${error.message}`)
		}
	}
}
