import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { runFullTestSuite, TestCaseResult } from '../lib/testSuite';

export const TestRunnerView: React.FC = () => {
  const [results, setResults] = useState<TestCaseResult[]>(() => runFullTestSuite());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');

  const handleRunTests = () => {
    setResults(runFullTestSuite());
  };

  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = total - passedCount;
  const allPassed = failedCount === 0;

  const filteredResults = results.filter((r) => {
    if (filter === 'passed') return r.passed;
    if (filter === 'failed') return !r.passed;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Automated Verification Test Suite
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Validates streaks, missed-day rules, midnight crossovers, Section 6 countdown differences, and database uniqueness under controlled calendar dates.
          </p>
        </div>

        <button
          onClick={handleRunTests}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Re-run All Tests</span>
        </button>
      </div>

      {/* Test Status Banner */}
      <div
        className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${
          allPassed
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-100'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              allPassed
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
            }`}
          >
            {allPassed ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <XCircle className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base">
              {allPassed
                ? 'All Acceptance Tests Passing'
                : `${failedCount} Test${failedCount > 1 ? 's' : ''} Failed`}
            </h3>
            <p className="text-xs opacity-80 mt-0.5">
              {passedCount} of {total} specifications verified including Section 6 (10–13 Oct reference example).
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 p-1 bg-white/60 dark:bg-slate-900/60 rounded-xl text-xs font-semibold shrink-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            All ({total})
          </button>
          <button
            onClick={() => setFilter('passed')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filter === 'passed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Passed ({passedCount})
          </button>
          {failedCount > 0 && (
            <button
              onClick={() => setFilter('failed')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filter === 'failed'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Failed ({failedCount})
            </button>
          )}
        </div>
      </div>

      {/* Tests List */}
      <div className="space-y-3">
        {filteredResults.map((test) => {
          const isExpanded = expandedId === test.id;

          return (
            <div
              key={test.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : test.id)}
                className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {test.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {test.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                        [{test.category}]
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {test.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      test.passed
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {test.passed ? 'PASSED' : 'FAILED'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800/80 text-xs space-y-2">
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px] font-sans">
                        EXPECTED:
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 break-all">
                        {test.expected}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px] font-sans">
                        ACTUAL:
                      </span>
                      <span
                        className={
                          test.passed
                            ? 'text-emerald-600 dark:text-emerald-400 break-all'
                            : 'text-rose-600 dark:text-rose-400 break-all'
                        }
                      >
                        {test.actual}
                      </span>
                    </div>
                  </div>
                  {test.details && (
                    <p className="text-[11px] text-slate-500 font-sans">
                      {test.details}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
