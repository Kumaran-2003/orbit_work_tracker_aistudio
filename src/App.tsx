/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import PresetsManager from './components/PresetsManager';
import WorkEntryForm from './components/WorkEntryForm';
import RecentWorksList from './components/RecentWorksList';
import ClientWorksView from './components/ClientWorksView';
import { Client, WorkType, WorkEntry, Payment } from './types';
import { Home, Users, Settings, Plus, Layers, ArrowUpRight, DollarSign, Briefcase, Video } from 'lucide-react';

const STORAGE_KEY_CLIENTS = 'reels_tracker_clients';
const STORAGE_KEY_WORK_TYPES = 'reels_tracker_work_types';
const STORAGE_KEY_WORK_ENTRIES = 'reels_tracker_work_entries';
const STORAGE_KEY_PAYMENTS = 'reels_tracker_payments';

const DEFAULT_CLIENTS: Client[] = [
  { id: 'c1', name: 'FitLife Coaching', color: 'bg-yellow-100' },
  { id: 'c2', name: 'Aura Tech Reviews', color: 'bg-emerald-100' },
  { id: 'c3', name: 'Chef Antonio Recipes', color: 'bg-rose-100' },
  { id: 'c4', name: 'Saga Podcast Studio', color: 'bg-sky-100' },
];

const DEFAULT_WORK_TYPES: WorkType[] = [
  { id: 'w1', name: 'Full Reel Edit', icon: 'mage:video' },
  { id: 'w2', name: 'Color Grading & Audio', icon: 'mage:sound' },
  { id: 'w3', name: 'Short-form Cutdown', icon: 'mage:play' },
  { id: 'w4', name: 'Captions & Sound FX', icon: 'mage:microphone' },
  { id: 'w5', name: 'Thumbnail & Polish', icon: 'mage:image' },
];

const DEFAULT_WORK_ENTRIES: WorkEntry[] = [
  {
    id: 'e1',
    title: 'Gym Motivation Reel #12 - Final Cut',
    clientId: 'c1',
    workTypeId: 'w1',
    completedOn: '2026-07-13',
    notes: 'Used high-energy synth music. Applied fast cuts on beat drop. Highlighted key words in bright yellow subtitles. Exported 1080x1920 60fps.'
  },
  {
    id: 'e2',
    title: 'iPhone 18 Pro Honest Review Teaser',
    clientId: 'c2',
    workTypeId: 'w3',
    completedOn: '2026-07-10',
    notes: 'Cut down from a 15-minute review to 45 seconds. Kept the most critical punchlines and zoom transitions.'
  },
  {
    id: 'e3',
    title: 'Truffle Pasta Intro Clip',
    clientId: 'c3',
    workTypeId: 'w2',
    completedOn: '2026-07-02',
    notes: 'Color graded raw food footage for rich saturation. Restructured cooking voiceover with noise gate.'
  },
  {
    id: 'e4',
    title: 'Saga Ep.21 Highlight Short',
    clientId: 'c4',
    workTypeId: 'w4',
    completedOn: '2026-06-25',
    notes: 'Highlighted VR headset conversation. Applied smooth zoom scales.'
  }
];

const DEFAULT_PAYMENTS: Payment[] = [
  { id: 'p1', clientId: 'c1', amount: 250, paymentDate: '2026-07-13', note: 'Batch payment for Gym motivation reels' },
  { id: 'p2', clientId: 'c2', amount: 180, paymentDate: '2026-07-10', note: 'iPhone reviews milestone' },
  { id: 'p3', clientId: 'c3', amount: 320, paymentDate: '2026-07-02', note: 'Retainer upfront' },
];

import { supabase } from './supabaseClient';

export default function App() {
  const [clients, setClients] = useState<Client[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [syncStatus, setSyncStatus] = useState<string>('loading');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  // Simple, elegant tabs: logs (Home), clients (Client Portfolio), presets (Settings)
  const [activeTab, setActiveTab] = useState<'logs' | 'clients' | 'presets'>('logs');
  const [isAdding, setIsAdding] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorkEntry | null>(null);

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('orbit_authenticated') === 'true';
  });

  const expectedUsername = import.meta.env.VITE_APP_USERNAME;
  const expectedPassword = import.meta.env.VITE_APP_PASSWORD;
  const isAuthConfigured = expectedUsername && expectedPassword;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput === expectedUsername && passwordInput === expectedPassword) {
      sessionStorage.setItem('orbit_authenticated', 'true');
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid username or password.');
    }
  };

  // Stats filter period on home page
  const [statsPeriod, setStatsPeriod] = useState<'all' | 'this-month' | 'this-week'>('all');

  // Load initial states from localstorage or defaults, synced with Supabase
  useEffect(() => {
    const fetchData = async () => {
      setSyncStatus('loading');
      try {
        const { data: dbClients, error: errClients } = await supabase.from('Client').select('*');
        const { data: dbWorkTypes, error: errWorkTypes } = await supabase.from('WorkType').select('*');
        const { data: dbEntries, error: errEntries } = await supabase.from('WorkEntry').select('*');
        const { data: dbPayments, error: errPayments } = await supabase.from('Payment').select('*');

        if (errClients || errWorkTypes || errEntries || errPayments) {
          throw new Error('Supabase fetch failed');
        }

        if (dbClients && dbClients.length > 0) {
          setClients(dbClients);
          setWorkTypes(dbWorkTypes || []);
          setWorkEntries(dbEntries || []);
          setPayments(dbPayments || []);

          localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(dbClients));
          localStorage.setItem(STORAGE_KEY_WORK_TYPES, JSON.stringify(dbWorkTypes || []));
          localStorage.setItem(STORAGE_KEY_WORK_ENTRIES, JSON.stringify(dbEntries || []));
          localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(dbPayments || []));
          setSyncStatus('synced');
        } else {
          // Database is empty. Do NOT auto-seed, just set empty state.
          setClients([]);
          setWorkTypes(dbWorkTypes || []);
          setWorkEntries([]);
          setPayments([]);

          localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify([]));
          localStorage.setItem(STORAGE_KEY_WORK_TYPES, JSON.stringify(dbWorkTypes || []));
          localStorage.setItem(STORAGE_KEY_WORK_ENTRIES, JSON.stringify([]));
          localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify([]));
          setSyncStatus('synced');
        }
      } catch (err) {
        console.warn('Could not sync with Supabase. Loading local cache...', err);
        loadLocalCache();
      }
    };

    const loadLocalCache = () => {
      const cachedClients = localStorage.getItem(STORAGE_KEY_CLIENTS);
      const cachedWorkTypes = localStorage.getItem(STORAGE_KEY_WORK_TYPES);
      const cachedWorkEntries = localStorage.getItem(STORAGE_KEY_WORK_ENTRIES);
      const cachedPayments = localStorage.getItem(STORAGE_KEY_PAYMENTS);

      setClients(cachedClients ? JSON.parse(cachedClients) : DEFAULT_CLIENTS);
      setWorkTypes(cachedWorkTypes ? JSON.parse(cachedWorkTypes) : DEFAULT_WORK_TYPES);
      setWorkEntries(cachedWorkEntries ? JSON.parse(cachedWorkEntries) : DEFAULT_WORK_ENTRIES);
      setPayments(cachedPayments ? JSON.parse(cachedPayments) : DEFAULT_PAYMENTS);
      setSyncStatus('local-only');
    };

    fetchData();
  }, []);

  // Synchronizers
  const saveClients = (data: Client[]) => {
    setClients(data);
    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(data));
  };

  const saveWorkTypes = (data: WorkType[]) => {
    setWorkTypes(data);
    localStorage.setItem(STORAGE_KEY_WORK_TYPES, JSON.stringify(data));
  };

  const saveWorkEntries = (data: WorkEntry[]) => {
    setWorkEntries(data);
    localStorage.setItem(STORAGE_KEY_WORK_ENTRIES, JSON.stringify(data));
  };

  const savePayments = (data: Payment[]) => {
    setPayments(data);
    localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(data));
  };

  // CLIENT HANDLERS
  const handleAddClient = async (name: string, color: string) => {
    const newClient: Client = {
      id: 'client_' + Date.now(),
      name,
      color,
    };
    saveClients([...clients, newClient]);
    try {
      await supabase.from('Client').insert([newClient]);
    } catch (e) {
      console.error('Supabase write error:', e);
    }
  };

  const handleUpdateClient = async (id: string, name: string, color: string) => {
    saveClients(
      clients.map((c) => (c.id === id ? { ...c, name, color } : c))
    );
    try {
      await supabase.from('Client').update({ name, color }).eq('id', id);
    } catch (e) {
      console.error('Supabase write error:', e);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('Delete this client preset? Past logs referencing this client will remain but show without a designated preset.')) {
      saveClients(clients.filter((c) => c.id !== id));
      try {
        await supabase.from('Client').delete().eq('id', id);
      } catch (e) {
        console.error('Supabase write error:', e);
      }
    }
  };

  // WORK TYPE HANDLERS
  const handleAddWorkType = async (name: string, icon?: string) => {
    const newWorkType: WorkType = {
      id: 'worktype_' + Date.now(),
      name,
      icon: icon || 'mage:sparkles',
    };
    saveWorkTypes([...workTypes, newWorkType]);
    try {
      await supabase.from('WorkType').insert([newWorkType]);
    } catch (e) {
      console.error('Supabase write error:', e);
    }
  };

  const handleUpdateWorkType = async (id: string, name: string, icon?: string) => {
    saveWorkTypes(
      workTypes.map((wt) => (wt.id === id ? { ...wt, name, icon: icon || wt.icon || 'mage:sparkles' } : wt))
    );
    try {
      await supabase.from('WorkType').update({ name, icon: icon || 'mage:sparkles' }).eq('id', id);
    } catch (e) {
      console.error('Supabase write error:', e);
    }
  };

  const handleDeleteWorkType = async (id: string) => {
    if (window.confirm('Delete this work type preset? Past logs referencing this type will remain intact.')) {
      saveWorkTypes(workTypes.filter((wt) => wt.id !== id));
      try {
        await supabase.from('WorkType').delete().eq('id', id);
      } catch (e) {
        console.error('Supabase write error:', e);
      }
    }
  };

  // WORK LOG HANDLERS
  const handleFormSubmit = async (entryData: Omit<WorkEntry, 'id'> & { id?: string }) => {
    if (entryData.id) {
      const updated = workEntries.map((e) =>
        e.id === entryData.id ? ({ ...e, ...entryData } as WorkEntry) : e
      );
      saveWorkEntries(updated);
      setEditingEntry(null);
      setIsAdding(false);
      try {
        await supabase.from('WorkEntry').update({
          title: entryData.title,
          clientId: entryData.clientId,
          workTypeId: entryData.workTypeId,
          completedOn: entryData.completedOn,
          notes: entryData.notes
        }).eq('id', entryData.id);
      } catch (e) {
        console.error('Supabase write error:', e);
      }
    } else {
      const newEntry: WorkEntry = {
        ...entryData,
        id: 'entry_' + Date.now(),
      };
      saveWorkEntries([newEntry, ...workEntries]);
      setIsAdding(false);
      try {
        await supabase.from('WorkEntry').insert([newEntry]);
      } catch (e) {
        console.error('Supabase write error:', e);
      }
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this completed work log? This action is permanent.')) {
      saveWorkEntries(workEntries.filter((e) => e.id !== id));
      try {
        await supabase.from('WorkEntry').delete().eq('id', id);
      } catch (e) {
        console.error('Supabase write error:', e);
      }
    }
  };

  const handleStartEditEntry = (entry: WorkEntry) => {
    setEditingEntry(entry);
    setIsAdding(true);
  };

  // PAYMENT HANDLERS
  const handleAddPayment = async (paymentData: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: 'payment_' + Date.now(),
    };
    savePayments([newPayment, ...payments]);
    try {
      await supabase.from('Payment').insert([newPayment]);
    } catch (e) {
      console.error('Supabase write error:', e);
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment record? This will adjust the revenue calculation.')) {
      savePayments(payments.filter((p) => p.id !== id));
      try {
        await supabase.from('Payment').delete().eq('id', id);
      } catch (e) {
        console.error('Supabase write error:', e);
      }
    }
  };

  // DATA PORTABILITY
  const handleExportData = (): string => {
    const backupObj = { clients, workTypes, workEntries, payments };
    return JSON.stringify(backupObj, null, 2);
  };

  const handleLoadDemoData = async () => {
    if (window.confirm('Load sample clients, work types, and transaction records? This will merge with your existing data.')) {
      setSyncStatus('loading');
      try {
        const mergedClients = [...clients];
        const mergedWorkTypes = [...workTypes];
        const mergedEntries = [...workEntries];
        const mergedPayments = [...payments];

        DEFAULT_CLIENTS.forEach(c => {
          if (!mergedClients.some(mc => mc.id === c.id)) mergedClients.push(c);
        });
        DEFAULT_WORK_TYPES.forEach(w => {
          if (!mergedWorkTypes.some(mw => mw.id === w.id)) mergedWorkTypes.push(w);
        });
        DEFAULT_WORK_ENTRIES.forEach(e => {
          if (!mergedEntries.some(me => me.id === e.id)) mergedEntries.push(e);
        });
        DEFAULT_PAYMENTS.forEach(p => {
          if (!mergedPayments.some(mp => mp.id === p.id)) mergedPayments.push(p);
        });

        saveClients(mergedClients);
        saveWorkTypes(mergedWorkTypes);
        saveWorkEntries(mergedEntries);
        savePayments(mergedPayments);

        await supabase.from('Client').upsert(DEFAULT_CLIENTS);
        await supabase.from('WorkType').upsert(DEFAULT_WORK_TYPES);
        await supabase.from('WorkEntry').upsert(DEFAULT_WORK_ENTRIES);
        await supabase.from('Payment').upsert(DEFAULT_PAYMENTS);

        setSyncStatus('synced');
      } catch (err) {
        console.error('Failed to load demo data:', err);
        setSyncStatus('error');
      }
    }
  };

  const handleImportData = (parsedData: any): boolean => {
    if (
      parsedData &&
      Array.isArray(parsedData.clients) &&
      Array.isArray(parsedData.workTypes) &&
      Array.isArray(parsedData.workEntries)
    ) {
      saveClients(parsedData.clients);
      saveWorkTypes(parsedData.workTypes);
      saveWorkEntries(parsedData.workEntries);
      if (Array.isArray(parsedData.payments)) {
        savePayments(parsedData.payments);
      } else {
        savePayments([]);
      }
      return true;
    }
    return false;
  };

  // Helper to determine if a YYYY-MM-DD date is within stats period
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


  // Filter entries for home page card list and stats
  const filteredHomeEntries = useMemo(() => {
    return workEntries.filter(entry => isWithinPeriod(entry.completedOn, statsPeriod));
  }, [workEntries, statsPeriod]);

  // Compute Stats
  const stats = useMemo(() => {
    const totalGigs = filteredHomeEntries.length;
    
    const totalReels = filteredHomeEntries.filter(entry => {
      const type = workTypes.find(t => t.id === entry.workTypeId);
      return type?.name.toLowerCase().includes('reel');
    }).length;
    
    const filteredPayments = payments.filter(p => isWithinPeriod(p.paymentDate, statsPeriod));
    const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    
    return {
      totalGigs,
      totalReels,
      totalRevenue,
    };
  }, [filteredHomeEntries, payments, workTypes, statsPeriod]);

  if (isAuthConfigured && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-neutral-200/80 p-8 shadow-xl">
          <div className="flex flex-col items-center gap-3 mb-6">
            <span className="text-[#4f46e5]">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
                <path fill="currentColor" d="M21.773 14.768c-.029.414-.186.81-.45 1.13a1.9 1.9 0 0 1-.998.63l-3.157.521l-.09.09a.4.4 0 0 0-.09.15l-.5 2.902a1.92 1.92 0 0 1-1.778 1.471h-.09c-.374 0-.74-.111-1.05-.32a1.9 1.9 0 0 1-.739-.92l-2.787-7.906a1.9 1.9 0 0 1 .45-2.001c.253-.263.58-.44.939-.51a1.87 1.87 0 0 1 1.069.07l7.992 2.781c.404.135.754.394 1 .74c.215.351.313.761.28 1.172"/>
                <path fill="currentColor" d="M9.305 22.243a.8.8 0 0 1-.22 0a10.47 10.47 0 0 1-4.5-2.83a10.49 10.49 0 0 1-2.448-10A10.5 10.5 0 0 1 4.82 4.819a10.47 10.47 0 0 1 9.902-2.765a10.47 10.47 0 0 1 4.669 2.54a10.5 10.5 0 0 1 2.822 4.51a.743.743 0 0 1-1.059.886a.76.76 0 0 1-.37-.436a9 9 0 0 0-2.41-3.894a8.99 8.99 0 0 0-8.585-2.143a9 9 0 0 0-3.953 2.306a9.01 9.01 0 0 0-2.377 8.536a8.99 8.99 0 0 0 6.075 6.443a.77.77 0 0 1 .49 1a.75.75 0 0 1-.72.44"/>
              </svg>
            </span>
            <h1 className="text-xl font-bold tracking-tight text-neutral-950 font-sans lowercase">
              orbit
            </h1>
          </div>

          <h2 className="text-lg font-bold text-center text-neutral-900 mb-6">Sign in to your tracker</h2>

          {loginError && (
            <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl p-3 text-xs font-semibold mb-4 text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Username</label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="admin"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#4f46e5] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#4f46e5] focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-sm py-3 rounded-xl tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-neutral-800 pb-32">
      {/* UNIQUE ORBIT LOGO HEADER */}
      <header className="border-b border-neutral-100 bg-white/75 backdrop-blur-md px-6 py-3.5 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-center">
          <div className="flex items-center gap-2.5">
            <span className="text-[#4f46e5]" id="header-orbit-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
                <path fill="currentColor" d="M21.773 14.768c-.029.414-.186.81-.45 1.13a1.9 1.9 0 0 1-.998.63l-3.157.521l-.09.09a.4.4 0 0 0-.09.15l-.5 2.902a1.92 1.92 0 0 1-1.778 1.471h-.09c-.374 0-.74-.111-1.05-.32a1.9 1.9 0 0 1-.739-.92l-2.787-7.906a1.9 1.9 0 0 1 .45-2.001c.253-.263.58-.44.939-.51a1.87 1.87 0 0 1 1.069.07l7.992 2.781c.404.135.754.394 1 .74c.215.351.313.761.28 1.172"/>
                <path fill="currentColor" d="M9.305 22.243a.8.8 0 0 1-.22 0a10.47 10.47 0 0 1-4.5-2.83a10.49 10.49 0 0 1-2.448-10A10.5 10.5 0 0 1 4.82 4.819a10.47 10.47 0 0 1 9.902-2.765a10.47 10.47 0 0 1 4.669 2.54a10.5 10.5 0 0 1 2.822 4.51a.743.743 0 0 1-1.059.886a.76.76 0 0 1-.37-.436a9 9 0 0 0-2.41-3.894a8.99 8.99 0 0 0-8.585-2.143a9 9 0 0 0-3.953 2.306a9.01 9.01 0 0 0-2.377 8.536a8.99 8.99 0 0 0 6.075 6.443a.77.77 0 0 1 .49 1a.75.75 0 0 1-.72.44"/>
              </svg>
            </span>
            <span className="text-base font-bold tracking-tight text-neutral-950 font-sans lowercase">
              orbit
            </span>
          </div>
        </div>
      </header>

      {/* CORE WRAPPER */}
      <main className="max-w-3xl mx-auto px-4.5 mt-8 md:mt-10">
        {/* TAB 1: RECENT COMPLETED LOGS (HOME) */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            {/* LARGE HERO MINIMAL INITIATOR */}
            <div className="p-[1px] rounded-full bg-gradient-to-b from-indigo-300 to-indigo-800 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.99]">
              <button
                onClick={() => {
                  setEditingEntry(null);
                  setIsAdding(true);
                }}
                className="w-full text-center py-4 px-6 bg-gradient-to-b from-[#4f46e5] to-[#4338ca] text-white font-bold text-sm rounded-full tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[inset_0_1.5px_0_rgba(255,255,255,0.3),inset_0_-1.5px_0_rgba(0,0,0,0.15)] hover:from-[#5c54f1] hover:to-[#4f46e5]"
                id="primary-initiator-btn"
              >
                <Plus className="w-4 h-4" />
                log work
              </button>
            </div>

            {/* LIGHT DOTTED LINE BETWEEN INITIATOR BUTTON AND RECENT GIGS */}
            <div className="border-t-2 border-dotted border-neutral-200/80 my-8" />

            {/* PLAIN LIST UNDERNEATH */}
            <RecentWorksList
              entries={workEntries}
              clients={clients}
              workTypes={workTypes}
              onEditEntry={handleStartEditEntry}
              onDeleteEntry={handleDeleteEntry}
              onOpenAddForm={() => setIsAdding(true)}
            />
          </div>
        )}

        {/* TAB 2: CLIENT PORTFOLIO VIEW */}
        {activeTab === 'clients' && (
          <div className="animate-fade-in">
            <ClientWorksView
              entries={workEntries}
              clients={clients}
              workTypes={workTypes}
              payments={payments}
              onAddPayment={handleAddPayment}
              onDeletePayment={handleDeletePayment}
              onEditEntry={handleStartEditEntry}
              onDeleteEntry={handleDeleteEntry}
            />
          </div>
        )}

        {/* TAB 3: APP PRESETS AND SETTINGS */}
        {activeTab === 'presets' && (
          <div className="animate-fade-in">
            <PresetsManager
              clients={clients}
              workTypes={workTypes}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
              onAddWorkType={handleAddWorkType}
              onUpdateWorkType={handleUpdateWorkType}
              onDeleteWorkType={handleDeleteWorkType}
              onImportData={handleImportData}
              exportData={handleExportData}
              onLoadDemoData={handleLoadDemoData}
            />
          </div>
        )}
      </main>

      {/* MODAL OVERLAY FOR LOG ENTRY FORM */}
      {isAdding && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl relative my-auto overflow-hidden">
            <WorkEntryForm
              clients={clients}
              workTypes={workTypes}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsAdding(false);
                setEditingEntry(null);
              }}
              editingEntry={editingEntry}
            />
          </div>
        </div>
      )}

      {/* FLOATING BOTTOM CENTER NAVIGATION BAR */}
      <nav
        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-neutral-200/50 rounded-full p-1.5 shadow-xl z-50 flex items-center gap-1.5 max-w-[95%] w-max font-sans"
        id="floating-bottom-nav"
      >
        <button
          onClick={() => {
            setActiveTab('logs');
          }}
          className={`p-3 rounded-full cursor-pointer transition-all flex items-center justify-center ${
            activeTab === 'logs'
              ? 'bg-[#4f46e5] text-white shadow-md scale-105'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
          id="nav-btn-logs"
          title="Home"
        >
          <Home className="w-5.5 h-5.5" />
        </button>

        <button
          onClick={() => {
            setActiveTab('clients');
          }}
          className={`p-3 rounded-full cursor-pointer transition-all flex items-center justify-center ${
            activeTab === 'clients'
              ? 'bg-[#4f46e5] text-white shadow-md scale-105'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
          id="nav-btn-clients"
          title="Clients"
        >
          <Users className="w-5.5 h-5.5" />
        </button>

        <button
          onClick={() => {
            setActiveTab('presets');
          }}
          className={`p-3 rounded-full cursor-pointer transition-all flex items-center justify-center ${
            activeTab === 'presets'
              ? 'bg-[#4f46e5] text-white shadow-md scale-105'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
          id="nav-btn-presets"
          title="Settings"
        >
          <Settings className="w-5.5 h-5.5" />
        </button>
      </nav>
      
      {/* GIANT FIXED BACKGROUND LOGO (BOTTOM 20% CUT OFF) */}
      <div className="fixed bottom-0 left-0 right-0 h-[24vh] pointer-events-none z-[-1] overflow-hidden flex items-end justify-center select-none">
        <h1 className="text-[22vw] font-bold text-neutral-900/[0.03] leading-none -mb-[4.4vw] tracking-tighter select-none font-sans lowercase">
          orbit
        </h1>
      </div>
    </div>
  );
}
