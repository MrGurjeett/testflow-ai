'use client';

import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  Clock,
  Activity
} from 'lucide-react';
import { ReleaseDecisionType } from '@/types/workflow';

interface ReleaseRecommendationProps {
  decision: ReleaseDecisionType;
  passRate: number | null;
  criticalDefects: string[];
  runDetails: {
    totalTests: number;
    passed: number;
    failed: number;
    duration: string;
  };
  automationCoverage?: number;
}

export default function ReleaseRecommendation({
  decision,
  passRate,
  criticalDefects,
  runDetails,
  automationCoverage = 0,
}: ReleaseRecommendationProps) {
  
  // Set up layout variables based on gate decision
  let titleColor = 'text-white';
  let badgeColor = 'bg-zinc-800 text-zinc-300 ring-zinc-700';
  let cardGlow = 'border-zinc-800 bg-zinc-950/40 shadow-xl';
  let recommendationText = 'Execute the multi-agent pipeline to generate safety compliance reviews.';
  let Icon = HelpCircle;
  let riskLevel = 'Undetermined';
  let riskColor = 'text-zinc-500';

  if (decision === 'GO' || decision === 'APPROVED') {
    titleColor = 'text-emerald-400';
    badgeColor = 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20';
    cardGlow = 'border-emerald-500/30 bg-emerald-950/10 shadow-[0_0_25px_rgba(16,185,129,0.08)]';
    recommendationText = 'Recommended for immediate production deployment. All automated regression tests have passed successfully, security gates are clear, and coverage meets deployment compliance targets.';
    Icon = ShieldCheck;
    riskLevel = 'Minimal Risk';
    riskColor = 'text-emerald-400';
  } else if (decision === 'CONDITIONAL_GO') {
    titleColor = 'text-amber-400';
    badgeColor = 'bg-amber-500/10 text-amber-400 ring-amber-500/20';
    cardGlow = 'border-amber-500/30 bg-amber-950/10 shadow-[0_0_25px_rgba(245,158,11,0.08)]';
    recommendationText = 'Redirection loops or minor UI warnings detected. Recommended for release with canary monitoring enabled. Ensure critical payment flow or core systems are manual regression-tested before complete rollout.';
    Icon = ShieldAlert;
    riskLevel = 'Medium Risk';
    riskColor = 'text-amber-400';
  } else if (decision === 'NO_GO' || decision === 'REJECTED') {
    titleColor = 'text-rose-400';
    badgeColor = 'bg-rose-500/10 text-rose-400 ring-rose-500/20';
    cardGlow = 'border-rose-500/35 bg-rose-950/10 shadow-[0_0_25px_rgba(244,63,94,0.08)]';
    recommendationText = 'Production deployment blocked. Critical security defects and failing unit/integration tests violate release safety gate thresholds. Require immediate engineering triage and ticket resolution.';
    Icon = ShieldX;
    riskLevel = 'High Risk Exposure';
    riskColor = 'text-rose-400';
  } else if (decision === 'NOT_EVALUATED') {
    titleColor = 'text-zinc-400';
    badgeColor = 'bg-zinc-800 text-zinc-400 ring-zinc-800';
    cardGlow = 'border-zinc-850 bg-zinc-950/20';
    recommendationText = 'Safety compliance analysis completed but release readiness is not evaluated. Actual test execution evidence is pending.';
    Icon = HelpCircle;
    riskLevel = 'Not Evaluated';
    riskColor = 'text-zinc-500';
  }

  // Circular progress calculations
  const radius = 32;
  const strokeDasharray = 2 * Math.PI * radius;
  const displayPassRate = passRate === null || passRate === undefined ? 0 : passRate;
  const strokeDashoffset = strokeDasharray - (displayPassRate / 100) * strokeDasharray;

  return (
    <div className={`rounded-2xl border p-6 transition-all duration-500 ${cardGlow}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Release Status & Text Recommendations */}
        <div className="space-y-4 flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
              Azure AI Foundry Security Gate
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 border border-zinc-800">
              <Icon className={`h-6.5 w-6.5 ${titleColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-2xl font-extrabold tracking-tight ${titleColor}`}>
                  {decision.replace('_', ' ')}
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-2xs font-semibold ring-1 ring-inset ${badgeColor}`}>
                  Release Recommendation
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
            {recommendationText}
          </p>
        </div>

        {/* Circular Metrics Dashboard */}
        <div className="flex items-center space-x-6 border-t md:border-t-0 md:border-l border-zinc-850 pt-6 md:pt-0 md:pl-8">
          
          {/* Circular Pass Rate */}
          <div className="relative flex items-center justify-center flex-shrink-0">
            <svg className="w-22 h-22 transform -rotate-90">
              <circle
                cx="44"
                cy="44"
                r={radius}
                className="stroke-zinc-850"
                strokeWidth="5"
                fill="transparent"
              />
              <circle
                cx="44"
                cy="44"
                r={radius}
                className={`transition-all duration-1000 ease-out ${
                  decision === 'GO'
                    ? 'stroke-emerald-500'
                    : decision === 'CONDITIONAL_GO'
                    ? 'stroke-amber-500'
                    : 'stroke-rose-500'
                }`}
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-sm font-extrabold text-white font-mono block leading-none">
                {passRate === null || passRate === undefined ? 'N/A' : `${passRate}%`}
              </span>
              <span className="text-[8px] text-zinc-500 uppercase font-semibold">Pass Rate</span>
            </div>
          </div>

          {/* Metadata KPI Metrics list */}
          <div className="space-y-2 font-mono text-2xs text-zinc-400 min-w-[150px]">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Duration:
              </span>
              <span className="font-semibold text-zinc-200">{runDetails.duration}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 flex items-center gap-1">
                <Activity className="h-3 w-3" /> Risk Level:
              </span>
              <span className={`font-semibold ${riskColor}`}>{riskLevel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Defects:
              </span>
              <span className={`font-semibold ${criticalDefects.length > 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                {criticalDefects.length} Critical
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Critical Defects audit */}
      {criticalDefects.length > 0 && (
        <div className="mt-6 border-t border-zinc-850 pt-6">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            <span>Unresolved Critical Safety Issues ({criticalDefects.length})</span>
          </h4>
          <div className="rounded-xl bg-rose-950/10 border border-rose-500/10 p-4">
            <ul className="space-y-2">
              {criticalDefects.map((defect, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-rose-300 font-mono">
                  <XCircle className="h-3.5 w-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <span>{defect}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Audit scores list */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg bg-zinc-950/40 border border-zinc-850 p-2.5 flex items-center justify-between text-2xs">
          <span className="text-zinc-500">Security Scans</span>
          <span className={`font-bold flex items-center gap-1 ${
            decision === 'NOT_EVALUATED'
              ? 'text-zinc-500'
              : decision === 'NO_GO'
              ? 'text-rose-400'
              : 'text-emerald-400'
          }`}>
            {decision === 'NOT_EVALUATED' ? (
              <HelpCircle className="h-3 w-3" />
            ) : decision === 'NO_GO' ? (
              <XCircle className="h-3 w-3" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            {decision === 'NOT_EVALUATED' ? 'PENDING' : decision === 'NO_GO' ? 'FAIL' : 'PASS'}
          </span>
        </div>
        <div className="rounded-lg bg-zinc-950/40 border border-zinc-850 p-2.5 flex items-center justify-between text-2xs">
          <span className="text-zinc-500">Automation Matrix</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {automationCoverage}% COVERED
          </span>
        </div>
        <div className="rounded-lg bg-zinc-950/40 border border-zinc-850 p-2.5 flex items-center justify-between text-2xs">
          <span className="text-zinc-500">Quality Gates</span>
          <span className={`font-bold flex items-center gap-1 ${
            decision === 'NOT_EVALUATED'
              ? 'text-zinc-500'
              : runDetails.failed > 0
              ? 'text-amber-400'
              : 'text-emerald-400'
          }`}>
            {decision === 'NOT_EVALUATED' ? (
              <HelpCircle className="h-3 w-3" />
            ) : runDetails.failed > 0 ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            {decision === 'NOT_EVALUATED' ? 'PENDING' : runDetails.failed > 0 ? 'WARNING' : 'PASSED'}
          </span>
        </div>
      </div>
    </div>
  );
}
