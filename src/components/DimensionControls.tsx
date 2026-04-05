import { PlusCircle } from 'lucide-react';

interface DimensionControlsProps {
  n: number;
  m: number;
  onChangeN: (n: number) => void;
  onChangeM: (m: number) => void;
  onAddRow: () => void;
  onAddColumn: () => void;
}

export function DimensionControls({
  n, m, onChangeN, onChangeM, onAddRow, onAddColumn,
}: DimensionControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">n (processes)</label>
        <input
          type="number"
          min={1}
          max={20}
          value={n}
          onChange={(e) => {
            const val = Math.max(1, Math.min(20, Number(e.target.value)));
            onChangeN(val);
          }}
          className="w-16 text-center border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={onAddRow}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-800"
        >
          <PlusCircle size={13} />
          Process
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">m (resources)</label>
        <input
          type="number"
          min={1}
          max={20}
          value={m}
          onChange={(e) => {
            const val = Math.max(1, Math.min(20, Number(e.target.value)));
            onChangeM(val);
          }}
          className="w-16 text-center border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={onAddColumn}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors border border-purple-200 dark:border-purple-800"
        >
          <PlusCircle size={13} />
          Resource
        </button>
      </div>
    </div>
  );
}
