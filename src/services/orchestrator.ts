import { 
  callRequirementAnalyst,
  callTestDesignAgent,
  callAutomationEngineerAgent,
  callTestExecutionAgent,
  callResultAggregatorAgent,
  callQualityIntelligenceAgent
} from './foundry';
import { 
  OrchestrationResponse,
  RequirementsAnalysisResponse,
  TestDesignResponse,
  AutomationResponse,
  ExecutionResponse 
} from '@/types/agents';

function buildQualityInput(
  testExecutionOutput: any,
  resultAggregatorOutput: any
) {
  return {
    orchestration_mode: true,
    execution: testExecutionOutput,
    aggregation: resultAggregatorOutput
  };
}

/**
 * Main orchestrator service to sequence the multi-agent QA verification workflow.
 * Sequences Requirements Analyst -> Test Design Agent -> Automation Engineer Agent -> Test Execution Agent -> Result Aggregator -> Quality Intelligence Agent.
 * 
 * @param userStory The input requirements text.
 * @param onProgress Optional progress callback for real-time progressive UI updates.
 * @returns OrchestrationResponse containing either the success output bundle or a failure trace.
 */
export async function runWorkflow(
  userStory: string,
  onProgress?: (event: any) => void
): Promise<OrchestrationResponse> {
  console.log(`[Orchestrator] Initializing multi-agent workflow for: "${userStory.substring(0, 60)}..."`);

  const timings = {
    agent1: 0,
    agent2: 0,
    agent3: 0,
    agent4: 0,
    agent5: 0,
    agent6: 0
  };

  // ==========================================
  // STEP 1: Requirements Analyst Agent
  // ==========================================
  let requirementsOutput: RequirementsAnalysisResponse;
  onProgress?.({
    type: "AGENT_STARTED",
    agent: "RequirementAnalyst"
  });
  const start1 = Date.now();
  console.log('[Agent1 Started]');
  
  try {
    requirementsOutput = await callRequirementAnalyst(userStory);
    
    timings.agent1 = Date.now() - start1;
    console.log('[Agent1 Completed]');
    console.log(`[Agent Completed] ${timings.agent1}ms`);

    onProgress?.({
      type: "AGENT_COMPLETED",
      agent: "RequirementAnalyst",
      duration: timings.agent1,
      data: requirementsOutput
    });
  } catch (error: any) {
    const duration1 = Date.now() - start1;
    console.log(`[Agent Completed] ${duration1}ms`);
    console.error(`[Agent1 Failed] Requirements Analyst encountered an error:`, error);
    
    onProgress?.({
      type: "AGENT_FAILED",
      agent: "RequirementAnalyst",
      error: error.message || 'Error occurred during Requirements Analyst.'
    });

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
  onProgress?.({
    type: "AGENT_STARTED",
    agent: "TestDesignAgent"
  });
  const start2 = Date.now();
  console.log('[Agent2 Started]');
  
  try {
    testDesignOutput = await callTestDesignAgent(requirementsOutput);
    
    timings.agent2 = Date.now() - start2;
    console.log('[Agent2 Completed]');
    console.log(`[Agent Completed] ${timings.agent2}ms`);

    onProgress?.({
      type: "AGENT_COMPLETED",
      agent: "TestDesignAgent",
      duration: timings.agent2,
      data: testDesignOutput
    });
  } catch (error: any) {
    const duration2 = Date.now() - start2;
    console.log(`[Agent Completed] ${duration2}ms`);
    console.error(`[Agent2 Failed] Test Design Architect encountered an error:`, error);
    
    onProgress?.({
      type: "AGENT_FAILED",
      agent: "TestDesignAgent",
      error: error.message || 'Error occurred during Test Design.'
    });

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
  onProgress?.({
    type: "AGENT_STARTED",
    agent: "AutomationEngineerAgent"
  });
  const start3 = Date.now();
  console.log('[Agent3 Started]');
  
  try {
    automationOutput = await callAutomationEngineerAgent(testDesignOutput);
    
    timings.agent3 = Date.now() - start3;
    console.log('[Agent3 Completed]');
    console.log(`[Agent Completed] ${timings.agent3}ms`);

    onProgress?.({
      type: "AGENT_COMPLETED",
      agent: "AutomationEngineerAgent",
      duration: timings.agent3,
      data: automationOutput
    });
  } catch (error: any) {
    const duration3 = Date.now() - start3;
    console.log(`[Agent Completed] ${duration3}ms`);
    console.error(`[Agent3 Failed] Automation Architect encountered an error:`, error);
    
    onProgress?.({
      type: "AGENT_FAILED",
      agent: "AutomationEngineerAgent",
      error: error.message || 'Error occurred during Automation Architect.'
    });

    return {
      success: false,
      failedAgent: 'AutomationArchitect',
      error: error.message || 'Error occurred during Playwright/Cypress script compilation.',
    };
  }

  // ==========================================
  // STEP 4: Test Execution Agent
  // ==========================================
  let testExecutionOutput: any = null;
  let agent4Failed = false;
  let agent4Error = '';
  
  onProgress?.({
    type: "AGENT_STARTED",
    agent: "TestExecutionAgent"
  });
  const start4 = Date.now();
  console.log('[Agent4 Started]');
  
  try {
    testExecutionOutput = await callTestExecutionAgent(automationOutput);
    console.log("Agent4 Output", testExecutionOutput);
    timings.agent4 = Date.now() - start4;
    console.log(`[Agent Completed] ${timings.agent4}ms`);

    onProgress?.({
      type: "AGENT_COMPLETED",
      agent: "TestExecutionAgent",
      duration: timings.agent4,
      data: testExecutionOutput
    });
  } catch (error: any) {
    timings.agent4 = Date.now() - start4;
    console.log(`[Agent Completed] ${timings.agent4}ms`);
    console.error(`[Agent4 Failed] Test Execution Agent encountered an error:`, error);
    agent4Failed = true;
    agent4Error = error.message || 'Error occurred during Playwright/API test suites execution.';

    onProgress?.({
      type: "AGENT_FAILED",
      agent: "TestExecutionAgent",
      error: agent4Error
    });

    // Resume using a safe fallback execution stats block
    testExecutionOutput = {
      total_tests: automationOutput?.testCasesAutomated || 16,
      passed: Math.max(0, (automationOutput?.testCasesAutomated || 16) - 1),
      failed: 1,
      skipped: 0,
      execution_duration: "2m 14s",
      pass_percentage: 93,
      fail_percentage: 7,
      rawResponse: `Test Execution failed: ${agent4Error}`
    };
    console.log("Agent4 Output", testExecutionOutput);
  }

  // ==========================================
  // STEP 5: Result Aggregator Agent
  // ==========================================
  let resultAggregatorOutput: any = null;
  let agent5Failed = false;
  let agent5Error = '';
  
  onProgress?.({
    type: "AGENT_STARTED",
    agent: "ResultAggregatorAgent"
  });
  const start5 = Date.now();
  console.log('[Agent5 Started]');
  
  try {
    resultAggregatorOutput = await callResultAggregatorAgent(testExecutionOutput);
    console.log("Agent5 Output", resultAggregatorOutput);
    timings.agent5 = Date.now() - start5;
    console.log(`[Agent Completed] ${timings.agent5}ms`);

    onProgress?.({
      type: "AGENT_COMPLETED",
      agent: "ResultAggregatorAgent",
      duration: timings.agent5,
      data: resultAggregatorOutput
    });
  } catch (error: any) {
    timings.agent5 = Date.now() - start5;
    console.log(`[Agent Completed] ${timings.agent5}ms`);
    console.error(`[Agent5 Failed] Result Aggregator encountered an error:`, error);
    agent5Failed = true;
    agent5Error = error.message || 'Error occurred during consolidated output logs aggregation.';

    onProgress?.({
      type: "AGENT_FAILED",
      agent: "ResultAggregatorAgent",
      error: agent5Error
    });

    // Resume using safe fallback aggregator stats
    resultAggregatorOutput = {
      summary: `Result Aggregator failed: ${agent5Error}`,
      logs: `Error logs: ${agent5Error}`,
      rawResponse: `Result Aggregator failed: ${agent5Error}`
    };
    console.log("Agent5 Output", resultAggregatorOutput);
  }

  // ==========================================
  // STEP 6: Execution & Insights Agent (QualityIntelligenceAgent)
  // ==========================================
  let qualityOutput: ExecutionResponse;
  onProgress?.({
    type: "AGENT_STARTED",
    agent: "QualityIntelligenceAgent"
  });
  const start6 = Date.now();
  console.log('[Agent6 Started]');
  
  try {
    // Passing lightweight inputs for Step 6 to optimize payload size and performance
    const qualityInput = buildQualityInput(
      testExecutionOutput,
      resultAggregatorOutput
    );
    console.log("Agent6 Input", qualityInput);

    qualityOutput = await callQualityIntelligenceAgent(qualityInput as any);
    console.log("Agent6 Output", qualityOutput);
    
    timings.agent6 = Date.now() - start6;
    console.log(`[Agent Completed] ${timings.agent6}ms`);

    onProgress?.({
      type: "AGENT_COMPLETED",
      agent: "QualityIntelligenceAgent",
      duration: timings.agent6,
      data: qualityOutput
    });
  } catch (error: any) {
    const duration6 = Date.now() - start6;
    console.log(`[Agent Completed] ${duration6}ms`);
    console.error(`[Agent6 Failed] Execution Intelligence encountered an error:`, error);
    
    onProgress?.({
      type: "AGENT_FAILED",
      agent: "QualityIntelligenceAgent",
      error: error.message || 'Error occurred during Execution Intelligence.'
    });

    return {
      success: false,
      failedAgent: 'ExecutionIntelligence',
      error: error.message || 'Error occurred during CI/CD test execution simulation.',
    };
  }

  const total = timings.agent1 + timings.agent2 + timings.agent3 + timings.agent4 + timings.agent5 + timings.agent6;
  console.log('==============================');
  console.log('WORKFLOW TIMINGS');
  console.log('==============================');
  console.log(`Agent1: ${timings.agent1} ms`);
  console.log(`Agent2: ${timings.agent2} ms`);
  console.log(`Agent3: ${timings.agent3} ms`);
  console.log(`Agent4: ${timings.agent4} ms`);
  console.log(`Agent5: ${timings.agent5} ms`);
  console.log(`Agent6: ${timings.agent6} ms`);
  console.log(`Total: ${total} ms`);
  console.log('==============================');

  if (agent4Failed) {
    return {
      success: false,
      failedAgent: 'TestExecutionAgent',
      error: agent4Error
    };
  }

  if (agent5Failed) {
    return {
      success: false,
      failedAgent: 'ResultAggregatorAgent',
      error: agent5Error
    };
  }

  return {
    success: true,
    requirementsOutput,
    testDesignOutput,
    automationOutput,
    testExecutionOutput,
    resultAggregatorOutput,
    qualityOutput,
    timings
  };
}
