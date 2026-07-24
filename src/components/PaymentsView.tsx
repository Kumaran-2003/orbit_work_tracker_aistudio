import React, { useMemo, useState } from 'react';
import { Payment, Client } from '../types';
import { Trash2, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaymentsViewProps {
  payments: Payment[];
  clients: Client[];
  onDeletePayment: (id: string) => void;
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
}

export default function PaymentsView({ payments, clients, onDeletePayment, onAddPayment }: PaymentsViewProps) {
  const [period, setPeriod] = useState<'all' | 'this-month' | 'this-week'>('all');
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [activePaymentMenuId, setActivePaymentMenuId] = useState<string | null>(null);

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);

  const isWithinPeriod = (dateStr: string, periodType: 'all' | 'this-month' | 'this-week') => {
    if (periodType === 'all') return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;

    const today = new Date();
    const target = new Date(d.getTime() + d.getTimezoneOffset() * 60000);

    if (periodType === 'this-month') return target.getFullYear() === today.getFullYear() && target.getMonth() === today.getMonth();

    const oneDay = 24 * 60 * 60 * 1000;
    const todayNum = today.getTime();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(todayNum - (distanceToMonday * oneDay));
    monday.setHours(0,0,0,0);
    const sunday = new Date(monday.getTime() + (6 * oneDay));
    sunday.setHours(23,59,59,999);
    return target >= monday && target <= sunday;
  };

  const filtered = useMemo(() => payments.filter(p => isWithinPeriod(p.paymentDate, period)).sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()), [payments, period]);

  const totalCount = filtered.length;
  const totalAmount = filtered.reduce((s: number, p: Payment) => s + p.amount, 0);
  const uniqueClients = Array.from(new Set(filtered.map((p: Payment) => p.clientId))).length;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-2xl font-medium tracking-tight text-[#cdddf0]">Payments</h1>

          <div className="flex items-center gap-3">
            <div className="flex bg-[#1c3538] p-0.5 rounded-full border border-[#cdddf0]/15 w-max">
            <button onClick={() => setPeriod('all')} className={`px-4 py-1.5 rounded-full text-xs font-medium ${period==='all' ? 'bg-[#38bdf8] text-[#1c3538] shadow-sm' : 'text-[#cdddf0]/70'}`}>All Time</button>
            <button onClick={() => setPeriod('this-month')} className={`px-4 py-1.5 rounded-full text-xs font-medium ${period==='this-month' ? 'bg-[#38bdf8] text-[#1c3538] shadow-sm' : 'text-[#cdddf0]/70'}`}>This Month</button>
            <button onClick={() => setPeriod('this-week')} className={`px-4 py-1.5 rounded-full text-xs font-medium ${period==='this-week' ? 'bg-[#38bdf8] text-[#1c3538] shadow-sm' : 'text-[#cdddf0]/70'}`}>This Week</button>
            </div>

            <button
              onClick={() => {
                setIsAddingPayment(!isAddingPayment);
                if (!selectedClientId && clients[0]) setSelectedClientId(clients[0].id);
              }}
              className="px-4 py-1.5 bg-[#38bdf8] hover:bg-[#7dd3fc] text-[#1c3538] rounded-full text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              {isAddingPayment ? 'Cancel' : 'Add Payment'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#224044] border border-[#cdddf0]/15 rounded-[1.8rem] p-5 shadow-lg flex flex-col justify-between min-h-[110px]">
          <span className="text-xs font-medium text-[#cdddf0]/60">Payments</span>
          <span className="text-2xl font-bold text-[#cdddf0] mt-2">{totalCount}</span>
        </div>

        <div className="bg-[#224044] border border-[#cdddf0]/15 rounded-[1.8rem] p-5 shadow-lg flex flex-col justify-between min-h-[110px]">
          <span className="text-xs font-medium text-[#cdddf0]/60">Clients Paid</span>
          <span className="text-2xl font-bold text-[#cdddf0] mt-2">{uniqueClients}</span>
        </div>

        <div className="bg-[#38bdf8]/10 border border-[#38bdf8]/30 rounded-[1.8rem] p-5 shadow-lg flex flex-col justify-between min-h-[110px]">
          <span className="text-xs font-medium text-[#38bdf8]">Total Amount</span>
          <span className="text-2xl font-bold text-[#38bdf8] mt-2">₹{totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Inline Add Payment Form (global) */}
      {isAddingPayment && (
        <form
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            const amountNum = parseFloat(paymentAmount);
            if (isNaN(amountNum) || amountNum <= 0) return alert('Enter a valid amount');
            if (!selectedClientId) return alert('Select a client');
            onAddPayment({ clientId: selectedClientId, amount: amountNum, paymentDate, note: paymentNote || undefined });
            setPaymentAmount('');
            setPaymentNote('');
            setIsAddingPayment(false);
          }}
          className="p-5 bg-[#1c3538] rounded-[1.8rem] border border-[#cdddf0]/15 space-y-4 animate-fade-in"
        >
          <h3 className="text-xs font-medium text-[#cdddf0]">Record a Received Payment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-medium text-[#cdddf0]/60 uppercase tracking-wider mb-1.5">Client</label>
              <select value={selectedClientId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedClientId(e.target.value)} className="w-full px-4 py-2 bg-[#224044] border border-[#cdddf0]/20 rounded-xl text-xs font-medium text-[#cdddf0] focus:outline-none focus:border-[#38bdf8]">
                <option value="">Select client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-[#cdddf0]/60 uppercase tracking-wider mb-1.5">Payment Amount (₹)</label>
              <input type="number" step="0.01" required placeholder="e.g. 15000" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full px-4 py-2 bg-[#224044] border border-[#cdddf0]/20 rounded-xl text-xs font-medium text-[#cdddf0] focus:outline-none focus:border-[#38bdf8]" />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-[#cdddf0]/60 uppercase tracking-wider mb-1.5">Payment Date</label>
              <input type="date" required value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full px-4 py-2 bg-[#224044] border border-[#cdddf0]/20 rounded-xl text-xs font-medium text-[#cdddf0] focus:outline-none focus:border-[#38bdf8]" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-[#cdddf0]/60 uppercase tracking-wider mb-1.5">Payment Note / Description (Optional)</label>
            <input type="text" placeholder="e.g. Upfront deposit" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} className="w-full px-4 py-2 bg-[#224044] border border-[#cdddf0]/20 rounded-xl text-xs font-medium text-[#cdddf0] focus:outline-none focus:border-[#38bdf8]" />
          </div>

          <div className="flex justify-end items-center gap-2 pt-1">
            <button type="button" onClick={() => setIsAddingPayment(false)} className="px-4 py-1.5 border border-[#cdddf0]/20 text-[#cdddf0]/70 hover:bg-[#27484d] rounded-full text-xs font-medium transition-all">Close</button>
            <button type="submit" className="px-5 py-1.5 bg-[#38bdf8] hover:bg-[#7dd3fc] text-[#1c3538] rounded-full text-xs font-bold transition-all shadow-md">Log Payment Record</button>
          </div>
        </form>
      )}

      <div className="space-y-3.5 pt-2">
        <h2 className="text-xl font-medium text-[#cdddf0] tracking-tight">Payme nts</h2>

        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-[#224044] border border-[#cdddf0]/15 rounded-[1.8rem] shadow-lg text-[#cdddf0]/60 font-medium text-sm">
            No payments recorded for the selected period.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => {
              const client = clientMap.get(p.clientId);
              const [year, month, day] = p.paymentDate.split('-');
              const monthName = new Date(Number(year), Number(month)-1, Number(day)).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
              return (
                <div
                  key={p.id}
                  className="group relative bg-[#224044] border border-[#cdddf0]/15 rounded-[1.8rem] p-5 shadow-lg flex items-center justify-between gap-4"
                >
                  {/* LEFT: vertical date block + details (same as RecentWorksList) */}
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="flex flex-col items-center justify-center shrink-0 text-center font-sans pr-5 border-r border-[#cdddf0]/15 min-w-[50px]">
                      <span className="text-[10px] font-medium text-[#cdddf0]/60 uppercase tracking-wider leading-none">{monthName}</span>
                      <span className="text-xl font-bold text-[#cdddf0] leading-none mt-1.5">{day}</span>
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-[#cdddf0] leading-snug flex items-center gap-1.5 flex-wrap tracking-tight">
                        <span>{client ? client.name : 'Unknown Client'}</span>
                      </h3>
                      <p className="text-xs font-medium text-[#cdddf0]/60">{p.note || 'Payment'}</p>
                    </div>
                  </div>

                  {/* RIGHT: amount + overflow menu for payment actions */}
                  <div className="flex items-center gap-3 shrink-0 relative">
                    <div className="text-sm font-semibold text-[#38bdf8]">₹{p.amount.toLocaleString()}</div>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePaymentMenuId(activePaymentMenuId === p.id ? null : p.id);
                        }}
                        className="p-2 text-[#cdddf0]/60 hover:text-[#cdddf0] hover:bg-[#1c3538] rounded-full transition-colors"
                        title="Payment actions"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {activePaymentMenuId === p.id && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePaymentMenuId(null);
                            }}
                          />
                          <div className="absolute right-0 mt-2 w-32 bg-[#1c3538] border border-[#cdddf0]/20 rounded-2xl shadow-xl py-1.5 z-40 animate-fade-in text-left">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePaymentMenuId(null);
                                onDeletePayment(p.id);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-rose-950/50 text-xs font-medium text-rose-400 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span>Delete</span>
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
    </div>
  );
}
