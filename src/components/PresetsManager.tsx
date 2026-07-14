/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client, WorkType } from '../types';
import { Icon } from '@iconify/react';
import { Plus, Trash2, Edit2, Check, X, Download, Upload, SlidersHorizontal, Settings } from 'lucide-react';

interface PresetsManagerProps {
  clients: Client[];
  workTypes: WorkType[];
  onAddClient: (name: string, color: string) => void;
  onUpdateClient: (id: string, name: string, color: string) => void;
  onDeleteClient: (id: string) => void;
  onAddWorkType: (name: string, icon?: string) => void;
  onUpdateWorkType: (id: string, name: string, icon?: string) => void;
  onDeleteWorkType: (id: string) => void;
  onImportData: (data: { clients: Client[]; workTypes: any[]; workEntries: any[] }) => boolean;
  exportData: () => string;
  onLoadDemoData: () => void;
}

// Pastel selection colors matching our minimalist theme
const PRESET_COLORS = [
  { class: 'bg-yellow-100', label: 'Soft Yellow' },
  { class: 'bg-emerald-100', label: 'Mint Green' },
  { class: 'bg-rose-100', label: 'Warm Rose' },
  { class: 'bg-sky-100', label: 'Sky Blue' },
  { class: 'bg-purple-100', label: 'Lavender' },
  { class: 'bg-orange-100', label: 'Warm Orange' },
  { class: 'bg-pink-100', label: 'Cotton Pink' },
];

const AVAILABLE_MAGE_ICONS = [
  { id: 'mage:video', label: 'Video Camera' },
  { id: 'mage:play', label: 'Play' },
  { id: 'mage:image', label: 'Image/Poster' },
  { id: 'mage:sound', label: 'Audio Speaker' },
  { id: 'mage:microphone', label: 'Microphone' },
  { id: 'mage:sparkles', label: 'Sparkles' },
  { id: 'mage:edit', label: 'Pen Tool / Edit' },
  { id: 'mage:camera', label: 'Camera' },
  { id: 'mage:folder', label: 'Folder' },
  { id: 'mage:globe', label: 'Globe/Social' },
  { id: 'mage:star', label: 'Star / Badge' },
  { id: 'mage:lightning', label: 'VFX Lightning' },
];

export default function PresetsManager({
  clients,
  workTypes,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onAddWorkType,
  onUpdateWorkType,
  onDeleteWorkType,
  onImportData,
  exportData,
  onLoadDemoData,
}: PresetsManagerProps) {
  // Client forms
  const [newClientName, setNewClientName] = useState('');
  const [newClientColor, setNewClientColor] = useState(PRESET_COLORS[0].class);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingClientName, setEditingClientName] = useState('');
  const [editingClientColor, setEditingClientColor] = useState('');

  // Work type forms
  const [newWorkTypeName, setNewWorkTypeName] = useState('');
  const [newWorkTypeIcon, setNewWorkTypeIcon] = useState('mage:video');
  
  const [editingWorkTypeId, setEditingWorkTypeId] = useState<string | null>(null);
  const [editingWorkTypeName, setEditingWorkTypeName] = useState('');
  const [editingWorkTypeIcon, setEditingWorkTypeIcon] = useState('mage:video');

  // File import state
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // Handlers for Client
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    onAddClient(newClientName.trim(), newClientColor);
    setNewClientName('');
  };

  const handleStartEditClient = (client: Client) => {
    setEditingClientId(client.id);
    setEditingClientName(client.name);
    setEditingClientColor(client.color);
  };

  const handleSaveClient = (id: string) => {
    if (!editingClientName.trim()) return;
    onUpdateClient(id, editingClientName.trim(), editingClientColor);
    setEditingClientId(null);
  };

  // Handlers for Work Type
  const handleCreateWorkType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkTypeName.trim()) return;
    onAddWorkType(newWorkTypeName.trim(), newWorkTypeIcon);
    setNewWorkTypeName('');
    setNewWorkTypeIcon('mage:video');
  };

  const handleStartEditWorkType = (wt: WorkType) => {
    setEditingWorkTypeId(wt.id);
    setEditingWorkTypeName(wt.name);
    setEditingWorkTypeIcon(wt.icon || 'mage:sparkles');
  };

  const handleSaveWorkType = (id: string) => {
    if (!editingWorkTypeName.trim()) return;
    onUpdateWorkType(id, editingWorkTypeName.trim(), editingWorkTypeIcon);
    setEditingWorkTypeId(null);
  };

  // Backup / Restore
  const handleExport = () => {
    const jsonString = exportData();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reels-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && typeof parsed === 'object') {
            const success = onImportData(parsed);
            if (success) {
              setImportSuccess(true);
              setImportError(null);
              setTimeout(() => setImportSuccess(false), 3000);
            } else {
              setImportError('Invalid backup file structure.');
            }
          } else {
            setImportError('Invalid file format.');
          }
        } catch (err) {
          setImportError('Failed to parse JSON file.');
        }
      };
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* INTRO */}
      <div>
        <h2 className="text-2xl font-medium tracking-tight text-neutral-900">App Presets & Configuration</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: CLIENT PRESETS */}
        <div className="bg-white p-6 border border-neutral-100 shadow-sm rounded-2xl space-y-4">
          <h3 className="text-base font-medium text-neutral-800 tracking-tight">
            Client Accounts
          </h3>

          {/* Add Client Form */}
          <form onSubmit={handleCreateClient} className="p-4 bg-neutral-50 border border-neutral-200/50 rounded-xl space-y-3">
            <div>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-neutral-400 mb-1">
                Client Name
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="e.g. FitLife Coaching"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="flex-1 p-2 bg-white border border-neutral-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-all"
                  id="new-client-name"
                />
                <div className="p-[1px] rounded-xl bg-gradient-to-b from-indigo-300 to-indigo-800 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.99] shrink-0">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-gradient-to-b from-[#4f46e5] to-[#4338ca] text-white font-bold text-xs rounded-xl tracking-wide shadow-[inset_0_1.5px_0_rgba(255,255,255,0.3),inset_0_-1.5px_0_rgba(0,0,0,0.15)] hover:from-[#5c54f1] hover:to-[#4f46e5] transition-all cursor-pointer"
                    id="add-client-submit"
                  >
                    Add Client
                  </button>
                </div>
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-neutral-400 mb-1">
                Accent Theme Color
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.class}
                    type="button"
                    onClick={() => setNewClientColor(color.class)}
                    className={`w-6 h-6 rounded-full border cursor-pointer transition-all ${color.class} ${
                      newClientColor === color.class
                        ? 'border-neutral-950 scale-105 ring-1 ring-neutral-950/10'
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                    title={color.label}
                    id={`color-preset-${color.class.replace(/[^a-zA-Z0-9]/g, '')}`}
                  />
                ))}
              </div>
            </div>
          </form>

          {/* Client List */}
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {clients.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-neutral-200 rounded-xl text-xs text-neutral-400 font-medium">
                No clients added yet.
              </div>
            ) : (
              clients.map((client) => {
                const isEditing = editingClientId === client.id;
                return (
                  <div
                    key={client.id}
                    className={`p-3 border border-neutral-100 rounded-xl flex items-center justify-between transition-colors ${
                      isEditing ? 'bg-white' : 'bg-white hover:bg-neutral-50/50'
                    }`}
                    id={`client-item-${client.id}`}
                  >
                    {isEditing ? (
                      <div className="flex-1 flex flex-col gap-2 mr-2">
                        <input
                          type="text"
                          value={editingClientName}
                          onChange={(e) => setEditingClientName(e.target.value)}
                          className="w-full p-2 border border-neutral-200 rounded-lg text-xs font-medium"
                          id={`edit-client-input-${client.id}`}
                        />
                        <div className="flex gap-1 items-center">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color.class}
                              type="button"
                              onClick={() => setEditingClientColor(color.class)}
                              className={`w-5 h-5 rounded-full border cursor-pointer ${color.class} ${
                                editingClientColor === color.class ? 'border-neutral-800 ring-1 ring-neutral-800/10' : 'border-neutral-200'
                              }`}
                              id={`edit-client-color-${client.id}-${color.class.replace(/[^a-zA-Z0-9]/g, '')}`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <div className={`w-3 h-3 rounded-full border border-neutral-900/15 ${client.color}`} />
                        <span className="font-medium text-neutral-800 text-xs">{client.name}</span>
                      </div>
                    )}

                    <div className="flex gap-1.5 shrink-0">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveClient(client.id)}
                            className="p-1 px-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-all cursor-pointer text-[10px] font-medium"
                            title="Save changes"
                            id={`save-client-btn-${client.id}`}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingClientId(null)}
                            className="p-1 px-2 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 transition-all cursor-pointer text-[10px] font-medium"
                            title="Cancel"
                            id={`cancel-client-btn-${client.id}`}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEditClient(client)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 border border-neutral-200/60 rounded-xl transition-all cursor-pointer"
                            title="Edit Client"
                            id={`start-edit-client-btn-${client.id}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteClient(client.id)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50/50 border border-neutral-200/60 rounded-xl transition-all cursor-pointer"
                            title="Delete Client"
                            id={`delete-client-btn-${client.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: WORK TYPES & BACKUP */}
        <div className="space-y-6">
          {/* Work Types panel */}
          <div className="bg-white p-6 border border-neutral-100 shadow-sm rounded-2xl space-y-4">
            <h3 className="text-base font-medium text-neutral-800 tracking-tight">
              Work Types & Icons
            </h3>

            {/* Add Work Type Form */}
            <form onSubmit={handleCreateWorkType} className="p-4 bg-neutral-50 border border-neutral-200/50 rounded-xl space-y-3.5">
              <div>
                <span className="block text-[11px] font-medium uppercase tracking-wider text-neutral-400 mb-1">
                  New Work Type Name
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Color Grading & SFX"
                    value={newWorkTypeName}
                    onChange={(e) => setNewWorkTypeName(e.target.value)}
                    className="flex-1 p-2 bg-white border border-neutral-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-all"
                    id="new-worktype-name"
                  />
                  <div className="p-[1px] rounded-xl bg-gradient-to-b from-indigo-300 to-indigo-800 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.99] shrink-0">
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-gradient-to-b from-[#4f46e5] to-[#4338ca] text-white font-bold text-xs rounded-xl tracking-wide shadow-[inset_0_1.5px_0_rgba(255,255,255,0.3),inset_0_-1.5px_0_rgba(0,0,0,0.15)] hover:from-[#5c54f1] hover:to-[#4f46e5] transition-all cursor-pointer"
                      id="add-worktype-submit"
                    >
                      Add Type
                    </button>
                  </div>
                </div>
              </div>

              {/* Icon Selector Grid */}
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Select Work Icon (Mage Pack)
                </span>
                <div className="grid grid-cols-6 gap-1.5 bg-white p-2 border border-neutral-200/60 rounded-lg max-h-[100px] overflow-y-auto">
                  {AVAILABLE_MAGE_ICONS.map((ico) => {
                    const isSelected = newWorkTypeIcon === ico.id;
                    return (
                      <button
                        key={ico.id}
                        type="button"
                        onClick={() => setNewWorkTypeIcon(ico.id)}
                        className={`p-1.5 rounded-md flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border border-indigo-400 text-[#4f46e5]'
                            : 'bg-transparent border border-transparent text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                        }`}
                        title={ico.label}
                      >
                        <Icon icon={ico.id} className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>

            {/* Work Type List */}
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {workTypes.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-neutral-200 rounded-xl text-xs text-neutral-400 font-medium">
                  No work types added yet.
                </div>
              ) : (
                workTypes.map((wt) => {
                  const isEditing = editingWorkTypeId === wt.id;
                  return (
                    <div
                      key={wt.id}
                      className={`p-3 border border-neutral-100 rounded-xl flex flex-col gap-2.5 transition-colors ${
                        isEditing ? 'bg-neutral-50/55 p-4 border-neutral-200' : 'bg-white hover:bg-neutral-50/50'
                      }`}
                      id={`worktype-item-${wt.id}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingWorkTypeName}
                            onChange={(e) => setEditingWorkTypeName(e.target.value)}
                            className="flex-1 p-2 bg-white border border-neutral-200 rounded-lg text-xs font-medium mr-2"
                            id={`edit-worktype-input-${wt.id}`}
                          />
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-neutral-50 border border-neutral-150 flex items-center justify-center text-indigo-600 shrink-0">
                              <Icon icon={wt.icon || 'mage:sparkles'} className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-neutral-800 text-xs">{wt.name}</span>
                          </div>
                        )}

                        <div className="flex gap-1.5 shrink-0">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveWorkType(wt.id)}
                                className="p-1 px-2.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-all cursor-pointer text-[10px] font-bold"
                                title="Save changes"
                                id={`save-worktype-btn-${wt.id}`}
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingWorkTypeId(null)}
                                className="p-1 px-2.5 bg-white border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 transition-all cursor-pointer text-[10px] font-semibold"
                                title="Cancel"
                                id={`cancel-worktype-btn-${wt.id}`}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEditWorkType(wt)}
                                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 border border-neutral-200/60 rounded-xl transition-all cursor-pointer"
                                title="Edit Type"
                                id={`start-edit-worktype-btn-${wt.id}`}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteWorkType(wt.id)}
                                className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50/50 border border-neutral-200/60 rounded-xl transition-all cursor-pointer"
                                title="Delete Type"
                                id={`delete-worktype-btn-${wt.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Edit mode Icon grid */}
                      {isEditing && (
                        <div className="bg-white p-2.5 rounded-lg border border-neutral-200/80 space-y-1.5">
                          <span className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                            Choose Mage Icon:
                          </span>
                          <div className="grid grid-cols-6 gap-1">
                            {AVAILABLE_MAGE_ICONS.map((ico) => {
                              const isSelected = editingWorkTypeIcon === ico.id;
                              return (
                                <button
                                  key={ico.id}
                                  type="button"
                                  onClick={() => setEditingWorkTypeIcon(ico.id)}
                                  className={`p-1.5 rounded flex items-center justify-center transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-indigo-50 border border-indigo-300 text-[#4f46e5]'
                                      : 'bg-transparent border border-transparent text-neutral-500 hover:bg-neutral-50'
                                  }`}
                                  title={ico.label}
                                >
                                  <Icon icon={ico.id} className="w-4 h-4" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Backup Panel */}
          <div className="bg-white p-6 border border-neutral-100 shadow-sm rounded-2xl space-y-4">
            <h3 className="text-base font-medium text-neutral-800 tracking-tight">
              Data Portability
            </h3>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 font-medium text-xs rounded-xl active:scale-[0.98] hover:shadow-xs transition-all duration-200 cursor-pointer"
                id="export-data-btn"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>

              <label
                className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 font-medium text-xs rounded-xl active:scale-[0.98] hover:shadow-xs transition-all duration-200 cursor-pointer"
                id="import-data-label"
              >
                <Upload className="w-3.5 h-3.5" />
                Import Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>

              <button
                onClick={onLoadDemoData}
                type="button"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#4f46e5]/5 hover:bg-[#4f46e5]/10 border border-[#4f46e5]/20 text-[#4f46e5] font-semibold text-xs rounded-xl active:scale-[0.98] hover:shadow-xs transition-all duration-200 cursor-pointer"
                id="load-demo-btn"
              >
                Load Sample Data
              </button>
            </div>

            {importSuccess && (
              <div className="mt-3.5 p-2 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-medium" id="import-success-toast">
                ✓ Backup data imported successfully!
              </div>
            )}

            {importError && (
              <div className="mt-3.5 p-2 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-xs font-medium" id="import-error-toast">
                ⚠ Error: {importError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
