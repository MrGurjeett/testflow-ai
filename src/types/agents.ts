export interface RequirementsAnalysisResponse {
  businessRules: string[];
  edgeCases: string[];
  riskAreas: string[];
  assumptions?: string[];
}

export interface TestDesignResponse {
  functionalTestCount: number;
  bddScenarioCount: number;
  coverageSummary: string;
  scenarios: {
    title: string;
    given: string;
    when: string;
    then: string;
  }[];
}

export interface AutomationResponse {
  frameworkUsed: string;
  testCasesAutomated: number;
  automationReadiness: number;
  codeSnippets: {
    filename: string;
    language: string;
    code: string;
  }[];
}

export interface ExecutionResponse {
  passRate: number | null;
  criticalDefects: string[];
  releaseDecision: 'GO' | 'CONDITIONAL_GO' | 'NO_GO';
  runDetails: {
    totalTests: number;
    passed: number;
    failed: number;
    duration: string;
  };
}

export interface OrchestrationRequest {
  userStory: string;
}

export interface OrchestrationSuccessResponse {
  success: true;
  requirementsOutput: RequirementsAnalysisResponse;
  testDesignOutput: TestDesignResponse;
  automationOutput: AutomationResponse;
  testExecutionOutput?: any;
  resultAggregatorOutput?: any;
  qualityOutput: ExecutionResponse;
  timings?: {
    agent1: number;
    agent2: number;
    agent3: number;
    agent4: number;
    agent5: number;
    agent6: number;
  };
}

export interface OrchestrationFailureResponse {
  success: false;
  failedAgent: 'RequirementsAnalyst' | 'TestDesignArchitect' | 'AutomationArchitect' | 'TestExecutionAgent' | 'ResultAggregatorAgent' | 'ExecutionIntelligence';
  error: string;
}

export type OrchestrationResponse = OrchestrationSuccessResponse | OrchestrationFailureResponse;
