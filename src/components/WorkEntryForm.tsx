/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Client, WorkType, WorkEntry } from '../types';
import { Icon } from '@iconify/react';
import { X, AlertCircle } from 'lucide-react';

interface WorkEntryFormProps {
  clients: Client[];
  workTypes: WorkType[];
  onSubmit: (entry: Omit<WorkEntry, 'id'> & { id?: string }) => void;
  onCancel: () => void;
  editingEntry?: WorkEntry | null;
}

export default function WorkEntryForm({
  clients,
  workTypes,
  onSubmit,
  onCancel,
  editingEntry,
}: WorkEntryFormProps) {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [workTypeId, setWorkTypeId] = useState('');
  const [completedOn, setCompletedOn] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load existing data if editing
  useEffect(() => {
    if (editingEntry) {
      setTitle(editingEntry.title);
      setClientId(editingEntry.clientId);
      setWorkTypeId(editingEntry.workTypeId);
      setCompletedOn(editingEntry.completedOn);
      setNotes(editingEntry.notes || '');
    } else {
      if (clients.length > 0) setClientId(clients[0].id);
      if (workTypes.length > 0) setWorkTypeId(workTypes[0].id);
    }
  }, [editingEntry, clients, workTypes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please enter a descriptive work title.');
      return;
    }
    if (!clientId) {
      setError('Please select or create a client preset first.');
      return;
    }
    if (!workTypeId) {
      setError('Please select or create a work type preset first.');
      return;
    }
    if (!completedOn) {
      setError('Please choose a completion date.');
      return;
    }

    onSubmit({
      id: editingEntry?.id,
      title: title.trim(),
      clientId,
      workTypeId,
      completedOn,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="bg-[#203c40] rounded-[2rem] p-6 sm:p-10 font-sans relative text-[#cdddf0]" id="work-entry-form">
      {/* Absolute Close Button in corner */}
      <button
        type="button"
        onClick={onCancel}
        className="absolute top-6 right-6 p-2 text-[#cdddf0]/60 hover:text-[#cdddf0] hover:bg-[#27484d] rounded-full transition-colors cursor-pointer z-10"
        id="close-form-btn"
      >
        <X className="w-5 h-5" />
      </button>

      {/* TWO-COLUMN SPLIT SCREEN LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-stretch">
        
        {/* LEFT COLUMN: BRANDING & GRAPHIC */}
        <div className="md:col-span-5 flex flex-col justify-between py-2">
          <div>
            <div className="mb-4">
              <span className="text-[10px] font-bold text-[#38bdf8] tracking-wider uppercase bg-[#38bdf8]/15 border border-[#38bdf8]/30 px-3 py-1 rounded-full">
                {editingEntry ? 'Edit work' : 'New log'}
              </span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#cdddf0] leading-[1.15] mb-4">
              Every Task <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] to-[#60a5fa]">
                Counts.
              </span>
            </h2>
          </div>

          {/* CUSTOM ORBIT GRAPHIC */}
          <div className="hidden md:block mt-8 text-[#38bdf8]/70">
            <svg viewBox="0 0 240 180" className="w-full h-auto max-h-[140px]" fill="none" stroke="currentColor">
              {/* Orbit dashed ring */}
              <ellipse cx="120" cy="90" rx="90" ry="38" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 4" className="opacity-25" />
              {/* Orbit elements */}
              <circle cx="50" cy="70" r="3" fill="currentColor" className="opacity-50" />
              <circle cx="190" cy="110" r="4.5" fill="currentColor" />
              <circle cx="160" cy="60" r="2" fill="currentColor" className="opacity-30" />
              
              {/* Minimal checkmark clipboard */}
              <g transform="translate(85, 45)">
                <rect x="0" y="0" width="70" height="90" rx="12" fill="#1c3538" stroke="currentColor" strokeWidth="1.8" className="shadow-sm" />
                <line x1="16" y1="24" x2="54" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-30" />
                <line x1="16" y1="42" x2="44" y2="42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-30" />
                <line x1="16" y1="60" x2="34" y2="60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-30" />
                
                {/* Floating solid check indicator */}
                <g transform="translate(42, 50)">
                  <circle cx="12" cy="12" r="12" fill="#38bdf8" />
                  <path d="M7 12 L10 15 L17 8" stroke="#1c3538" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </g>
            </svg>
          </div>
        </div>

        {/* RIGHT COLUMN: REFINED CARD WITH UNDERLINE INPUTS */}
        <form onSubmit={handleSubmit} className="md:col-span-7 bg-[#1c3538] rounded-2xl p-6 sm:p-8 border border-[#cdddf0]/15 flex flex-col justify-between">
          
          <div className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-950/60 text-rose-300 border border-rose-500/30 rounded-2xl text-xs font-semibold flex items-center gap-2.5" id="form-error">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* WORK TITLE INPUT */}
            <div className="relative">
              <label htmlFor="title-input" className="block text-[11px] font-bold text-[#cdddf0]/60 uppercase tracking-wider">
                Work Title / Reel Name *
              </label>
              <input
                id="title-input"
                type="text"
                placeholder="e.g. Gym Motivation Reel #12 - Final Cut"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-b border-[#cdddf0]/20 focus:border-[#38bdf8] rounded-none py-2 focus:outline-none focus:ring-0 transition-all text-sm font-medium text-[#cdddf0] placeholder-[#cdddf0]/30"
                required
              />
            </div>

            {/* CLIENT SELECTION */}
            <div>
              <label htmlFor="client-select" className="block text-[11px] font-bold text-[#cdddf0]/60 uppercase tracking-wider mb-1">
                Select Client Account *
              </label>
              <div className="relative">
                <select
                  id="client-select"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-transparent border-b border-[#cdddf0]/20 focus:border-[#38bdf8] rounded-none py-2 pr-8 focus:outline-none focus:ring-0 transition-all text-sm font-medium text-[#cdddf0] appearance-none cursor-pointer"
                  required
                >
                  {clients.length === 0 ? (
                    <option value="" className="bg-[#1c3538] text-[#cdddf0]">No clients configured</option>
                  ) : (
                    clients.map((client) => (
                      <option key={client.id} value={client.id} className="bg-[#1c3538] text-[#cdddf0]">
                        {client.name}
                      </option>
                    ))
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-[#cdddf0]/60">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* WORK TYPE SELECTION */}
            <div>
              <label htmlFor="worktype-select" className="block text-[11px] font-bold text-[#cdddf0]/60 uppercase tracking-wider mb-1">
                Work Type / Task Category *
              </label>
              <div className="relative">
                <select
                  id="worktype-select"
                  value={workTypeId}
                  onChange={(e) => setWorkTypeId(e.target.value)}
                  className="w-full bg-transparent border-b border-[#cdddf0]/20 focus:border-[#38bdf8] rounded-none py-2 pr-8 focus:outline-none focus:ring-0 transition-all text-sm font-medium text-[#cdddf0] appearance-none cursor-pointer"
                  required
                >
                  {workTypes.length === 0 ? (
                    <option value="" className="bg-[#1c3538] text-[#cdddf0]">No work types configured</option>
                  ) : (
                    workTypes.map((type) => (
                      <option key={type.id} value={type.id} className="bg-[#1c3538] text-[#cdddf0]">
                        {type.name}
                      </option>
                    ))
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-[#cdddf0]/60">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* DATE COMPLETED */}
            <div>
              <label htmlFor="completed-on-input" className="block text-[11px] font-bold text-[#cdddf0]/60 uppercase tracking-wider mb-1">
                Completed On *
              </label>
              <input
                id="completed-on-input"
                type="date"
                value={completedOn}
                onChange={(e) => setCompletedOn(e.target.value)}
                className="w-full bg-transparent border-b border-[#cdddf0]/20 focus:border-[#38bdf8] rounded-none py-1.5 focus:outline-none focus:ring-0 transition-all text-sm font-medium text-[#cdddf0] cursor-pointer"
                required
              />
            </div>

            {/* OPTIONAL NOTES */}
            <div>
              <label htmlFor="notes-input" className="block text-[11px] font-bold text-[#cdddf0]/60 uppercase tracking-wider mb-1">
                Project Details / Notes (Optional)
              </label>
              <textarea
                id="notes-input"
                rows={2}
                placeholder="e.g. Duration: 45s, 4K export, added yellow subtitles"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-transparent border-b border-[#cdddf0]/20 focus:border-[#38bdf8] rounded-none py-2 focus:outline-none focus:ring-0 transition-all text-sm font-medium text-[#cdddf0] placeholder-[#cdddf0]/30 resize-none"
              />
            </div>
          </div>

          {/* FORM ACTIONS */}
          <div className="flex justify-end items-center gap-3 mt-10 pt-6 border-t border-[#cdddf0]/10">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 bg-[#27484d] hover:bg-[#2e545a] text-[#cdddf0] rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer"
              id="form-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#38bdf8] hover:bg-[#7dd3fc] text-[#1c3538] rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer shadow-md"
              id="form-submit-btn"
            >
              {editingEntry ? 'save changes' : 'log work'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
