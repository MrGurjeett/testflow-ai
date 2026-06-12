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
  passRate: number;
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
  qualityOutput: ExecutionResponse;
}

export interface OrchestrationFailureResponse {
  success: false;
  failedAgent: 'RequirementsAnalyst' | 'TestDesignArchitect' | 'AutomationArchitect' | 'ExecutionIntelligence';
  error: string;
}

export type OrchestrationResponse = OrchestrationSuccessResponse | OrchestrationFailureResponse;
