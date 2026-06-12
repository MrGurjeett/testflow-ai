'use client';

import React from 'react';
import { 
  Menu, 
  Bell, 
  Sun, 
  Moon, 
  User, 
  Activity, 
  Cpu, 
  Wifi, 
  Layers 
} from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  theme?: 'dark' | 'light';
  onThemeToggle?: () => void;
}

export default function Header({ onMenuClick, theme = 'dark', onThemeToggle }: HeaderProps) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 lg:pl-60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Mobile menu trigger & title */}
        <div className="flex items-center space-x-3 lg:space-x-0">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="lg:hidden flex items-center space-x-2">
            <span className="font-extrabold text-white text-sm bg-gradient-to-r from-indigo-400 to-cyan-400 text-transparent bg-clip-text">
              TestFlow AI
            </span>
            <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-4xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
              Foundry
            </span>
          </div>
        </div>

        {/* Dashboard Status Indicators - Center (Desktop only) */}
        <div className="hidden lg:flex items-center space-x-6">
          {/* Azure Foundry */}
          <div className="flex items-center space-x-2 rounded-lg bg-zinc-900/30 border border-zinc-850 px-2.5 py-1 text-2xs font-medium text-zinc-400">
            <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-zinc-500">Foundry:</span>
            <span className="text-zinc-300 font-semibold">Active</span>
          </div>

          {/* API Health */}
          <div className="flex items-center space-x-2 rounded-lg bg-zinc-900/30 border border-zinc-850 px-2.5 py-1 text-2xs font-medium text-zinc-400">
            <Activity className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-zinc-500">API Health:</span>
            <span className="text-zinc-300 font-semibold">99.98%</span>
          </div>

          {/* Latency */}
          <div className="flex items-center space-x-2 rounded-lg bg-zinc-900/30 border border-zinc-850 px-2.5 py-1 text-2xs font-medium text-zinc-400">
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-zinc-500">Latency:</span>
            <span className="text-cyan-400 font-semibold font-mono">84ms</span>
          </div>

          {/* Agents */}
          <div className="flex items-center space-x-2 rounded-lg bg-zinc-900/30 border border-zinc-850 px-2.5 py-1 text-2xs font-medium text-zinc-400">
            <Layers className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-zinc-500">Agents:</span>
            <span className="text-zinc-300 font-semibold">4 / 4 Online</span>
          </div>
        </div>

        {/* Action Controls - Right */}
        <div className="flex items-center space-x-3.5">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={onThemeToggle}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4.5 w-4.5 text-amber-400" />
            ) : (
              <Moon className="h-4.5 w-4.5 text-zinc-500" />
            )}
          </button>

          {/* Notifications Button */}
          <button
            type="button"
            className="relative p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900 transition-colors"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
          </button>

          {/* Horizontal Line Divider */}
          <div className="h-5 w-px bg-zinc-800"></div>

          {/* User Profile Menu */}
          <button
            type="button"
            className="flex items-center space-x-2.5 p-1 rounded-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 transition-all text-left"
          >
            <div className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-indigo-500 text-white font-bold text-xs uppercase shadow-sm shadow-indigo-500/10">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden sm:block pr-2.5">
              <p className="text-[11px] font-bold text-white leading-tight">Admin Demo</p>
              <p className="text-[9px] text-zinc-500 leading-none">Developer Suite</p>
            </div>
          </button>
        </div>

      </div>
    </header>
  );
}
