'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricItem {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  accentColor?: string; // e.g. text-indigo-400
}

interface MetricsCardProps {
  metrics: MetricItem[];
}

export default function MetricsCard({ metrics }: MetricsCardProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {metrics.map((metric, i) => {
        const Icon = metric.icon;
        const colorClass = metric.accentColor || 'text-indigo-400';

        return (
          <div 
            key={i} 
            className="rounded-xl border border-zinc-850 bg-zinc-950/50 p-4 transition-all duration-300 hover:border-zinc-800 flex flex-col justify-between shadow-inner"
          >
            {/* Metric Header */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block truncate">
                {metric.label}
              </span>
              {Icon && (
                <Icon className={`h-4 w-4 ${colorClass}`} />
              )}
            </div>

            {/* Metric Value */}
            <div className="mt-3">
              <span className={`text-2xl font-extrabold tracking-tight text-white block font-mono`}>
                {metric.value}
              </span>
              {metric.subtext && (
                <p className="text-[10px] text-zinc-500 leading-normal mt-0.5 line-clamp-1">
                  {metric.subtext}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
