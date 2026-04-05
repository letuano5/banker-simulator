import { useCallback, useEffect, useRef, useState } from 'react';
import type { SimulationStep } from '../types';

interface SimulationControls {
  play: () => void;
  pause: () => void;
  step: () => void;
  stepBack: () => void;
  goToStep: (index: number) => void;
  reset: () => void;
  setSpeed: (ms: number) => void;
}

interface UseSimulationReturn {
  currentStep: SimulationStep | null;
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  isDone: boolean;
  speed: number;
  controls: SimulationControls;
}

export function useSimulation(steps: SimulationStep[]): UseSimulationReturn {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeedState] = useState(800);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startTimer = useCallback((ms: number) => {
    clearTimer();
    intervalRef.current = setInterval(() => {
      setCurrentStepIndex((prev) => {
        const next = prev + 1;
        if (next >= stepsRef.current.length - 1) {
          setIsPlaying(false);
          clearTimer();
          return stepsRef.current.length - 1;
        }
        return next;
      });
    }, ms);
  }, []);

  useEffect(() => {
    return clearTimer;
  }, []);

  // Reset when steps change (new algorithm run)
  useEffect(() => {
    clearTimer();
    setIsPlaying(false);
    setCurrentStepIndex(-1);
  }, [steps]);

  const play = useCallback(() => {
    if (currentStepIndex >= steps.length - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(true);
    startTimer(speed);
  }, [currentStepIndex, steps.length, speed, startTimer]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    clearTimer();
  }, []);

  const step = useCallback(() => {
    pause();
    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  }, [pause, steps.length]);

  const stepBack = useCallback(() => {
    pause();
    setCurrentStepIndex((prev) => Math.max(prev - 1, -1));
  }, [pause]);

  const goToStep = useCallback((index: number) => {
    pause();
    setCurrentStepIndex(Math.max(-1, Math.min(index, steps.length - 1)));
  }, [pause, steps.length]);

  const reset = useCallback(() => {
    pause();
    setCurrentStepIndex(-1);
  }, [pause]);

  const setSpeed = useCallback((ms: number) => {
    setSpeedState(ms);
    if (isPlaying) {
      startTimer(ms);
    }
  }, [isPlaying, startTimer]);

  const isDone = steps.length > 0 && currentStepIndex >= steps.length - 1;
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] ?? null : null;

  return {
    currentStep,
    currentStepIndex,
    totalSteps: steps.length,
    isPlaying,
    isDone,
    speed,
    controls: { play, pause, step, stepBack, goToStep, reset, setSpeed },
  };
}
