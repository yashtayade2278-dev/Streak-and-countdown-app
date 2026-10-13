import React from 'react';
import { Calendar, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';
import { formatDisplayDate, getTodayLocalDate } from '../lib/dateUtils';

interface DateTravelBannerProps {
  offsetDays: number;
  onSetOffset: (offset: number) => void;
}

export const DateTravelBanner: React.FC<DateTravelBannerProps> = ({
  offsetDays,
  onSetOffset,
}) => {
  const currentDate = getTodayLocalDate(offsetDays);
  const realDate = getTodayLocalDate(0);
  const isOffsetActive = offsetDays !== 0;

  return (
    <div className="bg-slate-950/80 border-b border-slate-800/80 text-slate-300 py-2 px-4 text-xs">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-400 font-medium">Local Date:</span>
          <span className="font-semibold text-slate-100 font-mono">
            {currentDate}
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-300">{formatDisplayDate(currentDate)}</span>
          {isOffsetActive ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-950/70 border border-amber-700/60 text-amber-300">
              {offsetDays > 0 ? `+${offsetDays}d simulated` : `${offsetDays}d simulated`}
            </span>
          ) : (
            <span className="text-[10px] text-slate-500">(System Realtime)</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 text-[11px] hidden md:inline">Simulate Date:</span>
          <button
            onClick={() => onSetOffset(offsetDays - 1)}
            title="Step backward 1 day"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSetOffset(offsetDays + 1)}
            title="Step forward 1 day (simulate midnight crossing)"
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-medium transition-colors flex items-center gap-1"
          >
            <span>+1 Day</span>
            <ChevronRight className="w-3 h-3" />
          </button>
          {isOffsetActive && (
            <button
              onClick={() => onSetOffset(0)}
              title="Reset to device system date"
              className="px-2 py-1 rounded bg-blue-950/60 border border-blue-800/60 hover:bg-blue-900/60 text-blue-300 text-[11px] font-medium transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
