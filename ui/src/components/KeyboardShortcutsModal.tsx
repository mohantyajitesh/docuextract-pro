import React from 'react';
import { formatShortcut } from '../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: 'u', ctrl: true, description: 'Upload new document' },
  { key: 'e', ctrl: true, description: 'Export results (JSON)' },
  { key: 'd', ctrl: true, description: 'Toggle dark mode' },
  { key: 'Escape', description: 'Close modals / Clear selection' },
  { key: '?', shift: true, description: 'Show keyboard shortcuts' },
  { key: '1', description: 'View Summary tab' },
  { key: '2', description: 'View Text tab' },
  { key: '3', description: 'View Tables tab' },
  { key: '4', description: 'View Key-Values tab' },
  { key: '5', description: 'View Signatures tab' },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Shortcuts List */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            <table className="w-full">
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {shortcuts.map((shortcut, index) => (
                  <tr key={index}>
                    <td className="py-2.5 pr-4">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {shortcut.description}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <kbd className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600">
                        {formatShortcut(shortcut)}
                      </kbd>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> to close
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
