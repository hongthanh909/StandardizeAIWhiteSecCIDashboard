import { createContext, useContext, useState, type ReactNode } from 'react';
import { RUNS, getRunById, getProjectById, type RunData, type ProjectData } from '../data/mockData';

interface AppContextValue {
  selectedRunId:     string;
  setSelectedRunId:  (id: string) => void;
  selectedRun:       RunData | undefined;
  activeProject:     ProjectData | undefined;
  navigateTo:        (screen: string, runId?: string, projectId?: string) => void;
  screen:            string;
  setScreen:         (s: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen]               = useState('overview');
  const [selectedRunId, setSelectedRunId] = useState<string>(
    RUNS.find(r => r.ciStatus === 'running')?.id ?? RUNS[0].id
  );

  const selectedRun   = getRunById(selectedRunId);
  const activeProject = selectedRun ? getProjectById(selectedRun.projectId) : undefined;

  function navigateTo(s: string, runId?: string) {
    setScreen(s);
    if (runId) setSelectedRunId(runId);
  }

  return (
    <AppContext.Provider value={{ selectedRunId, setSelectedRunId, selectedRun, activeProject, navigateTo, screen, setScreen }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
