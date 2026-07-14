/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Client, WorkType, WorkEntry, QuickRange, Payment } from '../types';
import { Icon } from '@iconify/react';
import { 
  Trash2, 
  Edit2, 
  Clock, 
  SlidersHorizontal, 
  Plus, 
  X, 
  ChevronRight, 
  MoreHorizontal
} from 'lucide-react';

interface ClientWorksViewProps {
  entries: WorkEntry[];
  clients: Client[];
  workTypes: WorkType[];
  payments: Payment[];
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
  onDeletePayment: (id: string) => void;
  onEditEntry: (entry: WorkEntry) => void;
  onDeleteEntry: (id: string) => void;
}

export default function ClientWorksView({
  entries,
  clients,
  workTypes,
  payments,
  onAddPayment,
  onDeletePayment,
  onEditEntry,
  onDeleteEntry,
}: ClientWorksViewProps) {
  // Navigation State
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // General Overview Tab Toggles (when selectedClientId is null)
  const [overviewPeriod, setOverviewPeriod] = useState<'all' | 'this-month' | 'this-week'>('all');

  // Filter States (when selectedClientId is not null)
  const [selectedWorkTypeId, setSelectedWorkTypeId] = useState<string>('all');
  const [showCustomDates, setShowCustomDates] = useState(false);
  const [selectedQuickRange, setSelectedQuickRange] = useState<QuickRange>('all');
  const [customFromDate, setCustomFromDate] = useState<string>('');
  const [customToDate, setCustomToDate] = useState<string>('');

  // Payment Add Form State
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState('');

  // Three-dot dropdown menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Lookup Maps
  const clientMap = useMemo(() => new Map<string, Client>(clients.map((c) => [c.id, c])), [clients]);
  const workTypeMap = useMemo(() => new Map<string, WorkType>(workTypes.map((wt) => [wt.id, wt])), [workTypes]);

  // Helper to determine if a YYYY-MM-DD date is within the stats period
  const isWithinPeriod = (dateStr: string, period: 'all' | 'this-month' | 'this-week') => {
    if (period === 'all') return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    
    const today = new Date();
    const target = new Date(d.getTime() + d.getTimezoneOffset() * 60000); // adjust for timezone offset
    
    if (period === 'this-month') {
      return target.getFullYear() === today.getFullYear() && target.getMonth() === today.getMonth();
    }
    
    if (period === 'this-week') {
      const todayNum = today.getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      const currentDay = today.getDay();
      const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
      
      const monday = new Date(todayNum - (distanceToMonday * oneDay));
      monday.setHours(0,0,0,0);
      
      const sunday = new Date(monday.getTime() + (6 * oneDay));
      sunday.setHours(23,59,59,999);
      
      return target >= monday && target <= sunday;
    }
    return true;
  };

  // --- GENERAL OVERVIEW STATE CALCULATIONS (WHEN NO CLIENT IS SELECTED) ---

  // Filtered entries for the selected overviewPeriod
  const overviewFilteredEntries = useMemo(() => {
    return entries.filter(e => isWithinPeriod(e.completedOn, overviewPeriod));
  }, [entries, overviewPeriod]);

  // Filtered payments for the selected overviewPeriod
  const overviewFilteredPayments = useMemo(() => {
    return payments.filter(p => isWithinPeriod(p.paymentDate, overviewPeriod));
  }, [payments, overviewPeriod]);

  // Dynamic statistics based on overview period
  const totalGigsOverview = overviewFilteredEntries.length;

  const totalReelsOverview = useMemo(() => {
    return overviewFilteredEntries.filter((entry) => {
      const type = workTypeMap.get(entry.workTypeId);
      return type?.name.toLowerCase().includes('reel');
    }).length;
  }, [overviewFilteredEntries, workTypeMap]);

  const totalRevenueOverview = useMemo(() => {
    return overviewFilteredPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [overviewFilteredPayments]);

  // Gigs count per client within selected overview period
  const clientWorksCount = useMemo(() => {
    const counts: Record<string, number> = {};
    overviewFilteredEntries.forEach((e) => {
      counts[e.clientId] = (counts[e.clientId] || 0) + 1;
    });
    return counts;
  }, [overviewFilteredEntries]);


  // --- SELECTED CLIENT TIMELINE RANGE HANDLER ---

  const isDateInSelectedRange = (dateStr: string): boolean => {
    const entryDate = new Date(dateStr);
    entryDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (showCustomDates) {
      if (customFromDate) {
        const fromDate = new Date(customFromDate);
        fromDate.setHours(0, 0, 0, 0);
        if (entryDate < fromDate) return false;
      }
      if (customToDate) {
        const toDate = new Date(customToDate);
        toDate.setHours(23, 59, 59, 999);
        if (entryDate > toDate) return false;
      }
      return true;
    }

    // Quick range presets
    switch (selectedQuickRange) {
      case 'all':
        return true;

      case 'this-week': {
        const startOfWeek = new Date(today);
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return entryDate >= startOfWeek && entryDate <= endOfWeek;
      }

      case 'this-month': {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        return entryDate >= startOfMonth && entryDate <= endOfMonth;
      }

      case 'last-3-months': {
        const startOfThreeMonthsAgo = new Date(today);
        startOfThreeMonthsAgo.setMonth(today.getMonth() - 3);
        startOfThreeMonthsAgo.setHours(0, 0, 0, 0);
        return entryDate >= startOfThreeMonthsAgo;
      }

      case 'this-year': {
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        return entryDate >= startOfYear && entryDate <= endOfYear;
      }

      default:
        return true;
    }
  };

  // Filtered Entries for Selected Client
  const filteredEntries = useMemo(() => {
    if (!selectedClientId) return [];

    let result = entries.filter((e) => e.clientId === selectedClientId);

    if (selectedWorkTypeId !== 'all') {
      result = result.filter((e) => e.workTypeId === selectedWorkTypeId);
    }

    result = result.filter((e) => isDateInSelectedRange(e.completedOn));

    return result.sort((a, b) => new Date(b.completedOn).getTime() - new Date(a.completedOn).getTime());
  }, [entries, selectedClientId, selectedWorkTypeId, showCustomDates, selectedQuickRange, customFromDate, customToDate]);

  // Filtered Payments for Selected Client (using same timeline criteria!)
  const filteredPayments = useMemo(() => {
    if (!selectedClientId) return [];

    let result = payments.filter((p) => p.clientId === selectedClientId);

    result = result.filter((p) => isDateInSelectedRange(p.paymentDate));

    return result.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [payments, selectedClientId, showCustomDates, selectedQuickRange, customFromDate, customToDate]);


  // --- CLIENT-SPECIFIC STATS (FOR SELECTED PERIOD) ---

  const clientFilteredGigs = filteredEntries.length;

  const clientFilteredReels = useMemo(() => {
    return filteredEntries.filter((entry) => {
      const type = workTypeMap.get(entry.workTypeId);
      return type?.name.toLowerCase().includes('reel');
    }).length;
  }, [filteredEntries, workTypeMap]);

  const clientFilteredRevenue = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPayments]);


  const activeClient = selectedClientId ? clientMap.get(selectedClientId) : null;

  const handleResetFilters = () => {
    setSelectedWorkTypeId('all');
    setSelectedQuickRange('all');
    setCustomFromDate('');
    setCustomToDate('');
    setShowCustomDates(false);
  };

  // Extract structured month/day/year for vertical date block
  const parseDateBlock = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const dayNum = parseInt(parts[2], 10);
      
      const tempDate = new Date(Date.UTC(year, monthIndex, dayNum));
      const monthName = tempDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
      const dayString = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
      return { month: monthName, day: dayString, year };
    }
    
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { month: '---', day: '--', year: '----' };
    const monthName = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const dayString = d.getDate() < 10 ? `0${d.getDate()}` : `${d.getDate()}`;
    return { month: monthName, day: dayString, year: d.getFullYear() };
  };

  // Handle Recording a New Payment
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    onAddPayment({
      clientId: selectedClientId,
      amount: amountNum,
      paymentDate,
      note: paymentNote.trim() || undefined,
    });

    // Reset Form
    setPaymentAmount('');
    setPaymentNote('');
    setIsAddingPayment(false);
  };

  // --- RENDERING VIEWS ---

  // 1. Render Client Cards Grid with Bento Statistics above (No selected client)
  if (!selectedClientId) {
    return (
      <div className="space-y-6 animate-fade-in font-sans">
        {/* CLIENTS & OVERVIEW SECTION */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Clients & Overview</h1>
            
            {/* OVERVIEW PERIOD SELECTOR */}
            <div className="flex bg-neutral-100 p-0.5 rounded-full border border-neutral-200/40 w-max">
              <button
                onClick={() => setOverviewPeriod('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  overviewPeriod === 'all'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setOverviewPeriod('this-month')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  overviewPeriod === 'this-month'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setOverviewPeriod('this-week')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  overviewPeriod === 'this-week'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                This Week
              </button>
            </div>
          </div>
          
          {/* OVERVIEW STATS CARDS */}
          <div className="grid grid-cols-3 gap-4">
            {/* Total Gigs */}
            <div className="bg-white border border-neutral-100 rounded-[1.8rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between min-h-[110px]">
              <span className="text-xs font-medium text-neutral-400">Total Gigs</span>
              <span className="text-2xl font-medium text-neutral-900 mt-2">{totalGigsOverview}</span>
            </div>

            {/* Total Reels */}
            <div className="bg-white border border-neutral-100 rounded-[1.8rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between min-h-[110px]">
              <span className="text-xs font-medium text-neutral-400">Total Reels</span>
              <span className="text-2xl font-medium text-neutral-900 mt-2">{totalReelsOverview}</span>
            </div>

            {/* Total Revenue */}
            <div className="bg-[#4f46e5]/5 border border-indigo-100/30 rounded-[1.8rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between min-h-[110px]">
              <span className="text-xs font-medium text-[#4f46e5]">Total Revenue</span>
              <span className="text-2xl font-medium text-[#4f46e5] mt-2">₹{totalRevenueOverview.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ALL CLIENTS LIST SECTION */}
        <div className="space-y-3.5 pt-2">
          <h2 className="text-xl font-medium text-neutral-900 tracking-tight">All Clients</h2>

          {clients.length === 0 ? (
            <div className="p-12 text-center bg-white border border-neutral-100 rounded-[1.8rem] text-neutral-400 font-medium text-sm shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
              No clients added yet. Please configure clients in the Settings tab first.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {clients.map((client) => {
                const count = clientWorksCount[client.id] || 0;
                return (
                  <button
                    key={client.id}
                    onClick={() => {
                      setSelectedClientId(client.id);
                      handleResetFilters();
                    }}
                    className="p-5 bg-white border border-neutral-100 rounded-[1.8rem] text-left transition-all hover:border-neutral-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex items-center justify-between cursor-pointer group"
                    id={`client-portfolio-${client.id}`}
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <span className="font-medium text-neutral-900 group-hover:text-black transition-colors block text-base truncate">
                        {client.name}
                      </span>
                      <span className="text-xs text-neutral-400 font-medium mt-1 block">
                        {count} {count === 1 ? 'gig' : 'gigs'}
                      </span>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-400 group-hover:bg-neutral-100 group-hover:text-neutral-700 transition-colors shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Render Selected Client Page with beautiful flat minimalist design matching screenshots
  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* BACK NAVIGATION */}
      <div>
        <button
          onClick={() => {
            setSelectedClientId(null);
            setIsAddingPayment(false);
          }}
          className="text-sm font-medium text-neutral-400 hover:text-neutral-900 flex items-center gap-1 cursor-pointer mb-2 transition-colors"
          id="back-to-clients-btn"
        >
          <span>&larr;</span>
          <span>All Clients</span>
        </button>

        <h1 className="text-2xl font-medium text-neutral-900 tracking-tight">
          {activeClient?.name}
        </h1>
      </div>

      {/* SUBTLE NEUTRAL DIVIDER */}
      <div className="border-b border-neutral-100/85 my-3" />

      {/* FILTER CONTROLS BAR (Pills and Dropdown) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* TIMELINE PILL SELECTORS */}
          <div className="flex flex-wrap gap-1.5">
            {([
              { key: 'all', label: 'All' },
              { key: 'this-week', label: 'This Week' },
              { key: 'this-month', label: 'This Month' },
              { key: 'last-3-months', label: 'Last 3 Months' },
              { key: 'this-year', label: 'This Year' },
            ] as const).map((range) => (
              <button
                key={range.key}
                onClick={() => {
                  setSelectedQuickRange(range.key);
                  setShowCustomDates(false);
                }}
                className={`px-4.5 py-2.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  !showCustomDates && selectedQuickRange === range.key
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100/80 text-neutral-500 hover:bg-neutral-200/70'
                }`}
                id={`client-quick-range-${range.key}`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* WORK TYPE DROPDOWN (ALIGNED TO THE RIGHT AS IN SCREENSHOT) */}
          <div className="relative shrink-0 min-w-[190px]">
            <select
              id="client-wt-select"
              value={selectedWorkTypeId}
              onChange={(e) => setSelectedWorkTypeId(e.target.value)}
              className="w-full pl-5 pr-11 py-2.5 bg-white border border-neutral-200/80 rounded-full text-xs font-semibold text-neutral-700 focus:outline-none appearance-none cursor-pointer hover:border-neutral-300 transition-colors shadow-sm"
            >
              <option value="all">All Work Types</option>
              {workTypes.map((wt) => (
                <option key={wt.id} value={wt.id}>
                  {wt.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* CUSTOM RANGE PILL SHOWN BELOW THE MAIN PILLS AS IN THE IMAGE */}
        <div className="flex justify-start">
          <button
            onClick={() => setShowCustomDates(!showCustomDates)}
            className={`px-4.5 py-2.5 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              showCustomDates
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'bg-neutral-100/80 text-neutral-500 hover:bg-neutral-200/70'
            }`}
            id="custom-date-toggle-btn"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
            <span>Custom Range</span>
          </button>
        </div>
      </div>

      {/* CUSTOM RANGE PICKERS */}
      {showCustomDates && (
        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
          <div>
            <label htmlFor="client-from-date" className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">
              Completed From
            </label>
            <input
              id="client-from-date"
              type="date"
              value={customFromDate}
              onChange={(e) => setCustomFromDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-medium"
            />
          </div>
          <div>
            <label htmlFor="client-to-date" className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">
              Completed To
            </label>
            <input
              id="client-to-date"
              type="date"
              value={customToDate}
              onChange={(e) => setCustomToDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-medium"
            />
          </div>
        </div>
      )}

      {/* CLIENT SPECIFIC STATS CARDS */}
      <div className="grid grid-cols-3 gap-4">
        {/* Total Gigs */}
        <div className="bg-white border border-neutral-100 rounded-[1.8rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between min-h-[110px]">
          <span className="text-xs font-medium text-neutral-400">Total Gigs</span>
          <span className="text-2xl font-medium text-neutral-900 mt-2">{clientFilteredGigs}</span>
        </div>

        {/* Total Reels */}
        <div className="bg-white border border-neutral-100 rounded-[1.8rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between min-h-[110px]">
          <span className="text-xs font-medium text-neutral-400">Total Reels</span>
          <span className="text-2xl font-medium text-neutral-900 mt-2">{clientFilteredReels}</span>
        </div>

        {/* Total Revenue */}
        <div className="bg-[#4f46e5]/5 border border-indigo-100/30 rounded-[1.8rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between min-h-[110px]">
          <span className="text-xs font-medium text-[#4f46e5]">Total Revenue</span>
          <span className="text-2xl font-medium text-[#4f46e5] mt-2">₹{clientFilteredRevenue.toLocaleString()}</span>
        </div>
      </div>

      {/* HORIZONTAL DIVIDER */}
      <div className="border-b border-neutral-100" />

      {/* PAYMENTS & EARNINGS SECTION AT THE TOP */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium text-neutral-900 tracking-tight">
            Payments & Earnings
          </h2>

          <button
            onClick={() => setIsAddingPayment(!isAddingPayment)}
            className="px-4 py-1.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-full text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
          >
            {isAddingPayment ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isAddingPayment ? 'Cancel' : 'Add Payment'}</span>
          </button>
        </div>

        {/* INLINE PAYMENT FORM */}
        {isAddingPayment && (
          <form onSubmit={handlePaymentSubmit} className="p-5 bg-neutral-50 rounded-[1.8rem] border border-neutral-100 space-y-4 animate-fade-in">
            <h3 className="text-xs font-medium text-neutral-800">Record a Received Payment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 15000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-medium focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
                  Payment Date
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-medium focus:outline-none focus:border-neutral-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
                Payment Note / Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Upfront deposit for 3-part series"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-medium focus:outline-none focus:border-neutral-400"
              />
            </div>

            <div className="flex justify-end items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingPayment(false)}
                className="px-4 py-1.5 border border-neutral-200 text-neutral-600 hover:bg-neutral-100 rounded-full text-xs font-medium transition-all cursor-pointer"
              >
                Close
              </button>
              <div className="p-[1px] rounded-full bg-gradient-to-b from-indigo-300 to-indigo-800 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98]">
                <button
                  type="submit"
                  className="px-5 py-1 bg-gradient-to-b from-[#4f46e5] to-[#4338ca] text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.15)] hover:from-[#5c54f1] hover:to-[#4f46e5]"
                >
                  Log Payment Record
                </button>
              </div>
            </div>
          </form>
        )}

        {/* PAYMENTS LIST (FLAT ROW LAYOUT CARDS, AMOUNT MOVED TO RIGHT CORNER) */}
        {filteredPayments.length === 0 ? (
          <div className="p-8 text-center bg-white border border-neutral-100 rounded-[1.8rem] text-neutral-400 font-medium text-xs shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
            No payments logged for this client matching the filter.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredPayments.map((payment) => {
              const payDateBlock = parseDateBlock(payment.paymentDate);
              return (
                <div
                  key={payment.id}
                  className="group relative bg-white border border-neutral-100 rounded-[1.8rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:border-neutral-200/80 transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Vertical date block - Month and day only */}
                    <div className="flex flex-col items-center justify-center shrink-0 text-center font-sans pr-4 border-r border-neutral-100 min-w-[50px]">
                      <span className="text-[9px] font-medium text-neutral-400 uppercase leading-none">{payDateBlock.month}</span>
                      <span className="text-sm font-medium text-neutral-900 leading-none mt-1">{payDateBlock.day}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-neutral-600 truncate block">
                        {payment.note || 'Payment Received'}
                      </span>
                    </div>
                  </div>

                  {/* Amount on the right corner, with delete button */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-emerald-600 font-medium text-base">₹{payment.amount.toLocaleString()}</span>
                    
                    <button
                      onClick={() => onDeletePayment(payment.id)}
                      className="opacity-40 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer shrink-0"
                      title="Delete payment record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* HORIZONTAL DIVIDER BETWEEN PAYMENTS AND COMPLETED WORK ENTRIES */}
      <div className="border-b border-neutral-100" />

      {/* WORK LOGS ENTRIES SECTION */}
      <div className="space-y-3.5 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium text-neutral-900 tracking-tight">
            Completed Gigs
          </h2>
          <div className="text-xs font-medium text-neutral-400">
            {filteredEntries.length} {filteredEntries.length === 1 ? 'Entry Found' : 'Entries Found'}
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center bg-white border border-neutral-100 rounded-[1.8rem] shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
            <Clock className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-neutral-800">No logs match the criteria</h3>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredEntries.map((entry) => {
              const typeObj = workTypeMap.get(entry.workTypeId);
              const dateBlock = parseDateBlock(entry.completedOn);

              return (
                <div
                  key={entry.id}
                  className="group relative bg-white border border-neutral-100/70 rounded-[1.8rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:border-neutral-200/80 transition-all flex items-center justify-between gap-4"
                  id={`client-log-card-${entry.id}`}
                >
                  {/* LEFT: VERTICAL DATE + DETAILS */}
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    {/* VERTICAL DATE BLOCK - MONTH & DATE ONLY */}
                    <div className="flex flex-col items-center justify-center shrink-0 text-center font-sans pr-5 border-r border-neutral-100/80 min-w-[50px]">
                      <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider leading-none">{dateBlock.month}</span>
                      <span className="text-xl font-medium text-neutral-900 leading-none mt-1.5">{dateBlock.day}</span>
                    </div>

                    {/* CONTENT CONTAINER */}
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
                        id={`client-actions-trigger-${entry.id}`}
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
    </div>
  );
}
