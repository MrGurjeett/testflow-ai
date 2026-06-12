'use client';

import React from 'react';
import { 
  ClipboardList, 
  Layers, 
  Code2, 
  Gauge, 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  ArrowDown 
} from 'lucide-react';
import { AgentStatus } from '@/types/workflow';

interface PipelineStep {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 'requirements',
    name: 'Requirements Analyst',
    description: 'Validates business rules and constraints.',
    icon: ClipboardList,
    color: 'indigo',
  },
  {
    id: 'design',
    name: 'Test Design Architect',
    description: 'Structures test plans and BDD steps.',
    icon: Layers,
    color: 'cyan',
  },
  {
    id: 'automation',
    name: 'Automation Architect',
    description: 'Generates spec scripts automatically.',
    icon: Code2,
    color: 'violet',
  },
  {
    id: 'execution',
    name: 'Execution Intelligence',
    description: 'Simulates runner and verifies gates.',
    icon: Gauge,
    color: 'emerald',
  },
];

interface AgentPipelineProps {
  currentStep: number; // 1 to 4, 0 = idle, 5 = completed
  statuses: Record<string, AgentStatus>;
}

export default function AgentPipeline({ currentStep, statuses }: AgentPipelineProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 shadow-xl backdrop-blur-md">
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
            Agent Pipelines Orchestration
          </h2>
          <p className="text-xs text-zinc-500">
            Incremental multi-agent workflow powered by Azure AI Foundry
          </p>
        </div>

        {/* Pipeline Layout (Responsive) */}
        <div className="flex flex-col lg:flex-row lg:items-stretch lg:justify-between gap-4 lg:gap-2 relative">
          
          {PIPELINE_STEPS.map((step, idx) => {
            const status = statuses[step.id] || 'idle';
            const isActive = currentStep === idx + 1;
            const isCompleted = status === 'completed';
            const Icon = step.icon;

            // Compute border and card colors based on step state
            let cardClasses = 'border-zinc-850 bg-zinc-900/10 text-zinc-400';
            let iconBoxClasses = 'bg-zinc-950 border-zinc-800 text-zinc-500';
            let badgeStyle = 'bg-zinc-900 text-zinc-500 border-zinc-800';

            if (isCompleted) {
              cardClasses = 'border-emerald-500/35 bg-emerald-950/5 text-zinc-300 shadow-md shadow-emerald-500/5';
              iconBoxClasses = 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400';
              badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            } else if (isActive) {
              cardClasses = 'border-indigo-500/60 bg-indigo-950/10 text-zinc-200 ring-1 ring-indigo-500/10 shadow-lg shadow-indigo-500/5';
              iconBoxClasses = 'bg-indigo-950/30 border-indigo-500/40 text-indigo-400';
              badgeStyle = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse';
            }

            return (
              <React.Fragment key={step.id}>
                {/* Agent Node Card */}
                <div className={`flex-1 rounded-xl border p-4 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] ${cardClasses}`}>
                  
                  {/* Card Top Block */}
                  <div className="flex items-start justify-between">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${iconBoxClasses}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    {/* Status Badge */}
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${badgeStyle}`}>
                      {status === 'running' ? (
                        <span className="flex items-center gap-1 font-semibold">
                          <Loader2 className="animate-spin h-2.5 w-2.5" />
                          <span>Active</span>
                        </span>
                      ) : isCompleted ? (
                        <span className="flex items-center gap-0.5 font-semibold">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          <span>Done</span>
                        </span>
                      ) : (
                        <span>Idle</span>
                      )}
                    </span>
                  </div>

                  {/* Card Description Block */}
                  <div className="mt-4">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Agent 0{idx + 1}</span>
                    <h4 className="text-xs font-bold text-white mt-0.5">{step.name}</h4>
                    <p className="text-[10px] text-zinc-400 leading-normal mt-1 min-h-[30px] line-clamp-2">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Connection Line Indicator (Desktop & Mobile arrows) */}
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div className="flex items-center justify-center py-1.5 lg:py-0 px-2">
                    {/* Horizontal Connector Line for Desktop */}
                    <div className="hidden lg:block relative w-6 h-px">
                      <div className={`absolute inset-0 bg-zinc-800 ${isCompleted ? 'bg-indigo-500/50' : ''}`} />
                      <ArrowRight className={`h-4.5 w-4.5 absolute -top-[8px] -left-1 text-zinc-700 ${
                        isCompleted ? 'text-indigo-400 animate-pulse' : ''
                      }`} />
                    </div>

                    {/* Vertical Connector Line for Mobile */}
                    <div className="lg:hidden flex flex-col items-center py-0.5">
                      <ArrowDown className={`h-4 w-4 text-zinc-700 ${
                        isCompleted ? 'text-indigo-400 animate-bounce' : ''
                      }`} />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}

        </div>
      </div>
    </div>
  );
}
