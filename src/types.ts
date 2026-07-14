/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Client {
  id: string;
  name: string;
  color: string; // Brutalist color category (e.g. bg-[#FEF08A] / bg-[#A7F3D0] / bg-[#FCA5A5] / bg-[#BFDBFE])
}

export interface WorkType {
  id: string;
  name: string;
  icon?: string; // Icon identifier (e.g. mage:video, mage:image)
}

export interface WorkEntry {
  id: string;
  title: string;
  clientId: string;
  workTypeId: string;
  completedOn: string; // YYYY-MM-DD format
  notes?: string;
}

export interface Payment {
  id: string;
  clientId: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  note?: string;
}

export type QuickRange = 'all' | 'this-week' | 'this-month' | 'last-3-months' | 'this-year' | 'custom';
