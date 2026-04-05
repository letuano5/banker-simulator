import { useEffect, useRef, useState } from 'react';
import { Trash2, Upload, CheckCheck, Download } from 'lucide-react';
import { useMatrixState } from '../hooks/useMatrixState';
import { MatrixInput } from '../components/MatrixInput';
import { DimensionControls } from '../components/DimensionControls';
import { FileImportButton } from '../components/FileImportButton';
import { SimulationPanel } from '../components/SimulationPanel';
import type { ValidationData } from '../components/SimulationPanel';
import { runSafetyCheck } from '../lib/bankerSafety';
import { runResourceRequest } from '../lib/bankerRequest';
import { validateInputMatrix, validateInputVector } from '../lib/matrixUtils';
import { exportBankerFile, downloadTextFile } from '../hooks/useFileImport';
import type { Cell, SimulationStep, AlgorithmMode } from '../types';

const UI_STORAGE_KEY = 'os-banker-ui-v1';
const UI_VERSION = 1;

interface BankerUI {
  version: number;
  mode: AlgorithmMode;
  requestProcessIdx: number;
  requestVector: Cell[];
}

function loadUI(): BankerUI | null {
  try {
    const raw = localStorage.getItem(UI_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BankerUI;
    if (parsed.version !== UI_VERSION) return null;
    return parsed;
  } catch { return null; }
}

export function BankerPage() {
  const ms = useMatrixState({ syncMode: 'banker', initialN: 5, initialM: 3 });

  const savedUI = loadUI();
  const [mode, setMode] = useState<AlgorithmMode>(savedUI?.mode ?? 'safety');
  const [requestProcessIdx, setRequestProcessIdx] = useState(savedUI?.requestProcessIdx ?? 0);
  const [requestVector, setRequestVector] = useState<Cell[]>(
    () => savedUI?.requestVector ?? Array(ms.m).fill(0)
  );
  const [steps, setSteps] = useState<SimulationStep[]>([]);
  const [highlightRow, setHighlightRow] = useState<number | undefined>(undefined);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastValidState, setLastValidState] = useState<ValidationData | null>(null);
  const [requestFileError, setRequestFileError] = useState<string | null>(null);
  const [simulationDone, setSimulationDone] = useState(false);
  const requestFileRef = useRef<HTMLInputElement>(null);

  // Persist UI state (mode, request) to localStorage
  useEffect(() => {
    try {
      const data: BankerUI = { version: UI_VERSION, mode, requestProcessIdx, requestVector };
      localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
  }, [mode, requestProcessIdx, requestVector]);

  const handleSetM = (newM: number) => {
    ms.setM(newM);
    setRequestVector((v) => {
      const next = Array(newM).fill(0);
      v.forEach((val, i) => { if (i < newM) next[i] = val; });
      return next;
    });
  };

  const handleAddColumn = () => {
    ms.addColumn();
    setRequestVector((v) => [...v, 0]);
  };

  const setRequestCell = (_row: number, col: number, value: Cell) => {
    setRequestVector((v) => { const next = [...v]; next[col] = value; return next; });
  };

  const handleRequestFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const lines = (ev.target?.result as string)
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0 && !l.startsWith('#'));
        if (!lines[0]) throw new Error('File rỗng');
        const nums = lines[0].split(/\s+/).map(Number);
        if (nums.some(isNaN)) throw new Error('File chứa ký tự không phải số');
        if (nums.length !== ms.m) throw new Error(`Cần đúng ${ms.m} phần tử, file có ${nums.length}`);
        setRequestVector(nums);
        setRequestFileError(null);
      } catch (err) {
        setRequestFileError(err instanceof Error ? err.message : 'Lỗi đọc file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleApplyAllocation = () => {
    const lastStep = steps[steps.length - 1];
    if (!lastStep?.isSafe) return;
    const validated = requestVector.map((v) => v as number);
    ms.applyBankerAllocation(requestProcessIdx, validated);
    setSteps([]);
    setLastValidState(null);
  };

  const handleExport = () => {
    const content = exportBankerFile(ms.n, ms.m, ms.available, ms.max, ms.allocation);
    downloadTextFile('banker-state.txt', content);
  };

  const handleClearData = () => {
    if (!confirm('Xoá toàn bộ dữ liệu đã lưu và reset về mặc định?')) return;
    ms.clearStorage();
    localStorage.removeItem(UI_STORAGE_KEY);
    setMode('safety');
    setRequestProcessIdx(0);
    setRequestVector(Array(ms.m).fill(0));
    setSteps([]);
    setValidationError(null);
    setLastValidState(null);
  };

  const runAlgorithm = () => {
    setValidationError(null);
    setSimulationDone(false);
    try {
      const available = validateInputVector(ms.available, 'Available');
      const max = validateInputMatrix(ms.max, 'Max');
      const allocation = validateInputMatrix(ms.allocation, 'Allocation');
      const need = validateInputMatrix(ms.need, 'Need');

      let result;
      if (mode === 'safety') {
        result = runSafetyCheck(available, allocation, need, ms.n, ms.m);
      } else {
        const request = validateInputVector(requestVector, 'Request');
        result = runResourceRequest(
          { n: ms.n, m: ms.m, available, max, allocation, need },
          { processIndex: requestProcessIdx, request }
        );
      }
      setSteps(result.steps);
      setLastValidState({ n: ms.n, available, allocation, need });
      setHighlightRow(undefined);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Dữ liệu không hợp lệ');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Banker's Algorithm
          </h1>
          <span className="text-xs text-gray-400 dark:text-gray-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Tự động lưu
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DimensionControls
            n={ms.n} m={ms.m}
            onChangeN={ms.setN} onChangeM={handleSetM}
            onAddRow={ms.addRow} onAddColumn={handleAddColumn}
          />
          <FileImportButton mode="banker" onImport={ms.importBanker} />
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600"
            title="Xuất trạng thái hiện tại ra file"
          >
            <Download size={13} />
            Export
          </button>
          <button
            onClick={handleClearData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Xoá dữ liệu đã lưu và reset"
          >
            <Trash2 size={13} />
            Xoá dữ liệu
          </button>
        </div>
      </div>

      {/* Matrix grid */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <MatrixInput
            label="Available"
            labelColor="text-teal-600 dark:text-teal-400"
            data={ms.available} isVector
            n={ms.n} m={ms.m}
            onChange={ms.setAvailableCell}
          />
          <MatrixInput
            label="Max"
            labelColor="text-blue-600 dark:text-blue-400"
            data={ms.max} n={ms.n} m={ms.m}
            onChange={ms.setMaxCell}
            highlightRow={highlightRow}
          />
          <MatrixInput
            label="Allocation"
            labelColor="text-purple-600 dark:text-purple-400"
            data={ms.allocation} n={ms.n} m={ms.m}
            onChange={ms.setAllocationCell}
            highlightRow={highlightRow}
          />
          <MatrixInput
            label="Need"
            labelColor="text-orange-600 dark:text-orange-400"
            data={ms.need} n={ms.n} m={ms.m}
            onChange={ms.setNeedCell}
            highlightRow={highlightRow}
          />
        </div>
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            <span className="font-semibold">Quy tắc tự động:</span>
            {' '}Allocation là cố định — bạn nhập trực tiếp, không tự cập nhật.
            {' '}<span className="font-semibold">Sửa Max → Need tự cập nhật</span> (Need = Max − Allocation).
            {' '}<span className="font-semibold">Sửa Need → Max tự cập nhật</span> (Max = Need + Allocation).
            {' '}Ô màu vàng = chưa nhập.
          </div>
        </div>
      </div>

      {/* Mode selector */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
        <div className="flex flex-wrap items-start gap-6">
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Chế độ</div>
            <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
              {([
                { id: 'safety' as AlgorithmMode, label: '🔒 Kiểm tra trạng thái an toàn' },
                { id: 'request' as AlgorithmMode, label: '📥 Kiểm tra yêu cầu cấp phát' },
              ] as const).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setMode(opt.id)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    mode === opt.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {mode === 'request' && (
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Tiến trình</div>
                <select
                  value={requestProcessIdx}
                  onChange={(e) => setRequestProcessIdx(Number(e.target.value))}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {Array.from({ length: ms.n }, (_, i) => (
                    <option key={i} value={i}>P{i}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Request[P{requestProcessIdx}]
                </div>
                <div className="flex items-start gap-2">
                  <MatrixInput
                    label="" data={[requestVector]}
                    isVector={false} n={1} m={ms.m}
                    onChange={setRequestCell}
                  />
                  <button
                    onClick={() => { setRequestFileError(null); requestFileRef.current?.click(); }}
                    className="mt-0.5 flex items-center gap-1 px-2 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600 whitespace-nowrap"
                    title="Import vector từ file (1 dòng, m số)"
                  >
                    <Upload size={12} />
                    File
                  </button>
                  <input ref={requestFileRef} type="file" accept=".txt,.dat,.csv" className="hidden" onChange={handleRequestFileImport} />
                </div>
                {requestFileError && (
                  <div className="mt-1.5 flex items-start gap-1.5 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300">
                    <span className="font-bold shrink-0">Lỗi:</span>
                    <span>{requestFileError}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simulation panel */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Simulation</h2>
        {validationError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
            <span className="font-bold shrink-0">⚠ Không thể chạy:</span>
            <span>{validationError}</span>
          </div>
        )}
        <SimulationPanel
          steps={steps}
          onRun={runAlgorithm}
          onHighlightChange={setHighlightRow}
          onIsDoneChange={setSimulationDone}
          validationData={lastValidState ?? undefined}
        />

        {/* Apply button — shown when simulation is done and request was granted */}
        {mode === 'request' && simulationDone && steps[steps.length - 1]?.isSafe === true && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <CheckCheck size={16} className="text-green-600 dark:text-green-400 shrink-0" />
            <span className="text-sm text-green-700 dark:text-green-300 flex-1">
              Yêu cầu được chấp thuận. Bấm <strong>Apply</strong> để cập nhật trạng thái hệ thống.
            </span>
            <button
              onClick={handleApplyAllocation}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
