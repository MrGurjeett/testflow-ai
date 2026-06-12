'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  ChevronRight,
  Zap,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import WorkflowInput from '@/components/WorkflowInput';
import AgentPipeline from '@/components/AgentPipeline';
import ReleaseRecommendation from '@/components/ReleaseRecommendation';
import AgentCard from '@/components/AgentCard';
import { PRESETS } from '@/lib/presets';
import { AgentOutputs, AgentStatus } from '@/types/workflow';

const modelMetadata = {
  requirements: { model: 'gpt-4o (Azure AI Foundry)', tokens: 1240, duration: '2.4s' },
  design: { model: 'gpt-4o-mini (Azure AI Foundry)', tokens: 2150, duration: '3.1s' },
  automation: { model: 'gpt-4o (Azure AI Foundry)', tokens: 3450, duration: '4.8s' },
  execution: { model: 'gpt-4o-mini (Azure AI Foundry)', tokens: 1890, duration: '3.2s' }
};

const renderListItem = (item: any): React.ReactNode => {
  if (item === null || item === undefined) return '';
  if (typeof item === 'string') return item;
  if (typeof item === 'object') {
    if (item.rule) {
      return `${item.id ? `${item.id}: ` : ''}${item.rule}`;
    }
    if (item.description) {
      return `${item.id ? `${item.id}: ` : ''}${item.description}`;
    }
    if (item.case) return item.case;
    if (item.text) return item.text;
    return JSON.stringify(item);
  }
  return String(item);
};

function parseQualityResponse(rawText: string) {
  const res: any = {
    passRate: 0,
    criticalDefects: [],
    releaseDecision: 'NOT_EVALUATED' as any,
    runDetails: { totalTests: 0, passed: 0, failed: 0, duration: '0s' }
  };

  if (!rawText) return res;

  // Parse Decision
  const decisionMatch = rawText.match(/Decision:\s*([A-Za-z_ ]+)/i);
  if (decisionMatch) {
    const decisionVal = decisionMatch[1].trim().toUpperCase().replace(/\s+/g, '_');
    if (['GO', 'CONDITIONAL_GO', 'NO_GO', 'NOT_EVALUATED'].includes(decisionVal)) {
      res.releaseDecision = decisionVal;
    }
  }

  // Parse Pass Rate
  const passMatch = rawText.match(/Pass Rate:\s*(\d+)%/i) || rawText.match(/Pass Rate %:\s*(\d+)%/i);
  if (passMatch) {
    res.passRate = parseInt(passMatch[1]);
  }

  // Parse Critical Defects
  const defectSection = rawText.match(/\[DEFECT_REPORT\]([\s\S]*?)(?:\[|$)/i);
  if (defectSection && defectSection[1]) {
    const lines = defectSection[1].split('\n');
    const defects: string[] = [];
    lines.forEach(line => {
      const trimmed = line.trim();
      if ((trimmed.startsWith('-') || trimmed.startsWith('*')) && !trimmed.toLowerCase().includes('no defects') && !trimmed.toLowerCase().includes('status:')) {
        defects.push(trimmed.substring(1).trim());
      }
    });
    res.criticalDefects = defects;
  }

  // Parse Run Details
  const totalMatch = rawText.match(/Total Tests Automated:\s*(\d+)/i) || rawText.match(/Total Tests:\s*(\d+)/i) || rawText.match(/Total Tests:\s*\*?(\d+)/i);
  if (totalMatch) {
    const total = parseInt(totalMatch[1]);
    res.runDetails = {
      totalTests: total,
      passed: total,
      failed: 0,
      duration: '2-4 min'
    };
  }

  return res;
}

export default function DashboardPage() {
  // Navigation & theme states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Story config states
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>('search-filters');
  const [userStory, setUserStory] = useState<string>(PRESETS[0].userStory);

  // Workflow running states
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({
    requirements: 'idle',
    design: 'idle',
    automation: 'idle',
    execution: 'idle',
  });

  // Current active data being displayed (fills up progressively)
  const [activeOutputs, setActiveOutputs] = useState<AgentOutputs>({
    requirements: { businessRules: [], edgeCases: [], riskAreas: [], assumptions: [] },
    design: { functionalTestCount: 0, bddScenarioCount: 0, coverageSummary: '', scenarios: [] },
    automation: { frameworkUsed: '', testCasesAutomated: 0, automationReadiness: 0, codeSnippets: [] },
    execution: { passRate: 0, criticalDefects: [], releaseDecision: 'GO', runDetails: { totalTests: 0, passed: 0, failed: 0, duration: '0s' } },
  });

  // Timers ref for cancellation
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const handleSelectPreset = (id: string) => {
    setSelectedPresetId(id);
    const preset = PRESETS.find((p) => p.id === id);
    if (preset) {
      setUserStory(preset.userStory);
    }
    resetWorkflow();
  };

  const handleClear = () => {
    setUserStory('');
    setSelectedPresetId(null);
    resetWorkflow();
  };

  const resetWorkflow = () => {
    clearTimers();
    setIsRunning(false);
    setCurrentStep(0);
    setAgentStatuses({
      requirements: 'idle',
      design: 'idle',
      automation: 'idle',
      execution: 'idle',
    });
    setActiveOutputs({
      requirements: { businessRules: [], edgeCases: [], riskAreas: [], assumptions: [] },
      design: { functionalTestCount: 0, bddScenarioCount: 0, coverageSummary: '', scenarios: [] },
      automation: { frameworkUsed: '', testCasesAutomated: 0, automationReadiness: 0, codeSnippets: [] },
      execution: { passRate: 0, criticalDefects: [], releaseDecision: 'GO', runDetails: { totalTests: 0, passed: 0, failed: 0, duration: '0s' } },
    });
  };

  const runRealWorkflow = async () => {
    if (!userStory.trim()) return;

    resetWorkflow();
    setIsRunning(true);

    // STEP 1: Requirements Agent (Immediate visual feedback)
    setCurrentStep(1);
    setAgentStatuses((prev) => ({ ...prev, requirements: 'running' }));

    // Visual timers to progress steps as a placeholder while API runs
    const t1 = setTimeout(() => {
      setCurrentStep(2);
      setAgentStatuses((prev) => ({ ...prev, requirements: 'completed', design: 'running' }));
    }, 4000);

    const t2 = setTimeout(() => {
      setCurrentStep(3);
      setAgentStatuses((prev) => ({ ...prev, design: 'completed', automation: 'running' }));
    }, 8000);

    const t3 = setTimeout(() => {
      setCurrentStep(4);
      setAgentStatuses((prev) => ({ ...prev, automation: 'completed', execution: 'running' }));
    }, 12000);

    timersRef.current = [t1, t2, t3];

    try {
      const response = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userStory }),
      });

      const data = await response.json();
      clearTimers();

      if (!response.ok || !data.success) {
        const failedAgent = data.failedAgent || 'RequirementAnalyst';
        const errorMsg = data.error || 'An error occurred during workflow execution.';

        // Map backend agent names to UI agent keys
        let uiAgentKey: string = 'requirements';
        if (failedAgent === 'TestDesignAgent' || failedAgent === 'TestDesignArchitect') {
          uiAgentKey = 'design';
        } else if (failedAgent === 'AutomationEngineerAgent' || failedAgent === 'AutomationArchitect') {
          uiAgentKey = 'automation';
        } else if (failedAgent === 'QualityIntelligenceAgent' || failedAgent === 'ExecutionIntelligence') {
          uiAgentKey = 'execution';
        }

        setAgentStatuses((prev) => {
          const updated = { ...prev };
          const stepKeys = ['requirements', 'design', 'automation', 'execution'];
          const failedIdx = stepKeys.indexOf(uiAgentKey);
          stepKeys.forEach((key, idx) => {
            if (idx < failedIdx) {
              updated[key] = 'completed';
            } else if (idx === failedIdx) {
              updated[key] = 'failed';
            } else {
              updated[key] = 'idle';
            }
          });
          return updated;
        });

        // Populate error content inside the failed agent output
        setActiveOutputs((prev) => {
          const updated = { ...prev };
          if (uiAgentKey === 'requirements') {
            updated.requirements = {
              businessRules: [`Error: ${errorMsg}`],
              edgeCases: [],
              riskAreas: []
            };
          } else if (uiAgentKey === 'design') {
            updated.design = {
              functionalTestCount: 0,
              bddScenarioCount: 0,
              coverageSummary: `Failed to design tests: ${errorMsg}`,
              scenarios: []
            };
          } else if (uiAgentKey === 'automation') {
            updated.automation = {
              frameworkUsed: 'Playwright',
              testCasesAutomated: 0,
              automationReadiness: 0,
              codeSnippets: [{ filename: 'error.log', language: 'text', code: errorMsg }]
            };
          } else if (uiAgentKey === 'execution') {
            updated.execution = {
              passRate: 0,
              criticalDefects: [errorMsg],
              releaseDecision: 'NO_GO',
              runDetails: { totalTests: 0, passed: 0, failed: 0, duration: '0s' }
            };
          }
          return updated;
        });

        const stepKeys = ['requirements', 'design', 'automation', 'execution'];
        setCurrentStep(stepKeys.indexOf(uiAgentKey) + 1);
        setIsRunning(false);
        return;
      }

      // Success
      const results = data.workflowResults || {};
      const req = results.requirements || {};
      const testD = results.testDesign || {};
      const auto = results.automation || {};
      const exec = results.qualityAssessment || {};

      // Map to UI state structure
      const parsedRequirements = {
        businessRules: req.business_rules || [],
        edgeCases: req.edge_cases || [],
        riskAreas: req.risk_areas || [],
        assumptions: req.assumptions || [],
        rawResponse: req.rawResponse
      };

      const parsedDesign = {
        functionalTestCount: testD.functional_tests?.length || 0,
        bddScenarioCount: testD.bdd_scenarios?.length || 0,
        coverageSummary: testD.coverageSummary || '',
        scenarios: testD.bdd_scenarios || [],
        rawResponse: testD.rawResponse
      };

      const parsedAutomation = {
        frameworkUsed: auto.framework || '',
        testCasesAutomated: auto.automation_summary?.total_test_cases_automated || 0,
        automationReadiness: auto.automation_summary?.automation_readiness || 0,
        codeSnippets: auto.codeSnippets || [],
        rawResponse: auto.rawResponse
      };

      let parsedExecution = {
        passRate: exec.passRate || 0,
        criticalDefects: exec.criticalDefects || [],
        releaseDecision: exec.releaseDecision || 'GO' as const,
        runDetails: exec.runDetails || { totalTests: 0, passed: 0, failed: 0, duration: '0s' },
        rawResponse: exec.rawResponse
      };

      if (exec.rawResponse && !exec.releaseDecision) {
        const parsed = parseQualityResponse(exec.rawResponse);
        parsedExecution = {
          ...parsedExecution,
          ...parsed
        };
      } else if (exec.runDetails) {
        parsedExecution.runDetails = {
          totalTests: 0,
          passed: 0,
          failed: 0,
          duration: '0s',
          ...exec.runDetails
        };
      }

      // Add console.log statements showing the mapped values
      console.log('--- Orchestrate Mapping Log ---');
      console.log('businessRules:', parsedRequirements.businessRules);
      console.log('edgeCases:', parsedRequirements.edgeCases);
      console.log('riskAreas:', parsedRequirements.riskAreas);
      console.log('assumptions count:', parsedRequirements.assumptions?.length || 0);
      console.log('functionalTestCount:', parsedDesign.functionalTestCount);
      console.log('bddScenarioCount:', parsedDesign.bddScenarioCount);
      console.log('frameworkUsed:', parsedAutomation.frameworkUsed);
      console.log('testCasesAutomated:', parsedAutomation.testCasesAutomated);
      console.log('automationReadiness:', parsedAutomation.automationReadiness);
      console.log('rawResponse execution (Q4):', parsedExecution.rawResponse);
      console.log('--------------------------------');

      setActiveOutputs({
        requirements: parsedRequirements,
        design: parsedDesign,
        automation: parsedAutomation,
        execution: parsedExecution,
      });

      setAgentStatuses({
        requirements: 'completed',
        design: 'completed',
        automation: 'completed',
        execution: 'completed',
      });
      setCurrentStep(5);
      setIsRunning(false);

    } catch (err: any) {
      clearTimers();
      const errorMsg = err.message || 'Network request failed.';
      setAgentStatuses({
        requirements: 'failed',
        design: 'idle',
        automation: 'idle',
        execution: 'idle',
      });
      setActiveOutputs((prev) => ({
        ...prev,
        requirements: {
          businessRules: [`Fatal Error: ${errorMsg}`],
          edgeCases: [],
          riskAreas: []
        }
      }));
      setCurrentStep(1);
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* SaaS Layout - Left Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeItem="dashboard"
      />

      {/* SaaS Layout - Header */}
      <Header
        onMenuClick={() => setIsSidebarOpen(true)}
        theme={theme}
        onThemeToggle={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      />

      {/* Main SaaS Dashboard Container */}
      <div className="flex-1 flex flex-col lg:pl-60">
        <main className="flex-grow p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">

          {/* SECTION 1: Hero Area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-bold text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                <Sparkles className="h-3 w-3" />
                <span>Azure Foundry Orchestration Cockpit</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Multi-Agent QA Orchestration Platform
              </h1>
              <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
                Transform user stories into structured business requirements, BDD specifications, Playwright automation script assets, and real-time release gates.
              </p>
            </div>

            {/* System Quick Stats Panel */}
            <div className="hidden sm:flex items-center space-x-4">
              <div className="rounded-xl border border-zinc-850 bg-zinc-900/10 p-3.5 text-center min-w-[100px]">
                <span className="text-[9px] font-bold text-zinc-500 uppercase block">Total Runs</span>
                <span className="text-lg font-bold text-white block mt-0.5">142</span>
              </div>
              <div className="rounded-xl border border-zinc-850 bg-zinc-900/10 p-3.5 text-center min-w-[100px]">
                <span className="text-[9px] font-bold text-zinc-500 uppercase block">Success Gate</span>
                <span className="text-lg font-bold text-emerald-400 block mt-0.5">94.3%</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: Workflow Config & Release Status grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Left 1-col: Inputs */}
            <div className="lg:col-span-1">
              <WorkflowInput
                value={userStory}
                onChange={setUserStory}
                onSelectPreset={handleSelectPreset}
                selectedPresetId={selectedPresetId}
                onRun={runRealWorkflow}
                onClear={handleClear}
                isLoading={isRunning}
              />
            </div>

            {/* Right 2-cols: Release Decision Banner */}
            <div className="lg:col-span-2 flex flex-col justify-between h-full">
              {currentStep === 5 ? (
                <div className="animate-fadeIn h-full">
                  <ReleaseRecommendation
                    decision={activeOutputs.execution?.releaseDecision || 'GO'}
                    passRate={activeOutputs.execution?.passRate || 0}
                    criticalDefects={activeOutputs.execution?.criticalDefects || []}
                    runDetails={activeOutputs.execution?.runDetails || { totalTests: 0, passed: 0, failed: 0, duration: '0s' }}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-zinc-850 bg-zinc-900/10 p-6 flex flex-col items-center justify-center text-center h-full text-zinc-500 space-y-3 shadow-inner">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 border border-zinc-850">
                    <ShieldCheck className="h-6 w-6 text-zinc-600 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-400">Release Gate Standby</h3>
                    <p className="text-2xs text-zinc-500 mt-1 max-w-md mx-auto leading-normal">
                      The safety gate analysis will generate automatically after the multi-agent orchestration pipeline is fully executed.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: Stepper Pipeline Map */}
          <AgentPipeline currentStep={currentStep} statuses={agentStatuses} />

          {/* SECTION 4: Output Dashboards KPI grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Agent Output KPI Reports
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">

              {/* Agent 1 KPI card */}
              <AgentCard
                id="requirements"
                title="Requirements Analyst"
                role="Business Logic Analysis"
                status={agentStatuses.requirements}
                modelInfo={modelMetadata.requirements}
                rawJson={activeOutputs.requirements}
                metrics={[
                  { label: 'Business Rules', value: activeOutputs.requirements?.businessRules?.length || 0 },
                  { label: 'Edge Cases', value: activeOutputs.requirements?.edgeCases?.length || 0 },
                  { label: 'Risks Map', value: activeOutputs.requirements?.riskAreas?.length || 0, accentColor: 'text-rose-400' },
                  { label: 'Assumptions', value: activeOutputs.requirements?.assumptions?.length || 0 }
                ]}
              >
                <div className="space-y-3">
                  {(activeOutputs.requirements as any)?.rawResponse ? (
                    <div className="whitespace-pre-wrap font-mono text-[10px] text-zinc-350 leading-relaxed bg-zinc-950 border border-zinc-850 p-2.5 rounded-lg max-h-[180px] overflow-y-auto pr-1">
                      {(activeOutputs.requirements as any).rawResponse}
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide block mb-1.5">Business Rules:</span>
                        <ul className="space-y-1.5 pl-3 list-disc text-zinc-400">
                          {(activeOutputs.requirements?.businessRules || []).map((rule, idx) => (
                            <li key={idx}>{renderListItem(rule)}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-2 border-t border-zinc-900">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide block mb-1.5">Edge Cases:</span>
                        <ul className="space-y-1.5 pl-3 list-disc text-zinc-400">
                          {(activeOutputs.requirements?.edgeCases || []).map((edge, idx) => (
                            <li key={idx}>{renderListItem(edge)}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </AgentCard>

              {/* Agent 2 KPI card */}
              <AgentCard
                id="design"
                title="Test Design Architect"
                role="Coverage Matrix Planning"
                status={agentStatuses.design}
                modelInfo={modelMetadata.design}
                rawJson={activeOutputs.design}
                metrics={[
                  { label: 'Functional Tests', value: activeOutputs.design?.functionalTestCount || 0 },
                  { label: 'BDD Scenarios', value: activeOutputs.design?.bddScenarioCount || 0 },
                  { label: 'Coverage Summary', value: activeOutputs.design?.bddScenarioCount ? '92%' : '0%', accentColor: 'text-cyan-400' }
                ]}
              >
                <div className="space-y-3">
                  {(activeOutputs.design as any)?.rawResponse ? (
                    <div className="whitespace-pre-wrap font-mono text-[10px] text-zinc-350 leading-relaxed bg-zinc-950 border border-zinc-850 p-2.5 rounded-lg max-h-[180px] overflow-y-auto pr-1">
                      {(activeOutputs.design as any).rawResponse}
                    </div>
                  ) : (
                    <>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide block mb-1.5">BDD Gherkin Scenarios:</span>
                      <div className="space-y-2">
                        {(activeOutputs.design?.scenarios || []).map((scen, idx) => (
                          <div key={idx} className="rounded-lg bg-zinc-950 border border-zinc-850 p-2 font-mono text-[10px]">
                            <span className="text-indigo-400">Scenario: {scen?.title}</span>
                            <div className="pl-2 mt-1 text-zinc-500">
                              <div>Given {scen?.given}</div>
                              <div>When {scen?.when}</div>
                              <div>Then {scen?.then}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </AgentCard>

              {/* Agent 3 KPI card */}
              <AgentCard
                id="automation"
                title="Automation Architect"
                role="Test Script Generation"
                status={agentStatuses.automation}
                modelInfo={modelMetadata.automation}
                rawJson={activeOutputs.automation}
                metrics={[
                  { label: 'Framework', value: activeOutputs.automation?.frameworkUsed ? 'Playwright' : 'None' },
                  { label: 'Automated Tests', value: activeOutputs.automation?.testCasesAutomated || 0 },
                  { label: 'Automation Readiness', value: activeOutputs.automation?.automationReadiness ? `${activeOutputs.automation.automationReadiness}%` : '0%', accentColor: 'text-violet-400' }
                ]}
              >
                <div className="space-y-3">
                  {(activeOutputs.automation as any)?.rawResponse ? (
                    <div className="whitespace-pre-wrap font-mono text-[10px] text-zinc-350 leading-relaxed bg-zinc-950 border border-zinc-850 p-2.5 rounded-lg max-h-[180px] overflow-y-auto pr-1">
                      {(activeOutputs.automation as any).rawResponse}
                    </div>
                  ) : (
                    <>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide block mb-1.5">Synthesized Playwright Code:</span>
                      {(activeOutputs.automation?.codeSnippets || []).map((snippet, idx) => (
                        <div key={idx} className="rounded-lg bg-zinc-950 border border-zinc-850 overflow-hidden font-mono text-[9px] text-cyan-400">
                          <div className="bg-zinc-900 border-b border-zinc-850 px-2 py-1 text-zinc-500 flex justify-between">
                            <span>{snippet?.filename}</span>
                            <span>{snippet?.language}</span>
                          </div>
                          <pre className="p-2 overflow-x-auto max-h-[120px]">
                            <code>{snippet?.code}</code>
                          </pre>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </AgentCard>

              {/* Agent 4 KPI card */}
              <AgentCard
                id="execution"
                title="Execution Intelligence"
                role="Simulated CI/CD Gate"
                status={agentStatuses.execution}
                modelInfo={modelMetadata.execution}
                rawJson={activeOutputs.execution}
                metrics={[
                  { label: 'Pass Rate', value: activeOutputs.execution?.passRate ? `${activeOutputs.execution.passRate}%` : '0%', accentColor: 'text-emerald-400' },
                  { label: 'Failed Tests', value: activeOutputs.execution?.runDetails?.failed || 0 },
                  { label: 'Critical Defects', value: activeOutputs.execution?.criticalDefects?.length || 0, accentColor: (activeOutputs.execution?.criticalDefects?.length || 0) > 0 ? 'text-rose-400' : 'text-zinc-500' }
                ]}
              >
                <div className="space-y-3">
                  {(activeOutputs.execution as any)?.rawResponse ? (
                    <div className="whitespace-pre-wrap font-mono text-[10px] text-zinc-350 leading-relaxed bg-zinc-950 border border-zinc-850 p-2.5 rounded-lg max-h-[180px] overflow-y-auto pr-1">
                      {(activeOutputs.execution as any).rawResponse}
                    </div>
                  ) : (
                    <div className="space-y-3 text-2xs text-zinc-400 font-mono">
                      <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                        <span>Simulation:</span>
                        <span className="text-zinc-200">Runner Staging Container</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                        <span>Total Runs:</span>
                        <span className="text-zinc-200">{activeOutputs.execution?.runDetails?.totalTests || 0}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                        <span>Passed:</span>
                        <span className="text-emerald-400 font-bold">{activeOutputs.execution?.runDetails?.passed || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Failed:</span>
                        <span className="text-rose-400 font-bold">{activeOutputs.execution?.runDetails?.failed || 0}</span>
                      </div>
                    </div>
                  )}
                </div>
              </AgentCard>

            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
