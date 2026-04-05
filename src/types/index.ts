// Nullable cell type used in UI state (allows empty input)
export type Cell = number | null;
export type InputMatrix = Cell[][];
export type InputVector = Cell[];

// Strict types used only inside algorithm functions (never null)
export type Matrix = number[][];
export type Vector = number[];

export interface BankerState {
  n: number;
  m: number;
  available: Vector;
  max: Matrix;
  allocation: Matrix;
  need: Matrix;
}

export interface DeadlockState {
  n: number;
  m: number;
  available: Vector;
  allocation: Matrix;
  request: Matrix;
}

export interface StepComparison {
  label: string;
  lhs: Vector;
  rhs: Vector;
  rhsLabel?: string;
  satisfied: boolean;
}

export interface SimulationStep {
  type: 'init' | 'check' | 'allocate' | 'skip' | 'result' | 'error' | 'precheck' | 'tentative';
  processIndex?: number;
  work: Vector;
  finish: boolean[];
  description: string;
  comparison?: StepComparison;
  safeSequence: number[];
  isSafe?: boolean;
  deadlockedProcesses?: number[];
  errorMessage?: string;
}

export interface SimulationResult {
  steps: SimulationStep[];
  isSafe: boolean;
  safeSequence?: number[];
  deadlockedProcesses?: number[];
  errorMessage?: string;
}

export interface ResourceRequest {
  processIndex: number;
  request: Vector;
}

export type AlgorithmMode = 'safety' | 'request';

export type ImportFormat = 'max-allocation' | 'max-need';

export type DeadlockImportFormat = 'allocation-request';
