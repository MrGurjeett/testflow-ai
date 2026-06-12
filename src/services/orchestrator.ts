import { 
  callRequirementAnalyst,
  callTestDesignAgent,
  callAutomationEngineerAgent,
  callQualityIntelligenceAgent
} from './foundry';
import { 
  OrchestrationResponse,
  RequirementsAnalysisResponse,
  TestDesignResponse,
  AutomationResponse,
  ExecutionResponse 
} from '@/types/agents';

/**
 * Main orchestrator service to sequence the multi-agent QA verification workflow.
 * Sequences Requirements Analyst -> Test Design Agent -> Automation Engineer Agent -> Quality Intelligence Agent.
 * 
 * @param userStory The input requirements text.
 * @returns OrchestrationResponse containing either the success output bundle or a failure trace.
 */
export async function runWorkflow(userStory: string): Promise<OrchestrationResponse> {
  console.log(`[Orchestrator] Initializing multi-agent workflow for: "${userStory.substring(0, 60)}..."`);

  // ==========================================
  // STEP 1: Requirements Analyst Agent
  // ==========================================
  let requirementsOutput: RequirementsAnalysisResponse;
  try {
    console.log('[Agent1 Started] Requirements Analyst');
    
    requirementsOutput = await callRequirementAnalyst(userStory);
    
    console.log('[Agent1 Completed] Requirements Analyst');
  } catch (error: any) {
    console.error(`[Agent1 Failed] Requirements Analyst encountered an error:`, error);
    return {
      success: false,
      failedAgent: 'RequirementsAnalyst',
      error: error.message || 'Error occurred during requirements analysis parsing.',
    };
  }

  // ==========================================
  // STEP 2: Test Design Architect Agent (TestDesignAgent)
  // ==========================================
  let testDesignOutput: TestDesignResponse;
  try {
    console.log('[Agent2 Started] Test Design Architect');
    
    // Passing requirementsOutput as input for Step 2
    testDesignOutput = await callTestDesignAgent(requirementsOutput);
    
    console.log('[Agent2 Completed] Test Design Architect');
  } catch (error: any) {
    console.error(`[Agent2 Failed] Test Design Architect encountered an error:`, error);
    return {
      success: false,
      failedAgent: 'TestDesignArchitect',
      error: error.message || 'Error occurred during BDD test scenario planning.',
    };
  }

  // ==========================================
  // STEP 3: Automation Architect Agent (AutomationEngineerAgent)
  // ==========================================
  let automationOutput: AutomationResponse;
  try {
    console.log('[Agent3 Started] Automation Architect');
    
    // Passing testDesignOutput as input for Step 3
    automationOutput = await callAutomationEngineerAgent(testDesignOutput);
    
    console.log('[Agent3 Completed] Automation Architect');
  } catch (error: any) {
    console.error(`[Agent3 Failed] Automation Architect encountered an error:`, error);
    return {
      success: false,
      failedAgent: 'AutomationArchitect',
      error: error.message || 'Error occurred during Playwright/Cypress script compilation.',
    };
  }

  // ==========================================
  // STEP 4: Execution & Insights Agent (QualityIntelligenceAgent)
  // ==========================================
  let qualityOutput: ExecutionResponse;
  try {
    console.log('[Agent4 Started] Execution & Insights');
    
    // Passing automationOutput as input for Step 4
    qualityOutput = await callQualityIntelligenceAgent(automationOutput);
    
    console.log('[Agent4 Completed] Execution & Insights');
  } catch (error: any) {
    console.error(`[Agent4 Failed] Execution Intelligence encountered an error:`, error);
    return {
      success: false,
      failedAgent: 'ExecutionIntelligence',
      error: error.message || 'Error occurred during CI/CD test execution simulation.',
    };
  }

  console.log('[Orchestrator] Multi-agent QA orchestration completed successfully.');

  return {
    success: true,
    requirementsOutput,
    testDesignOutput,
    automationOutput,
    qualityOutput,
  };
}
