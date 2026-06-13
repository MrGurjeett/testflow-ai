import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";
import {
  RequirementsAnalysisResponse,
  TestDesignResponse,
  AutomationResponse,
  ExecutionResponse
} from '@/types/agents';
const ENDPOINT = process.env.AZURE_AI_PROJECT_ENDPOINT || "https://aihackathonms-resource.services.ai.azure.com/api/projects/AIHackathonMS";

let clientInstance: AIProjectClient | null = null;

/**
 * Lazily instantiates and returns the AIProjectClient singleton using DefaultAzureCredential.
 */
function getClientInstance(): AIProjectClient {
  if (!clientInstance) {
    console.log(`[FoundryService] Initializing AIProjectClient with endpoint: ${ENDPOINT}`);
    clientInstance = new AIProjectClient(ENDPOINT, new DefaultAzureCredential());
  }
  return clientInstance;
}

/**
 * Cleans up and parses the agent's textual output into a structured JSON object.
 * Handles cases where JSON is wrapped inside markdown code blocks (e.g. ```json ... ```).
 */
function parseAgentResponse(outputText: string): any {
  if (!outputText) {
    return {};
  }

  const cleanedText = outputText.trim();

  // Try standard JSON parsing
  try {
    return JSON.parse(cleanedText);
  } catch (e) {
    // Check if it's wrapped in markdown JSON blocks
    const match = cleanedText.match(/```json\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch (innerError) {
        // Fallback
      }
    }

    // Check if it's wrapped in generic markdown code blocks
    const genericMatch = cleanedText.match(/```\s*([\s\S]*?)\s*```/);
    if (genericMatch && genericMatch[1]) {
      try {
        return JSON.parse(genericMatch[1].trim());
      } catch (innerError) {
        // Fallback
      }
    }

    console.warn("[FoundryService] Failed to parse agent response as JSON. Returning raw text inside object.", e);
    return { rawResponse: outputText };
  }
}

/**
 * isOrchestrationMode - Utility helper to check if orchestration_mode is set to true.
 */
export function isOrchestrationMode(input: any): boolean {
  if (!input || typeof input !== 'object') {
    return false;
  }
  return input.orchestration_mode === true;
}

/**
 * isInteractivePrompt - Utility helper to check if agent returned an interactive prompt.
 */
export function isInteractivePrompt(response: any): boolean {
  if (!response) {
    return false;
  }
  let text = "";
  if (typeof response === 'string') {
    text = response;
  } else if (response.rawResponse && typeof response.rawResponse === 'string') {
    text = response.rawResponse;
  } else {
    text = JSON.stringify(response);
  }
  
  const lower = text.toLowerCase();
  return lower.includes("what type of test assets would you like to generate") ||
         lower.includes("what automation assets would you like to generate") ||
         lower.includes("what analysis would you like to generate");
}

/**
 * Generic core execution method to invoke an agent by name in Azure AI Foundry.
 */
async function executeAgentCall<T>(agentName: string, inputData: any): Promise<T> {
  const startTime = Date.now();
  console.log(`[FoundryService] Starting agent call for "${agentName}"...`);

  const inputString = typeof inputData === 'string' ? inputData : JSON.stringify(inputData);

  let conversationId: string | null = null;
  let openAIClient: any = null;

  try {
    const projectClient = getClientInstance();
    openAIClient = projectClient.getOpenAIClient();

    // 1. Create a session (conversation)
    console.log(`[FoundryService] Creating session for "${agentName}"...`);
    console.log("=================================");
    console.log("Calling Azure Agent");
    console.log("Agent Name:", agentName);
    console.log("Input:", inputString);
    console.log("=================================");

    const conversation = await openAIClient.conversations.create();
    conversationId = conversation.id;

    // 2. Send input and run the agent in the session
    console.log(`[FoundryService] Running agent "${agentName}" in session ${conversationId}...`);
    await openAIClient.conversations.items.create(
      conversationId,
      {
        items: [
          {
            type: "message",
            role: "user",
            content: inputString,
          },
        ],
      }
    );

    const response = await openAIClient.responses.create(
      {
        conversation: conversationId,
      },
      {
        body: {
          agent_reference: {
            name: agentName,
            type: "agent_reference",
          },
        },
      }
    );

    console.log("========== RESPONSE ==========");
    console.log(JSON.stringify(response, null, 2));
    console.log("==============================");

    // 3. Wait for response and return structured JSON
    const outputText = response.output_text;
    if (!outputText) {
      throw new Error(`Agent "${agentName}" returned an empty response.`);
    }

    const parsedJson = parseAgentResponse(outputText);
    const duration = Date.now() - startTime;
    console.log(`[FoundryService] Agent "${agentName}" execution completed successfully in ${duration}ms.`);

    return parsedJson as T;
  } catch (error: any) {
    console.error("FULL AZURE ERROR:");
    console.error(error);
    console.error(error?.message);
    console.error(error?.response?.data);

    throw error;
  } finally {
    // 4. Clean up conversation session resource
    if (conversationId && openAIClient) {
      try {
        console.log(`[FoundryService] Deleting conversation session ${conversationId} for cleanup...`);
        await openAIClient.conversations.delete(conversationId);
      } catch (cleanupError) {
        console.warn(`[FoundryService] Warning: Failed to delete session ${conversationId}:`, cleanupError);
      }
    }
  }
}

/**
 * callRequirementAnalyst - Invokes the RequirementAnalyst agent.
 * Sends the user story and retrieves structured business rules and assumptions.
 */
export async function callRequirementAnalyst(userStory: string): Promise<RequirementsAnalysisResponse> {
  const response = await executeAgentCall<RequirementsAnalysisResponse>("RequirementAnalyst", { user_story: userStory });
  if (isInteractivePrompt(response)) {
    console.warn("[FoundryService] Warning: RequirementAnalyst returned an interactive prompt, indicating the agent is still running in interactive mode.");
  }
  return response;
}

/**
 * callTestDesignAgent - Invokes the TestDesignAgent agent.
 * Sends the requirements analysis output and retrieves BDD test scenarios.
 */
export async function callTestDesignAgent(requirementsOutput: RequirementsAnalysisResponse & { orchestration_mode?: boolean }): Promise<TestDesignResponse> {
  if (!requirementsOutput || typeof requirementsOutput !== 'object') {
    requirementsOutput = {} as any;
  }

  // Validation and auto-injection of orchestration_mode
  if (!isOrchestrationMode(requirementsOutput)) {
    console.log("[FoundryService] Verification failed: orchestration_mode is missing or false before invoking TestDesignAgent. Injecting automatically.");
    requirementsOutput.orchestration_mode = true;
  }

  const response = await executeAgentCall<TestDesignResponse>("TestDesignAgent", requirementsOutput);
  if (isInteractivePrompt(response)) {
    console.warn("[FoundryService] Warning: TestDesignAgent returned an interactive prompt, indicating the agent is still running in interactive mode.");
  }
  return response;
}

/**
 * callAutomationEngineerAgent - Invokes the AutomationEngineerAgent agent.
 * Sends the BDD test scenarios design and retrieves Playwright/Cypress automation scripts.
 */
export async function callAutomationEngineerAgent(testDesignOutput: TestDesignResponse & { orchestration_mode?: boolean }): Promise<AutomationResponse> {
  if (!testDesignOutput || typeof testDesignOutput !== 'object') {
    testDesignOutput = {} as any;
  }

  // Validation and auto-injection of orchestration_mode
  if (!isOrchestrationMode(testDesignOutput)) {
    console.log("[FoundryService] Verification failed: orchestration_mode is missing or false before invoking AutomationEngineerAgent. Injecting automatically.");
    testDesignOutput.orchestration_mode = true;
  }

  const response = await executeAgentCall<AutomationResponse>("AutomationEngineerAgent", testDesignOutput);
  if (isInteractivePrompt(response)) {
    console.warn("[FoundryService] Warning: AutomationEngineerAgent returned an interactive prompt, indicating the agent is still running in interactive mode.");
  }
  return response;
}

/**
 * callQualityIntelligenceAgent - Invokes the QualityIntelligenceAgent agent.
 * Sends the automation scripts and retrieves quality evaluation and release readiness insights.
 */
export async function callQualityIntelligenceAgent(automationOutput: AutomationResponse & { orchestration_mode?: boolean }): Promise<ExecutionResponse> {
  if (!automationOutput || typeof automationOutput !== 'object') {
    automationOutput = {} as any;
  }

  // Validation and auto-injection of orchestration_mode
  if (!isOrchestrationMode(automationOutput)) {
    console.log("[FoundryService] Verification failed: orchestration_mode is missing or false before invoking QualityIntelligenceAgent. Injecting automatically.");
    automationOutput.orchestration_mode = true;
  }

  const response = await executeAgentCall<ExecutionResponse>("QualityIntelligenceAgent", automationOutput);
  if (isInteractivePrompt(response)) {
    console.warn("[FoundryService] Warning: QualityIntelligenceAgent returned an interactive prompt, indicating the agent is still running in interactive mode.");
  }
  return response;
}

/**
 * callTestExecutionAgent - Invokes the TestExecutionAgent agent in Azure AI Foundry.
 */
export async function callTestExecutionAgent(automationOutput: any): Promise<any> {
  if (!automationOutput || typeof automationOutput !== 'object') {
    automationOutput = {} as any;
  }

  // Validation and auto-injection of orchestration_mode
  if (!isOrchestrationMode(automationOutput)) {
    console.log("[FoundryService] Verification failed: orchestration_mode is missing or false before invoking TestExecutionAgent. Injecting automatically.");
    automationOutput.orchestration_mode = true;
  }

  const response = await executeAgentCall<any>("TestExecutionAgent", automationOutput);
  if (isInteractivePrompt(response)) {
    console.warn("[FoundryService] Warning: TestExecutionAgent returned an interactive prompt, indicating the agent is still running in interactive mode.");
  }
  return response;
}

/**
 * callResultAggregatorAgent - Invokes the ResultAggregatorAgent agent in Azure AI Foundry.
 */
export async function callResultAggregatorAgent(testExecutionOutput: any): Promise<any> {
  if (!testExecutionOutput || typeof testExecutionOutput !== 'object') {
    testExecutionOutput = {} as any;
  }

  // Validation and auto-injection of orchestration_mode
  if (!isOrchestrationMode(testExecutionOutput)) {
    console.log("[FoundryService] Verification failed: orchestration_mode is missing or false before invoking ResultAggregatorAgent. Injecting automatically.");
    testExecutionOutput.orchestration_mode = true;
  }

  const response = await executeAgentCall<any>("ResultAggregatorAgent", testExecutionOutput);
  if (isInteractivePrompt(response)) {
    console.warn("[FoundryService] Warning: ResultAggregatorAgent returned an interactive prompt, indicating the agent is still running in interactive mode.");
  }
  return response;
}

/**
 * runFullWorkflow - Sequentially orchestrates the multi-agent QA verification.
 * Runs RequirementAnalyst -> TestDesignAgent -> AutomationEngineerAgent -> TestExecutionAgent -> ResultAggregatorAgent -> QualityIntelligenceAgent.
 * Tracks timestamps, execution duration, status, logs progress, and handles errors.
 */
export async function runFullWorkflow(userStory: string): Promise<{
  requirements?: RequirementsAnalysisResponse;
  testDesign?: TestDesignResponse;
  automation?: AutomationResponse;
  testExecution?: any;
  resultAggregator?: any;
  qualityAssessment?: ExecutionResponse;
  status: 'SUCCESS' | 'FAILED';
  failedAgent?: 'RequirementAnalyst' | 'TestDesignAgent' | 'AutomationEngineerAgent' | 'QualityIntelligenceAgent';
  timestamps: {
    startedAt: string;
    completedAt: string;
  };
  duration: string;
  error?: string;
}> {
  const startedAt = new Date();
  const startTime = Date.now();
  console.log(`[SequentialOrchestrator] Starting workflow at ${startedAt.toISOString()} for user story: "${userStory.substring(0, 50)}..."`);

  const result: {
    requirements?: RequirementsAnalysisResponse;
    testDesign?: TestDesignResponse;
    automation?: AutomationResponse;
    testExecution?: any;
    resultAggregator?: any;
    qualityAssessment?: ExecutionResponse;
    status: 'SUCCESS' | 'FAILED';
    failedAgent?: 'RequirementAnalyst' | 'TestDesignAgent' | 'AutomationEngineerAgent' | 'QualityIntelligenceAgent';
    timestamps: {
      startedAt: string;
      completedAt: string;
    };
    duration: string;
    error?: string;
  } = {
    requirements: undefined,
    testDesign: undefined,
    automation: undefined,
    testExecution: undefined,
    resultAggregator: undefined,
    qualityAssessment: undefined,
    status: 'FAILED',
    failedAgent: undefined,
    timestamps: {
      startedAt: startedAt.toISOString(),
      completedAt: '',
    },
    duration: '0ms',
  };

  let currentStep: 'RequirementAnalyst' | 'TestDesignAgent' | 'AutomationEngineerAgent' | 'TestExecutionAgent' | 'ResultAggregatorAgent' | 'QualityIntelligenceAgent' = 'RequirementAnalyst';

  try {
    // Step 1: RequirementAnalyst
    currentStep = 'RequirementAnalyst';
    console.log('[SequentialOrchestrator] Running Step 1: RequirementAnalyst...');
    result.requirements = await callRequirementAnalyst(userStory);

    // Step-2: TestDesignAgent
    currentStep = 'TestDesignAgent';
    console.log("[Orchestrator] Running Agent 2 in orchestration mode");
    const testDesignInput = {
      orchestration_mode: true,
      ...result.requirements
    };
    result.testDesign = await callTestDesignAgent(testDesignInput);

    // Step 3: AutomationEngineerAgent
    currentStep = 'AutomationEngineerAgent';
    console.log("[Orchestrator] Running Agent 3 in orchestration mode");
    const automationInput = {
      orchestration_mode: true,
      ...result.testDesign
    };
    result.automation = await callAutomationEngineerAgent(automationInput);

    // Step 4: TestExecutionAgent
    currentStep = 'TestExecutionAgent';
    console.log("[Orchestrator] Running Agent 4: TestExecutionAgent via Azure Foundry");
    result.testExecution = await callTestExecutionAgent(result.automation);

    // Step 5: ResultAggregatorAgent
    currentStep = 'ResultAggregatorAgent';
    console.log("[Orchestrator] Running Agent 5: ResultAggregatorAgent via Azure Foundry");
    result.resultAggregator = await callResultAggregatorAgent(result.testExecution);

    // Step 6: QualityIntelligenceAgent
    currentStep = 'QualityIntelligenceAgent';
    console.log("[Orchestrator] Running Agent 6 in orchestration mode");
    const qualityInput = {
      orchestration_mode: true,
      execution: result.testExecution,
      aggregation: result.resultAggregator
    };
    result.qualityAssessment = await callQualityIntelligenceAgent(qualityInput as any);

    result.status = 'SUCCESS';
    console.log('[SequentialOrchestrator] Workflow completed successfully.');
  } catch (error: any) {
    const errorMessage = error.message || String(error);
    console.error(`[SequentialOrchestrator] Workflow failed at step "${currentStep}": ${errorMessage}`);
    result.status = 'FAILED';
    if (currentStep === 'TestExecutionAgent' || currentStep === 'ResultAggregatorAgent') {
      result.failedAgent = 'QualityIntelligenceAgent' as any;
    } else {
      result.failedAgent = currentStep as any;
    }
    result.error = errorMessage;
  } finally {
    const completedAt = new Date();
    const durationMs = Date.now() - startTime;

    result.timestamps.completedAt = completedAt.toISOString();
    result.duration = `${durationMs}ms`;

    console.log(`[SequentialOrchestrator] Workflow finished at ${completedAt.toISOString()}. Total Duration: ${result.duration}. Status: ${result.status}`);
  }

  return result;
}
