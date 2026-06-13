'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  PlayCircle, 
  Bot, 
  FileCode, 
  BarChart3, 
  Settings, 
  X,
  Zap
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem?: string;
  workflowRunsCount?: number;
  agentCount?: number;
}

interface MenuItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  id: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'runs', name: 'Workflow Runs', icon: PlayCircle, count: 18 },
  { id: 'agents', name: 'Agents', icon: Bot, count: 4 },
  { id: 'assets', name: 'Test Assets', icon: FileCode },
  { id: 'reports', name: 'Reports', icon: BarChart3 },
  { id: 'settings', name: 'Settings', icon: Settings },
];

export default function Sidebar({
  isOpen,
  onClose,
  activeItem = 'dashboard',
  workflowRunsCount = 0,
  agentCount = 0,
}: SidebarProps) {
  const menuItems = MENU_ITEMS.map((item) => {
    if (item.id === 'runs') {
      return { ...item, count: workflowRunsCount };
    }

    if (item.id === 'agents') {
      return { ...item, count: agentCount };
    }

    return item;
  });

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-zinc-800 bg-zinc-950 px-4 py-6">
      {/* Brand Logo & Name */}
      <div className="flex items-center justify-between px-2 mb-8">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-md shadow-indigo-500/15">
            <Zap className="h-5 w-5 text-[#fff]" />
          </div>
          <div>
            <span className="font-bold text-white tracking-tight text-sm">TestFlow AI</span>
            <p className="text-[10px] text-zinc-500 leading-none">Azure AI Orchestrator</p>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Menu Links */}
      <nav className="flex-1 space-y-1.5 px-1">
        {menuItems.map((item) => {
          const isActive = activeItem === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              className={`flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 shadow-sm shadow-indigo-500/5'
                  : 'text-zinc-400 border border-transparent hover:bg-zinc-900/50 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                <span>{item.name}</span>
              </div>
              {item.count !== undefined && (
                <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-3xs font-medium font-mono ring-1 ring-inset ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-300 ring-indigo-500/30'
                    : 'bg-zinc-900 text-zinc-500 ring-zinc-800'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer / System Telemetry */}
      <div className="border-t border-zinc-900 pt-6 px-1 mt-auto space-y-4">
        <div className="rounded-xl bg-zinc-900/30 border border-zinc-850 p-3">
          <div className="flex items-center space-x-2 text-2xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Cluster Status</span>
          </div>
          <div className="text-3xs font-mono text-zinc-500 space-y-1">
            <div className="flex justify-between">
              <span>Region:</span>
              <span className="text-zinc-300">East US 2</span>
            </div>
            <div className="flex justify-between">
              <span>Runner ID:</span>
              <span className="text-zinc-300">tf-foundry-08</span>
            </div>
            <div className="flex justify-between">
              <span>Usage:</span>
              <span className="text-zinc-300">14% / 100%</span>
            </div>
          </div>
        </div>
        
        <p className="text-[10px] text-zinc-600 text-center font-mono">
          SDK v15.4.1-lts
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Sticky Sidebar on Desktop */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 lg:z-40">
        {sidebarContent}
      </aside>

      {/* Collapsible Mobile Drawer Overlay */}
      {isOpen && (
        <div className="relative z-50 lg:hidden">
          {/* Backdrop click handlers */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 w-64 z-50 flex shadow-2xl transition-transform duration-300">
            <div className="w-full h-full">{sidebarContent}</div>
          </div>
        </div>
      )}
    </>
  );
}
