import { useRef, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import type { ImportFormat } from '../types';
import { parseBankerFile, parseDeadlockFile } from '../hooks/useFileImport';
import type { Matrix, Vector } from '../types';

interface BankerImportProps {
  mode: 'banker';
  onImport: (n: number, m: number, available: Vector, max: Matrix, allocation: Matrix, need: Matrix) => void;
}

interface DeadlockImportProps {
  mode: 'deadlock';
  onImport: (n: number, m: number, available: Vector, allocation: Matrix, request: Matrix) => void;
}

type FileImportButtonProps = BankerImportProps | DeadlockImportProps;

const BANKER_FORMATS = [
  {
    value: 'max-allocation' as ImportFormat,
    label: 'Format 1: Available + Max + Allocation',
    note: 'Need được tự tính (Need = Max − Allocation)',
    example: `3 3
3 3 2
7 5 3
3 2 2
9 0 2
2 2 2
0 1 0`,
    exampleLabel: 'n m\nAvailable\nMax (n dòng)\nAllocation (n dòng)',
  },
  {
    value: 'max-need' as ImportFormat,
    label: 'Format 2: Available + Need + Allocation',
    note: 'Max được tự tính (Max = Need + Allocation)',
    example: `3 3
3 3 2
7 4 3
1 2 2
6 0 0
0 1 0
2 0 0
3 0 2`,
    exampleLabel: 'n m\nAvailable\nNeed (n dòng)\nAllocation (n dòng)',
  },
];

const DEADLOCK_FORMAT = {
  label: 'Format: Available + Allocation + Request',
  example: `5 4
0 0 0 1
0 1 0 0
2 0 0 0
0 0 0 2
0 3 3 3
2 1 1 0
0 1 0 0
0 0 3 2
0 1 0 1
0 0 1 0
2 0 2 0
0 0 0 1
1 0 0 0
0 1 0 0
4 0 2 0`,
  exampleLabel: 'n m\nAvailable\nAllocation (n dòng)\nRequest (n dòng)',
};

function CodeBlock({ text }: { text: string }) {
  return (
    <pre className="text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 overflow-auto leading-relaxed scrollbar-thin">
      {text}
    </pre>
  );
}

export function FileImportButton(props: FileImportButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ImportFormat>('max-allocation');
  const [error, setError] = useState<string | null>(null);

  const triggerFileForFormat = (fmt: ImportFormat) => {
    setSelectedFormat(fmt);
    setShowModal(false);
    // Small delay so modal closes before native dialog opens
    setTimeout(() => fileRef.current?.click(), 50);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        setError(null);
        if (props.mode === 'banker') {
          const result = parseBankerFile(text, selectedFormat);
          props.onImport(result.n, result.m, result.available, result.max, result.allocation, result.need);
        } else {
          const result = parseDeadlockFile(text);
          props.onImport(result.n, result.m, result.available, result.allocation, result.request);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi đọc file');
        setShowModal(true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => { setError(null); setShowModal(true); }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600"
      >
        <Upload size={13} />
        Import File
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Dialog */}
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  Import File — {props.mode === 'banker' ? "Banker's Algorithm" : 'Deadlock Detection'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 flex flex-col gap-5">
              {props.mode === 'banker' ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Chọn định dạng file phù hợp với dữ liệu của bạn:
                  </p>
                  {BANKER_FORMATS.map((fmt) => (
                    <div key={fmt.value} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col gap-3">
                      <div>
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{fmt.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{fmt.note}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Cấu trúc</div>
                          <CodeBlock text={fmt.exampleLabel} />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Ví dụ</div>
                          <CodeBlock text={fmt.example} />
                        </div>
                      </div>
                      <button
                        onClick={() => triggerFileForFormat(fmt.value)}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Upload size={14} />
                        Dùng định dạng này & chọn file
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    File cần có định dạng sau:
                  </p>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col gap-3">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{DEADLOCK_FORMAT.label}</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Cấu trúc</div>
                        <CodeBlock text={DEADLOCK_FORMAT.exampleLabel} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Ví dụ</div>
                        <CodeBlock text={DEADLOCK_FORMAT.example} />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setTimeout(() => fileRef.current?.click(), 50);
                      }}
                      className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Upload size={14} />
                      Chọn file
                    </button>
                  </div>
                </>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                  <span className="font-bold shrink-0">Lỗi:</span>
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept=".txt,.dat,.csv" className="hidden" onChange={handleFile} />
    </>
  );
}
