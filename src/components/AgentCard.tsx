'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Terminal, 
  Settings, 
  Bot, 
  ChevronDown, 
  ChevronUp, 
  FileJson 
} from 'lucide-react';
import { AgentStatus } from '@/types/workflow';
import MetricsCard from './MetricsCard';

interface MetricItem {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: any;
  accentColor?: string;
}

interface AgentCardProps {
  id: string;
  title: string;
  role: string;
  status: AgentStatus;
  modelInfo?: { model: string; tokens: number; duration: string };
  rawJson: object;
  metrics: MetricItem[];
  children: React.ReactNode; // Deep detailed logs
}

export default function AgentCard({
  id,
  title,
  role,
  status,
  modelInfo,
  rawJson,
  metrics,
  children,
}: AgentCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'rich' | 'json'>('rich');

  // Colors mapping based on status
  let statusBadge = 'bg-zinc-900 text-zinc-500 border-zinc-800';
  let cardBorder = 'border-zinc-850 bg-zinc-950/20';
  let pulseGlow = '';

  if (status === 'running') {
    statusBadge = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 animate-pulse';
    cardBorder = 'border-indigo-500/40 bg-indigo-950/5';
    pulseGlow = 'shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/10';
  } else if (status === 'completed') {
    statusBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/35';
    cardBorder = 'border-zinc-850 bg-zinc-950/40 hover:border-zinc-800';
  } else if (status === 'failed') {
    statusBadge = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    cardBorder = 'border-rose-500/30 bg-rose-950/5';
  }

  // Choose Icon based on Agent ID
  const renderAgentIcon = () => {
    const iconClass = "h-4.5 w-4.5";
    switch (id) {
      case 'requirements':
        return <FileText className={`${iconClass} text-indigo-400`} />;
      case 'design':
        return <Bot className={`${iconClass} text-cyan-400`} />;
      case 'automation':
        return <Settings className={`${iconClass} text-violet-400`} />;
      case 'execution':
        return <Terminal className={`${iconClass} text-emerald-400`} />;
      default:
        return <Bot className={iconClass} />;
    }
  };

  return (
    <div className={`rounded-2xl border flex flex-col justify-between transition-all duration-300 ${cardBorder} ${pulseGlow} h-full`}>
      
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 p-5">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 border border-zinc-850 flex-shrink-0">
            {renderAgentIcon()}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-white text-xs sm:text-sm truncate">{title}</h3>
            <span className="text-[10px] font-mono text-zinc-500 block truncate mt-0.5">
              {role}
            </span>
          </div>
        </div>

        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase flex-shrink-0 ${statusBadge}`}>
          {status}
        </span>
      </div>

      {/* Card Body - KPI Metrics display */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        
        {status === 'idle' && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-zinc-600">
            <Bot className="h-10 w-10 opacity-30 mb-2.5 animate-pulse" />
            <span className="text-2xs font-semibold uppercase tracking-wider">Awaiting Execution</span>
          </div>
        )}

        {status === 'running' && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-indigo-400">
            <svg className="animate-spin h-8 w-8 text-indigo-500 mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-2xs font-bold font-mono animate-pulse tracking-wide uppercase">
              Orchestrating Azure LLM...
            </span>
          </div>
        )}

        {(status === 'completed' || status === 'failed') && (
          <div className="space-y-4 w-full">
            {/* KPI Metrics */}
            <MetricsCard metrics={metrics} />

            {/* Collapsible Panel details */}
            {showDetails && (
              <div className="border-t border-zinc-900 pt-4 mt-4 animate-fadeIn space-y-3">
                {/* View Details tabs */}
                <div className="flex items-center justify-between bg-zinc-950 p-0.5 rounded-lg border border-zinc-850 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setViewMode('rich')}
                    className={`flex-1 rounded-md py-1 transition-colors ${
                      viewMode === 'rich' ? 'bg-zinc-850 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Formatted Outputs
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('json')}
                    className={`flex-1 rounded-md py-1 transition-colors flex items-center justify-center gap-1 ${
                      viewMode === 'json' ? 'bg-zinc-850 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <FileJson className="h-3 w-3" />
                    <span>Raw JSON Schema</span>
                  </button>
                </div>

                {/* Tab content */}
                {viewMode === 'rich' ? (
                  <div className="text-zinc-300 text-xs leading-relaxed max-h-[220px] overflow-y-auto scrollbar-thin pr-1">
                    {children}
                  </div>
                ) : (
                  <pre className="overflow-x-auto rounded-xl bg-zinc-950 border border-zinc-850 p-3 text-[10px] font-mono text-cyan-400 max-h-[200px] leading-tight">
                    <code>{JSON.stringify(rawJson, null, 2)}</code>
                  </pre>
                )}

                {/* Model telemetry parameters */}
                {modelInfo && (
                  <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 pt-2 border-t border-zinc-900">
                    <span>Model: {modelInfo.model.split(' ')[0]}</span>
                    <span>Tokens: {modelInfo.tokens}</span>
                    <span>Latency: {modelInfo.duration}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* View Details Button (Bottom) */}
        {(status === 'completed' || status === 'failed') && (
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full mt-4 flex items-center justify-center space-x-1 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <span>{showDetails ? 'Hide Details' : 'View Details Deliverables'}</span>
            {showDetails ? (
              <ChevronUp className="h-4 w-4 text-zinc-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-zinc-500" />
            )}
          </button>
        )}

      </div>
    </div>
  );
}
