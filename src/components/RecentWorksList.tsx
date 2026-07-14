/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Client, WorkType, WorkEntry } from '../types';
import { Icon } from '@iconify/react';
import { 
  Clock, 
  MoreHorizontal, 
  Edit2, 
  Trash2 
} from 'lucide-react';

interface RecentWorksListProps {
  entries: WorkEntry[];
  clients: Client[];
  workTypes: WorkType[];
  onEditEntry: (entry: WorkEntry) => void;
  onDeleteEntry: (id: string) => void;
  onOpenAddForm: () => void;
}

export default function RecentWorksList({
  entries,
  clients,
  workTypes,
  onEditEntry,
  onDeleteEntry,
  onOpenAddForm,
}: RecentWorksListProps) {
  // State for the three-dot popover menu active card
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Quick lookup maps
  const clientMap = useMemo(() => new Map<string, Client>(clients.map((c) => [c.id, c])), [clients]);
  const workTypeMap = useMemo(() => new Map<string, WorkType>(workTypes.map((wt) => [wt.id, wt])), [workTypes]);

  // Sort logs by completion date (newest first)
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => new Date(b.completedOn).getTime() - new Date(a.completedOn).getTime());
  }, [entries]);

  // Extract structured month/day for the vertical date block (no year needed)
  const parseDateBlock = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const dayNum = parseInt(parts[2], 10);
      
      const tempDate = new Date(Date.UTC(year, monthIndex, dayNum));
      const monthName = tempDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
      const dayString = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
      return { month: monthName, day: dayString };
    }
    
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { month: '---', day: '--' };
    const monthName = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const dayString = d.getDate() < 10 ? `0${d.getDate()}` : `${d.getDate()}`;
    return { month: monthName, day: dayString };
  };

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-2xl font-medium text-neutral-900 tracking-tight">
          Recent Gigs
        </h2>
      </div>

      {sortedEntries.length === 0 ? (
        <div className="p-12 text-center bg-white border border-neutral-100 rounded-[1.8rem] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]">
          <Clock className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <h4 className="text-sm font-medium text-neutral-800 mb-4">No completed works logged yet</h4>
          <div className="p-[1px] inline-block rounded-full bg-gradient-to-b from-indigo-300 to-indigo-800 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.97]">
            <button
              onClick={onOpenAddForm}
              className="px-5 py-2.5 bg-gradient-to-b from-[#4f46e5] to-[#4338ca] text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.15)] hover:from-[#5c54f1] hover:to-[#4f46e5]"
              id="recent-empty-add-btn"
            >
              log work
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
            {sortedEntries.map((entry) => {
              const clientObj = clientMap.get(entry.clientId);
              const typeObj = workTypeMap.get(entry.workTypeId);
              const dateBlock = parseDateBlock(entry.completedOn);

              return (
              <div
                key={entry.id}
                className="group relative bg-white border border-neutral-100/70 rounded-[1.8rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:border-neutral-200/80 transition-all flex items-center justify-between gap-4"
                id={`recent-log-${entry.id}`}
              >
                {/* LEFT BLOCK: VERTICAL DATE + DETAILS */}
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  {/* VERTICAL DATE BLOCK - MONTH & DATE ONLY */}
                  <div className="flex flex-col items-center justify-center shrink-0 text-center font-sans pr-5 border-r border-neutral-100/80 min-w-[50px]">
                    <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider leading-none">{dateBlock.month}</span>
                    <span className="text-xl font-medium text-neutral-900 leading-none mt-1.5">{dateBlock.day}</span>
                  </div>

                  {/* INFO CONTAINER */}
                  <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="text-base font-medium text-neutral-900 leading-snug flex items-center gap-1.5 flex-wrap tracking-tight">
                      <span>{entry.title}</span>
                      {entry.notes && (
                        <div className="group/tooltip relative inline-block">
                          <span 
                            className="w-1.5 h-1.5 rounded-full bg-[#4f46e5] inline-block animate-pulse shrink-0 cursor-help" 
                            title="Has work notes" 
                          />
                          {/* Rich Tooltip on Hover */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50 bg-neutral-900 text-white text-[11px] p-2.5 rounded-xl shadow-lg w-56 font-sans font-medium text-center leading-relaxed">
                            {entry.notes}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900" />
                          </div>
                        </div>
                      )}
                    </h3>

                    {/* Simple, un-cluttered Client Subtext */}
                    <p className="text-xs font-medium text-neutral-400">
                      {clientObj ? clientObj.name : 'Unknown Client'}
                    </p>
                  </div>
                </div>

                {/* RIGHT BLOCK: WORK TYPE ICON + THREE-DOT BUTTON */}
                <div className="flex items-center gap-3 shrink-0 relative">
                  {/* Rounded Icon Representing Work Type */}
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center border border-indigo-100 bg-indigo-50/50 text-[#4f46e5] shadow-sm"
                    title={typeObj ? typeObj.name : 'Work Type'}
                  >
                    <Icon icon={typeObj?.icon || 'mage:sparkles'} className="w-5 h-5" />
                  </div>

                  {/* iOS Style Popover Action Button */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === entry.id ? null : entry.id);
                      }}
                      className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 rounded-full transition-colors cursor-pointer"
                      title="Actions"
                      id={`recent-actions-trigger-${entry.id}`}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Popover Dropdown Menu */}
                    {activeMenuId === entry.id && (
                      <>
                        {/* Transparent backdrop to close menu on click outside */}
                        <div 
                          className="fixed inset-0 z-30" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(null);
                          }} 
                        />
                        <div className="absolute right-0 mt-2 w-32 bg-white border border-neutral-100 rounded-2xl shadow-xl py-1.5 z-40 animate-fade-in text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                              onEditEntry(entry);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-xs font-medium text-neutral-700 flex items-center gap-2 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Edit Gig</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                              onDeleteEntry(entry.id);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-rose-50 text-xs font-medium text-rose-600 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Delete Gig</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
