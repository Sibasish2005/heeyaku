'use client';

import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, PhoneOff, ShieldCheck, Activity } from 'lucide-react';

type SimulationState = 'CONNECTED' | 'RINGING' | 'PERSONAL';

export default function RealCallDurationTimer() {
  const [mode, setMode] = useState<SimulationState>('CONNECTED');
  const [seconds, setSeconds] = useState(227); // Starts at 03:47 for realistic preview

  useEffect(() => {
    if (mode !== 'CONNECTED') return;

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [mode]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200 hover:border-blue-200 transition-all flex flex-col justify-between relative overflow-hidden group">
      {/* Background Subtle Wave Pulse */}
      {mode === 'CONNECTED' && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
      )}

      <div>
        {/* Header Label */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="text-xs font-mono font-bold uppercase text-slate-500 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Call Duration Tracker</span>
          </div>

          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${
              mode === 'CONNECTED'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : mode === 'RINGING'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                mode === 'CONNECTED'
                  ? 'bg-emerald-500 animate-pulse'
                  : mode === 'RINGING'
                  ? 'bg-amber-500'
                  : 'bg-slate-400'
              }`}
            />
            {mode === 'CONNECTED' ? 'Real Talk Time' : mode === 'RINGING' ? 'Ringing (Paused)' : 'Personal (Excluded)'}
          </span>
        </div>

        {/* Big Live Digital Timer Display */}
        <div className="flex items-baseline gap-2 my-2">
          <div
            className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight transition-colors ${
              mode === 'CONNECTED'
                ? 'text-[#0B1F33]'
                : mode === 'RINGING'
                ? 'text-amber-600/70'
                : 'text-slate-400'
            }`}
          >
            {mode === 'CONNECTED' ? formatTimer(seconds) : '00:00'}
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500">
            {mode === 'CONNECTED' ? 'active' : 'not counted'}
          </span>
        </div>

        {/* Dynamic Contextual Feedback */}
        <p className="text-xs text-slate-600 min-h-[32px] leading-relaxed">
          {mode === 'CONNECTED' && (
            <span className="text-slate-700 font-medium">
              Connected to lead <strong className="text-[#0B1F33]">Priya S.</strong> Only real conversation seconds are logged to the CRM.
            </span>
          )}
          {mode === 'RINGING' && (
            <span className="text-amber-800 font-medium">
              Dialing tone / ringing is <strong>never counted</strong> as talk time. Timer stays at 00:00 until answered.
            </span>
          )}
          {mode === 'PERSONAL' && (
            <span className="text-slate-600 font-medium">
              Calls to numbers not assigned in the app (friends/family) are <strong>auto-filtered</strong> with 0 logging.
            </span>
          )}
        </p>
      </div>

      {/* Interactive Mode Simulator Buttons */}
      <div className="pt-3 mt-3 border-t border-slate-200/80">
        <div className="text-[10px] font-mono uppercase text-slate-600 font-bold mb-1.5">
          Live Tracker Simulation
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setMode('CONNECTED')}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
              mode === 'CONNECTED'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-[#0B1F33] border border-slate-200'
            }`}
            title="Simulate connected call tracking"
          >
            <PhoneCall className="w-3 h-3 shrink-0" />
            <span>Connected</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('RINGING')}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
              mode === 'RINGING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-[#0B1F33] border border-slate-200'
            }`}
            title="Simulate unanswered ringing dial"
          >
            <Phone className="w-3 h-3 shrink-0" />
            <span>Ringing</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('PERSONAL')}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
              mode === 'PERSONAL'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-[#0B1F33] border border-slate-200'
            }`}
            title="Simulate personal dial outside assigned leads"
          >
            <PhoneOff className="w-3 h-3 shrink-0" />
            <span>Private</span>
          </button>
        </div>
      </div>
    </div>
  );
}
