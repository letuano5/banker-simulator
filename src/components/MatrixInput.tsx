import type { Cell, InputMatrix, InputVector } from '../types';

interface MatrixInputProps {
  label: string;
  labelColor?: string;
  data: InputMatrix | InputVector;
  isVector?: boolean;
  n: number;
  m: number;
  onChange: (row: number, col: number, value: Cell) => void;
  highlightRow?: number;
  readOnly?: boolean;
  highlightRows?: Set<number>;
  highlightRowColor?: 'blue' | 'green' | 'red';
}

export function MatrixInput({
  label,
  labelColor = 'text-blue-600 dark:text-blue-400',
  data,
  isVector = false,
  n,
  m,
  onChange,
  highlightRow,
  readOnly = false,
  highlightRows,
  highlightRowColor = 'blue',
}: MatrixInputProps) {
  const highlightBg = {
    blue: 'bg-blue-50 dark:bg-blue-900/30',
    green: 'bg-green-50 dark:bg-green-900/30',
    red: 'bg-red-50 dark:bg-red-900/30',
  }[highlightRowColor];

  const getCell = (row: number, col: number): Cell => {
    if (isVector) return (data as InputVector)[col] ?? null;
    return (data as InputMatrix)[row]?.[col] ?? null;
  };

  const rows = isVector ? 1 : n;

  return (
    <div className="flex flex-col min-w-0">
      {label && (
        <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${labelColor}`}>
          {label}
        </div>
      )}
      <div className="overflow-auto max-h-[360px] scrollbar-thin rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              {!isVector && <th className="w-10" />}
              {Array.from({ length: m }, (_, j) => (
                <th
                  key={j}
                  className="px-1 py-1.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 sticky top-0 bg-white dark:bg-gray-800/90 backdrop-blur-sm"
                >
                  R{j}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, displayRow) => {
              const actualRow = isVector ? 0 : displayRow;
              const isHighlighted =
                !isVector &&
                (highlightRow === displayRow || highlightRows?.has(displayRow));

              return (
                <tr
                  key={displayRow}
                  className={isHighlighted ? highlightBg : 'hover:bg-gray-50 dark:hover:bg-gray-800/80'}
                >
                  {!isVector && (
                    <td className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 text-right sticky left-0 bg-white dark:bg-gray-800 whitespace-nowrap">
                      P{displayRow}
                    </td>
                  )}
                  {Array.from({ length: m }, (_, col) => {
                    const cell = getCell(actualRow, col);
                    return (
                      <td key={col} className="px-1 py-1">
                        <input
                          type="number"
                          min={0}
                          // Display: empty string for null, number as string otherwise
                          value={cell === null ? '' : cell}
                          placeholder="—"
                          readOnly={readOnly}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '' || raw === '-') {
                              // Clear → set null
                              onChange(actualRow, col, null);
                            } else {
                              const num = parseInt(raw, 10);
                              if (!isNaN(num)) {
                                onChange(actualRow, col, Math.max(0, num));
                              }
                            }
                          }}
                          className={`w-12 h-8 text-center text-sm border rounded focus:outline-none focus:ring-2 transition-colors
                            ${cell === null && !readOnly
                              ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 text-gray-900 dark:text-gray-100 placeholder-amber-400 dark:placeholder-amber-600'
                              : readOnly
                                ? 'bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-default border-gray-200 dark:border-gray-600'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:ring-blue-400'
                            }
                          `}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
