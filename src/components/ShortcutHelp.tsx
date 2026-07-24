import React from 'react';
import { X } from 'lucide-react';

interface ShortcutHelpProps {
  open: boolean;
  onClose: () => void;
}

export default function ShortcutHelp({ open, onClose }: ShortcutHelpProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-6">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative bg-[#203c40] rounded-2xl p-5 sm:p-6 w-full max-w-md text-[#cdddf0] shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#cdddf0]/60 hover:text-[#cdddf0] hover:bg-[#27484d] rounded-full transition-colors"
          aria-label="Close shortcuts"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-semibold mb-3">Keyboard Shortcuts</h3>

        <div className="grid gap-2">
          <div className="flex items-center justify-between px-3 py-2 rounded-md bg-[#162a2d]">
            <div className="text-sm text-[#cdddf0]">Home</div>
            <div className="font-mono text-xs text-[#cdddf0]">1</div>
          </div>

          <div className="flex items-center justify-between px-3 py-2 rounded-md bg-[#162a2d]">
            <div className="text-sm text-[#cdddf0]">Clients</div>
            <div className="font-mono text-xs text-[#cdddf0]">2</div>
          </div>

          <div className="flex items-center justify-between px-3 py-2 rounded-md bg-[#162a2d]">
            <div className="text-sm text-[#cdddf0]">Payments</div>
            <div className="font-mono text-xs text-[#cdddf0]">3</div>
          </div>

          <div className="flex items-center justify-between px-3 py-2 rounded-md bg-[#162a2d]">
            <div className="text-sm text-[#cdddf0]">Presets</div>
            <div className="font-mono text-xs text-[#cdddf0]">4</div>
          </div>

          <div className="flex items-center justify-between px-3 py-2 rounded-md bg-[#162a2d]">
            <div className="text-sm text-[#cdddf0]">Back (or to clients list)</div>
            <div className="font-mono text-xs text-[#cdddf0]">0</div>
          </div>

          <div className="flex items-center justify-between px-3 py-2 rounded-md bg-[#162a2d]">
            <div className="text-sm text-[#cdddf0]">Close modal / cancel</div>
            <div className="font-mono text-xs text-[#cdddf0]">Esc</div>
          </div>

          <div className="flex items-center justify-between px-3 py-2 rounded-md bg-[#162a2d]">
            <div className="text-sm text-[#cdddf0]">Toggle this help</div>
            <div className="font-mono text-xs text-[#cdddf0]">?</div>
          </div>
        </div>

        <div className="mt-4 text-xs text-[#cdddf0]/60">Shortcuts are disabled while typing in inputs.</div>
      </div>
    </div>
  );
}
