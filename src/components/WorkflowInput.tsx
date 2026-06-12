'use client';

import React from 'react';
import { Play, RotateCcw, AlertCircle, FileText } from 'lucide-react';
import { PRESETS } from '@/lib/presets';

interface WorkflowInputProps {
  value: string;
  onChange: (val: string) => void;
  onRun: () => void;
  onClear: () => void;
  isLoading: boolean;
  onSelectPreset: (presetId: string) => void;
  selectedPresetId: string | null;
}

export default function WorkflowInput({
  value,
  onChange,
  onRun,
  onClear,
  isLoading,
  onSelectPreset,
  selectedPresetId,
}: WorkflowInputProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col space-y-5">

        {/* Dropdown for Preset Select */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <label htmlFor="preset-select" className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5 min-w-0">
              <FileText className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
              <span>Load Template / Preset Scenario</span>
            </label>
            {selectedPresetId && (
              <span className="text-[10px] text-zinc-500 font-semibold font-mono flex-shrink-0 whitespace-nowrap">
                Preset ID: {selectedPresetId}
              </span>
            )}
          </div>

          <select
            id="preset-select"
            value={selectedPresetId || ''}
            onChange={(e) => onSelectPreset(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-zinc-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          >
            <option value="" disabled>-- Select a workflow scenario --</option>
            {PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.title}
              </option>
            ))}
          </select>
        </div>

        {/* User Story Textarea */}
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-2">
            <label htmlFor="story-input" className="text-xs font-bold text-zinc-400 uppercase tracking-wider min-w-0">
              Product Specification / User Story
            </label>
            <span className="text-3xs font-mono text-zinc-500 bg-zinc-900 border border-zinc-800/80 px-2 py-0.5 rounded flex-shrink-0 whitespace-nowrap">
              {value.length} characters
            </span>
          </div>
          <textarea
            id="story-input"
            rows={5}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={isLoading}
            placeholder="As a developer, I want to describe user workflows here so the agent pipeline can validate it..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-zinc-200 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 leading-relaxed font-mono resize-none"
          />
        </div>

        {/* Interactive Controls Buttons */}
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex items-start space-x-2 text-3xs text-zinc-500 leading-normal">
            <AlertCircle className="h-4 w-4 text-zinc-600 flex-shrink-0" />
            <span>AI Foundry agents will analyze and automate the selected user story.</span>
          </div>

          <div className="flex items-center space-x-2 justify-end">
            {/* Clear Button */}
            <button
              type="button"
              onClick={onClear}
              disabled={isLoading || !value}
              className="flex items-center space-x-1.5 rounded-xl border border-zinc-850 hover:border-zinc-700 bg-zinc-900/40 px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>

            {/* Run Button */}
            <button
              type="button"
              onClick={onRun}
              disabled={isLoading || !value.trim()}
              className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-550 hover:to-cyan-450 px-5 py-2.5 text-xs font-bold text-[#fff] shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-[#fff]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Run Workflow</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
