import React, { useState } from 'react';
import {
  FileText,
  Table,
  Key,
  PenTool,
  Download,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { cn } from '../utils/cn';
import type { ExtractionResult } from '../utils/api';

interface ResultsViewerProps {
  result: ExtractionResult;
  onExport: (format: 'json' | 'csv' | 'xlsx' | 'markdown') => void;
}

export function ResultsViewer({ result, onExport }: ResultsViewerProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'text' | 'tables' | 'keyvalues' | 'signatures'>('summary');
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const toggleTable = (id: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedTables(newExpanded);
  };

  const tabs = [
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'text', label: 'Text', icon: FileText, count: result.pages },
    { id: 'tables', label: 'Tables', icon: Table, count: result.tables.length },
    { id: 'keyvalues', label: 'Key-Values', icon: Key, count: result.key_values.length },
    { id: 'signatures', label: 'Signatures', icon: PenTool, count: result.signatures.length },
  ] as const;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Extraction Results
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {result.document_type || 'Document'} • {result.pages} page(s) •{' '}
              {result.processing_time_seconds.toFixed(1)}s
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              onChange={(e) => onExport(e.target.value as 'json' | 'csv' | 'xlsx' | 'markdown')}
              defaultValue=""
              className="input py-1.5 px-3 text-sm w-auto"
            >
              <option value="" disabled>
                Export as...
              </option>
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="xlsx">Excel</option>
              <option value="markdown">Markdown</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-xs',
                    activeTab === tab.id
                      ? 'bg-primary-200 dark:bg-primary-800'
                      : 'bg-gray-200 dark:bg-gray-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-2xl font-bold text-primary-600">{result.key_values.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Key-Value Pairs</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-2xl font-bold text-primary-600">{result.tables.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tables</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-2xl font-bold text-primary-600">{result.signatures.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Signatures</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-2xl font-bold text-primary-600">
                  {(result.overall_confidence * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
              </div>
            </div>

            {/* Review Alert */}
            {result.human_review_required && (
              <div className="flex items-start gap-3 p-4 bg-warning-500/10 border border-warning-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warning-700 dark:text-warning-400">
                    Human Review Required
                  </p>
                  <p className="text-sm text-warning-600 dark:text-warning-500 mt-1">
                    Some items need manual verification due to low confidence scores.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Preview */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Key-Value Preview
              </h3>
              <div className="space-y-2">
                {result.key_values.slice(0, 5).map((kv, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700"
                  >
                    <span className="text-sm text-gray-600 dark:text-gray-400">{kv.key}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {kv.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Text Tab */}
        {activeTab === 'text' && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg overflow-x-auto">
              {result.text || 'No text extracted'}
            </pre>
          </div>
        )}

        {/* Tables Tab */}
        {activeTab === 'tables' && (
          <div className="space-y-4">
            {result.tables.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tables found</p>
            ) : (
              result.tables.map((table) => (
                <div key={table.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                  <button
                    onClick={() => toggleTable(table.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex items-center gap-2">
                      {expandedTables.has(table.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <span className="font-medium">{table.id}</span>
                      {table.page && (
                        <span className="text-sm text-gray-500">Page {table.page}</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {table.rows.length} rows
                    </span>
                  </button>

                  {expandedTables.has(table.id) && (
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700 overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <tbody>
                          {table.rows.map((row, rowIdx) => (
                            <tr
                              key={rowIdx}
                              className={rowIdx === 0 ? 'font-medium bg-gray-50 dark:bg-gray-700/50' : ''}
                            >
                              {row.map((cell, cellIdx) => (
                                <td
                                  key={cellIdx}
                                  className="px-3 py-2 border border-gray-200 dark:border-gray-600"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Key-Values Tab */}
        {activeTab === 'keyvalues' && (
          <div className="space-y-2">
            {result.key_values.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No key-value pairs found</p>
            ) : (
              result.key_values.map((kv, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex-1">
                    <span className="text-sm text-gray-500">{kv.key}</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{kv.value}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">
                      {(kv.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Signatures Tab */}
        {activeTab === 'signatures' && (
          <div className="space-y-3">
            {result.signatures.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No signatures detected</p>
            ) : (
              result.signatures.map((sig) => (
                <div
                  key={sig.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {sig.status === 'valid' && (
                      <CheckCircle className="w-5 h-5 text-success-500" />
                    )}
                    {sig.status === 'needs_review' && (
                      <AlertTriangle className="w-5 h-5 text-warning-500" />
                    )}
                    {sig.status === 'invalid' && (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{sig.id}</p>
                      <p className="text-sm text-gray-500">
                        Page {sig.page || 1} • {(sig.confidence * 100).toFixed(0)}% confidence
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      sig.status === 'valid' && 'bg-success-500/10 text-success-600',
                      sig.status === 'needs_review' && 'bg-warning-500/10 text-warning-600',
                      sig.status === 'invalid' && 'bg-gray-200 text-gray-600'
                    )}
                  >
                    {sig.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
