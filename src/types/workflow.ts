export type AgentType = 'requirements' | 'design' | 'automation' | 'execution';

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed';

export type ReleaseDecisionType = 'GO' | 'CONDITIONAL_GO' | 'NO_GO' | 'NOT_EVALUATED' | 'APPROVED' | 'REJECTED';

export interface RequirementsOutput {
  businessRules: string[];
  edgeCases: string[];
  riskAreas: string[];
  assumptions?: string[];
}

export interface TestDesignOutput {
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

export interface AutomationOutput {
  frameworkUsed: string;
  testCasesAutomated: number;
  automationReadiness: number; // Percentage
  codeSnippets: {
    filename: string;
    language: string;
    code: string;
  }[];
}

export interface ExecutionOutput {
  passRate: number | null; // Percentage
  criticalDefects: string[];
  releaseDecision: ReleaseDecisionType;
  runDetails: {
    totalTests: number;
    passed: number;
    failed: number;
    duration: string;
  };
}

export interface AgentOutputs {
  requirements: RequirementsOutput;
  design: TestDesignOutput;
  automation: AutomationOutput;
  testExecution?: any;
  resultAggregator?: any;
  execution: ExecutionOutput;
}

export interface WorkflowPreset {
  id: string;
  title: string;
  description: string;
  userStory: string;
  outputs: AgentOutputs;
  metadata: {
    requirements: { model: string; tokens: number; duration: string };
    design: { model: string; tokens: number; duration: string };
    automation: { model: string; tokens: number; duration: string };
    execution: { model: string; tokens: number; duration: string };
  };
}
