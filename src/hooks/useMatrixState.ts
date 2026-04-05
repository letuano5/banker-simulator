import { useCallback, useEffect, useRef, useState } from 'react';
import type { Cell, InputMatrix, InputVector, Matrix, Vector } from '../types';
import {
  createInputMatrix,
  createInputVector,
  resizeInputMatrix,
  resizeInputVector,
  computeNeed,
  computeMax,
} from '../lib/matrixUtils';

type SyncMode = 'banker' | 'deadlock';

interface MatrixStateOptions {
  initialN?: number;
  initialM?: number;
  syncMode: SyncMode;
}

const STORAGE_VERSION = 1;

interface BankerStorage {
  version: number; n: number; m: number;
  available: Cell[]; max: Cell[][]; allocation: Cell[][]; need: Cell[][];
}
interface DeadlockStorage {
  version: number; n: number; m: number;
  available: Cell[]; dlAllocation: Cell[][]; dlRequest: Cell[][];
}

function loadStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as T & { version: number };
    if (parsed.version !== STORAGE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function useMatrixState(options: MatrixStateOptions) {
  const { initialN = 3, initialM = 3, syncMode } = options;
  const storageKey = syncMode === 'banker' ? 'os-banker-v1' : 'os-deadlock-v1';

  // ── Load initial state from localStorage ────────────────────────────────────

  const saved = loadStorage<BankerStorage | DeadlockStorage>(storageKey);

  const [n, setNState] = useState(() => saved?.n ?? initialN);
  const [m, setMState] = useState(() => saved?.m ?? initialM);
  const [available, setAvailable] = useState<InputVector>(() =>
    saved?.available ?? createInputVector(initialM)
  );

  // Banker-specific
  const [max, setMax] = useState<InputMatrix>(() =>
    syncMode === 'banker'
      ? ((saved as BankerStorage | null)?.max ?? createInputMatrix(initialN, initialM))
      : createInputMatrix(initialN, initialM)
  );
  const [allocation, setAllocation] = useState<InputMatrix>(() =>
    syncMode === 'banker'
      ? ((saved as BankerStorage | null)?.allocation ?? createInputMatrix(initialN, initialM))
      : createInputMatrix(initialN, initialM)
  );
  const [need, setNeed] = useState<InputMatrix>(() =>
    syncMode === 'banker'
      ? ((saved as BankerStorage | null)?.need ?? createInputMatrix(initialN, initialM))
      : createInputMatrix(initialN, initialM)
  );

  // Deadlock-specific
  const [dlAllocation, setDlAllocation] = useState<InputMatrix>(() =>
    syncMode === 'deadlock'
      ? ((saved as DeadlockStorage | null)?.dlAllocation ?? createInputMatrix(initialN, initialM))
      : createInputMatrix(initialN, initialM)
  );
  const [dlRequest, setDlRequest] = useState<InputMatrix>(() =>
    syncMode === 'deadlock'
      ? ((saved as DeadlockStorage | null)?.dlRequest ?? createInputMatrix(initialN, initialM))
      : createInputMatrix(initialN, initialM)
  );

  // ── Persist to localStorage (debounced 400ms) ───────────────────────────────

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        const data: BankerStorage | DeadlockStorage =
          syncMode === 'banker'
            ? { version: STORAGE_VERSION, n, m, available, max, allocation, need }
            : { version: STORAGE_VERSION, n, m, available, dlAllocation, dlRequest };
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch { /* quota exceeded or private browsing */ }
    }, 400);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, m, available, max, allocation, need, dlAllocation, dlRequest]);

  // ── Clear storage + reset to defaults ──────────────────────────────────────

  const clearStorage = useCallback(() => {
    localStorage.removeItem(storageKey);
    setNState(initialN); setMState(initialM);
    setAvailable(createInputVector(initialM));
    if (syncMode === 'banker') {
      setMax(createInputMatrix(initialN, initialM));
      setAllocation(createInputMatrix(initialN, initialM));
      setNeed(createInputMatrix(initialN, initialM));
    } else {
      setDlAllocation(createInputMatrix(initialN, initialM));
      setDlRequest(createInputMatrix(initialN, initialM));
    }
  }, [initialN, initialM, storageKey, syncMode]);

  // ── Refs for synchronous access in auto-sync callbacks ─────────────────────

  const allocationRef = useRef(allocation);
  allocationRef.current = allocation;

  // ── Dimension setters ───────────────────────────────────────────────────────

  const setN = useCallback((newN: number) => {
    setNState(newN);
    const cols = m;
    if (syncMode === 'banker') {
      setMax((mx) => resizeInputMatrix(mx, newN, cols));
      setAllocation((al) => resizeInputMatrix(al, newN, cols));
      setNeed((nd) => resizeInputMatrix(nd, newN, cols));
    } else {
      setDlAllocation((al) => resizeInputMatrix(al, newN, cols));
      setDlRequest((rq) => resizeInputMatrix(rq, newN, cols));
    }
  }, [m, syncMode]);

  const setM = useCallback((newM: number) => {
    setMState(newM);
    setAvailable((v) => resizeInputVector(v, newM));
    if (syncMode === 'banker') {
      setMax((mx) => resizeInputMatrix(mx, mx.length, newM));
      setAllocation((al) => resizeInputMatrix(al, al.length, newM));
      setNeed((nd) => resizeInputMatrix(nd, nd.length, newM));
    } else {
      setDlAllocation((al) => resizeInputMatrix(al, al.length, newM));
      setDlRequest((rq) => resizeInputMatrix(rq, rq.length, newM));
    }
  }, [syncMode]);

  const addRow = useCallback(() => {
    const cols = m;
    setNState((prev) => prev + 1);
    if (syncMode === 'banker') {
      setMax((mx) => [...mx, createInputVector(cols)]);
      setAllocation((al) => [...al, createInputVector(cols)]);
      setNeed((nd) => [...nd, createInputVector(cols)]);
    } else {
      setDlAllocation((al) => [...al, createInputVector(cols)]);
      setDlRequest((rq) => [...rq, createInputVector(cols)]);
    }
  }, [m, syncMode]);

  const addColumn = useCallback(() => {
    setMState((prev) => prev + 1);
    setAvailable((v) => [...v, 0]);
    if (syncMode === 'banker') {
      setMax((mx) => mx.map((row) => [...row, 0]));
      setAllocation((al) => al.map((row) => [...row, 0]));
      setNeed((nd) => nd.map((row) => [...row, 0]));
    } else {
      setDlAllocation((al) => al.map((row) => [...row, 0]));
      setDlRequest((rq) => rq.map((row) => [...row, 0]));
    }
  }, [syncMode]);

  // ── Cell setters ────────────────────────────────────────────────────────────

  const setAvailableCell = useCallback((_row: number, col: number, value: Cell) => {
    setAvailable((v) => { const next = [...v]; next[col] = value; return next; });
  }, []);

  const setMaxCell = useCallback((row: number, col: number, value: Cell) => {
    const al = allocationRef.current;
    setMax((mx) => { const next = mx.map((r) => [...r]); next[row][col] = value; return next; });
    setNeed((nd) => { const next = nd.map((r) => [...r]); next[row][col] = computeNeed(value, al[row]?.[col] ?? null); return next; });
  }, []);

  const setAllocationCell = useCallback((row: number, col: number, value: Cell) => {
    setAllocation((al) => { const next = al.map((r) => [...r]); next[row][col] = value; return next; });
  }, []);

  const setNeedCell = useCallback((row: number, col: number, value: Cell) => {
    const al = allocationRef.current;
    setNeed((nd) => { const next = nd.map((r) => [...r]); next[row][col] = value; return next; });
    setMax((mx) => { const next = mx.map((r) => [...r]); next[row][col] = computeMax(value, al[row]?.[col] ?? null); return next; });
  }, []);

  const setDlAllocationCell = useCallback((row: number, col: number, value: Cell) => {
    setDlAllocation((al) => { const next = al.map((r) => [...r]); next[row][col] = value; return next; });
  }, []);

  const setDlRequestCell = useCallback((row: number, col: number, value: Cell) => {
    setDlRequest((rq) => { const next = rq.map((r) => [...r]); next[row][col] = value; return next; });
  }, []);

  // ── Apply resource request (batch update Available/Allocation/Need) ─────────

  const applyBankerAllocation = useCallback((processIdx: number, request: number[]) => {
    setAvailable((v) => v.map((cell, j) => (cell as number) - (request[j] ?? 0)) as InputVector);
    setAllocation((al) => al.map((row, i) =>
      i === processIdx ? row.map((cell, j) => (cell as number) + (request[j] ?? 0)) : row
    ));
    setNeed((nd) => nd.map((row, i) =>
      i === processIdx ? row.map((cell, j) => (cell as number) - (request[j] ?? 0)) : row
    ));
    // Max = Need + Allocation stays unchanged (delta cancels out)
  }, []);

  // ── File import ─────────────────────────────────────────────────────────────

  const importBanker = useCallback((
    newN: number, newM: number,
    newAvailable: Vector, newMax: Matrix, newAllocation: Matrix, newNeed: Matrix,
  ) => {
    setNState(newN); setMState(newM);
    setAvailable(newAvailable as InputVector); setMax(newMax as InputMatrix);
    setAllocation(newAllocation as InputMatrix); setNeed(newNeed as InputMatrix);
  }, []);

  const importDeadlock = useCallback((
    newN: number, newM: number,
    newAvailable: Vector, newAllocation: Matrix, newRequest: Matrix,
  ) => {
    setNState(newN); setMState(newM);
    setAvailable(newAvailable as InputVector);
    setDlAllocation(newAllocation as InputMatrix); setDlRequest(newRequest as InputMatrix);
  }, []);

  return {
    n, m, setN, setM, addRow, addColumn,
    available, max, allocation, need,
    setAvailableCell, setMaxCell, setAllocationCell, setNeedCell,
    importBanker,
    applyBankerAllocation,
    dlAllocation, dlRequest,
    setDlAllocationCell, setDlRequestCell,
    importDeadlock,
    clearStorage,
  };
}
