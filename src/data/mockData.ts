/* ═══════════════════════════════════════════════════════════════════════
   AI WhiteSec CI — Mock Data
   DỮ LIỆU MINH HỌA — không phải kết quả thực nghiệm
   ═══════════════════════════════════════════════════════════════════════ */

export type ProjectStatus   = 'active' | 'degraded' | 'inactive';
export type ProjectHealth   = 'healthy' | 'warning' | 'error';
export type RunStatus       = 'completed' | 'running' | 'failed' | 'cancelled';
export type TaskStatus      = 'completed' | 'running' | 'waiting' | 'failed' | 'cancelled';
export type SGStatus        = 'passed' | 'failed' | 'pending' | 'not_configured' | 'partial_result';
export type Severity        = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type IncidentType    = 'pipeline_error' | 'scanner_unavailable' | 'partial_result' | 'security_finding';

/* ─── Types ────────────────────────────────────────────────────────────── */

export interface TaskData {
  id: string;
  runId: string;
  stage: number;
  name: string;
  displayName: string;
  status: TaskStatus;
  parallel?: boolean;
  parallelWith?: string | null;
  dependencies: string[];
  startedAt: string | null;
  completedAt: string | null;
  duration: string;
  retryCount: number;
  exitCode: number | null;
  lastLog: string;
  artifact: string | null;
  failureReason: string | null;
  waitingReason: string | null;
}

export interface EventData {
  id: string;
  runId: string;
  taskId: string | null;
  time: string;
  type: 'info' | 'warning' | 'error' | 'success';
  source: string;
  message: string;
  findingId?: string;
}

export interface RunData {
  id: string;
  projectId: string;
  project: string;
  repo: string;
  branch: string;
  commit: string;
  commitMsg: string;
  ciStatus: RunStatus;
  securityGate: SGStatus;
  findings: number;
  confirmedVulns: number;
  duration: string;
  triggeredBy: 'push' | 'pull_request' | 'manual' | 'schedule';
  triggeredUser: string;
  queueTime: string;
  startedAt: string;
  completedAt: string | null;
  failureReason: string | null;
  tasks: TaskData[];
  events: EventData[];
  findingIds: string[];
  securityGateDetail: {
    status: SGStatus;
    policy: string;
    conditions: string[];
    receivedSources: string[];
    missingSources: string[];
    affectingFindings: string[];
    reason: string;
  };
}

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  repository: string;
  defaultBranch: string;
  technology: string;
  framework: string;
  environment: string;
  owner: string;
  status: ProjectStatus;
  health: ProjectHealth;
  activeRunId: string | null;
  currentPhase: string;
  completedPhases: number;
  totalPhases: number;
  openFindings: number;
  confirmedVulnerabilities: number;
  securityGate: SGStatus;
  lastActivity: string;
  scanners: string[];
  runIds: string[];
}

export interface FindingData {
  id: string;
  runId: string;
  projectId: string;
  project: string;
  repo: string;
  commit: string;
  file: string;
  line: number;
  function: string;
  cwe: string;
  cweName: string;
  severity: Severity;
  sourceDetection: string;
  codebertConfidence: number;
  codebertLabel: string;
  checkmarxSeverity: string;
  combinationPolicy: string;
  codeSnippet: string;
  evidence: string;
  remediation: string;
  validationTest: string;
  verificationStatus: 'pending' | 'confirmed' | 'false_positive';
  statusHistory: { status: string; timestamp: string; actor: string }[];
  timestamp: string;
  taskId: string;
  eventId: string;
}

export interface IncidentData {
  id: string;
  type: IncidentType;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  project: string;
  projectId: string;
  runId: string;
  stage: string;
  error: string;
  cause: string;
  timestamp: string;
  handlingStatus: 'open' | 'investigating' | 'resolved';
  suggestedAction: string;
}

/* ─── Helper format functions ──────────────────────────────────────────── */

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 60)  return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

export function pipelineProgress(tasks: TaskData[]): { pct: number; done: number; total: number; running: string | null; next: string | null; blocking: string | null } {
  const done  = tasks.filter(t => t.status === 'completed').length;
  const total = tasks.length;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  const running  = tasks.find(t => t.status === 'running')?.displayName ?? null;
  const next     = tasks.find(t => t.status === 'waiting')?.displayName ?? null;
  const blocking = tasks.find(t => t.status === 'failed')?.displayName ?? null;
  return { pct, done, total, running, next, blocking };
}

/* ─── Tasks ────────────────────────────────────────────────────────────── */

function mkTask(o: Partial<TaskData> & Pick<TaskData, 'id' | 'runId' | 'stage' | 'name' | 'displayName' | 'status'>): TaskData {
  return {
    parallel: false, parallelWith: null, dependencies: [],
    startedAt: null, completedAt: null, duration: '—',
    retryCount: 0, exitCode: null,
    lastLog: '—', artifact: null,
    failureReason: null, waitingReason: null,
    ...o,
  };
}

/* #M-101 tasks — Flask Lab A — 6/6 completed */
const TASKS_M101: TaskData[] = [
  mkTask({ id:'M101-T1', runId:'#M-101', stage:1, name:'checkout', displayName:'Checkout', status:'completed',
    dependencies:[], startedAt:'2024-01-15T08:12:03Z', completedAt:'2024-01-15T08:12:15Z', duration:'12s', exitCode:0,
    lastLog:'Cloned org/flask-lab-a @ a3f2c1d' }),
  mkTask({ id:'M101-T2', runId:'#M-101', stage:2, name:'setup-python', displayName:'Setup Python', status:'completed',
    dependencies:['M101-T1'], startedAt:'2024-01-15T08:12:15Z', completedAt:'2024-01-15T08:12:43Z', duration:'28s', exitCode:0,
    lastLog:'Python 3.11.7 + 42 packages installed' }),
  mkTask({ id:'M101-T3', runId:'#M-101', stage:3, name:'codebert-scan', displayName:'CodeBERT Detection', status:'completed',
    parallel:true, parallelWith:'M101-T4', dependencies:['M101-T2'],
    startedAt:'2024-01-15T08:12:43Z', completedAt:'2024-01-15T08:14:58Z', duration:'2m 15s', exitCode:0,
    lastLog:'2 predictions (1 ≥ 0.70)', artifact:'codebert-m101.json' }),
  mkTask({ id:'M101-T4', runId:'#M-101', stage:3, name:'checkmarx-scan', displayName:'Checkmarx Scan', status:'completed',
    parallel:true, parallelWith:'M101-T3', dependencies:['M101-T2'],
    startedAt:'2024-01-15T08:12:43Z', completedAt:'2024-01-15T08:15:22Z', duration:'2m 39s', exitCode:0,
    lastLog:'1 HIGH finding', artifact:'checkmarx-m101.xml' }),
  mkTask({ id:'M101-T5', runId:'#M-101', stage:4, name:'combine-results', displayName:'Correlate & Combine', status:'completed',
    dependencies:['M101-T3','M101-T4'], startedAt:'2024-01-15T08:15:22Z', completedAt:'2024-01-15T08:15:47Z', duration:'25s', exitCode:0,
    lastLog:'Combined: 1 security finding (AND policy)', artifact:'combined-m101.json' }),
  mkTask({ id:'M101-T6', runId:'#M-101', stage:5, name:'security-gate', displayName:'Security Gate & Report', status:'completed',
    dependencies:['M101-T5'], startedAt:'2024-01-15T08:15:47Z', completedAt:'2024-01-15T08:16:12Z', duration:'25s', exitCode:0,
    lastLog:'Gate PASSED — 1 HIGH finding (threshold not exceeded)', artifact:'report-m101.html' }),
];

/* #M-102 tasks — Python API C — 6/6 completed */
const TASKS_M102: TaskData[] = [
  mkTask({ id:'M102-T1', runId:'#M-102', stage:1, name:'checkout', displayName:'Checkout', status:'completed',
    dependencies:[], startedAt:'2024-01-15T09:05:03Z', completedAt:'2024-01-15T09:05:16Z', duration:'13s', exitCode:0,
    lastLog:'Cloned org/python-api-c @ b8e4f2a' }),
  mkTask({ id:'M102-T2', runId:'#M-102', stage:2, name:'setup-python', displayName:'Setup Python', status:'completed',
    dependencies:['M102-T1'], startedAt:'2024-01-15T09:05:16Z', completedAt:'2024-01-15T09:05:52Z', duration:'36s', exitCode:0,
    lastLog:'Python 3.11.7 + 38 packages' }),
  mkTask({ id:'M102-T3', runId:'#M-102', stage:3, name:'codebert-scan', displayName:'CodeBERT Detection', status:'completed',
    parallel:true, parallelWith:'M102-T4', dependencies:['M102-T2'],
    startedAt:'2024-01-15T09:05:52Z', completedAt:'2024-01-15T09:07:44Z', duration:'1m 52s', exitCode:0,
    lastLog:'1 prediction ≥ 0.70 (hardcoded secret)', artifact:'codebert-m102.json' }),
  mkTask({ id:'M102-T4', runId:'#M-102', stage:3, name:'checkmarx-scan', displayName:'Checkmarx Scan', status:'completed',
    parallel:true, parallelWith:'M102-T3', dependencies:['M102-T2'],
    startedAt:'2024-01-15T09:05:52Z', completedAt:'2024-01-15T09:08:15Z', duration:'2m 23s', exitCode:0,
    lastLog:'1 MEDIUM finding (hardcoded credential)', artifact:'checkmarx-m102.xml' }),
  mkTask({ id:'M102-T5', runId:'#M-102', stage:4, name:'combine-results', displayName:'Correlate & Combine', status:'completed',
    dependencies:['M102-T3','M102-T4'], startedAt:'2024-01-15T09:08:15Z', completedAt:'2024-01-15T09:08:48Z', duration:'33s', exitCode:0,
    lastLog:'Combined: 1 security finding (AND policy)', artifact:'combined-m102.json' }),
  mkTask({ id:'M102-T6', runId:'#M-102', stage:5, name:'security-gate', displayName:'Security Gate & Report', status:'completed',
    dependencies:['M102-T5'], startedAt:'2024-01-15T09:08:48Z', completedAt:'2024-01-15T09:10:38Z', duration:'1m 50s', exitCode:0,
    lastLog:'Gate PASSED — 1 MEDIUM finding', artifact:'report-m102.html' }),
];

/* #M-103 tasks — Django Demo B — FAILED (Checkmarx partial scan) */
const TASKS_M103: TaskData[] = [
  mkTask({ id:'M103-T1', runId:'#M-103', stage:1, name:'checkout', displayName:'Checkout', status:'completed',
    dependencies:[], startedAt:'2024-01-15T10:30:05Z', completedAt:'2024-01-15T10:30:17Z', duration:'12s', exitCode:0,
    lastLog:'Cloned org/django-demo-b @ c9d1e3b' }),
  mkTask({ id:'M103-T2', runId:'#M-103', stage:2, name:'setup-python', displayName:'Setup Python', status:'completed',
    dependencies:['M103-T1'], startedAt:'2024-01-15T10:30:17Z', completedAt:'2024-01-15T10:30:58Z', duration:'41s', exitCode:0,
    lastLog:'Python 3.11.7 + 55 packages' }),
  mkTask({ id:'M103-T3', runId:'#M-103', stage:3, name:'codebert-scan', displayName:'CodeBERT Detection', status:'completed',
    parallel:true, parallelWith:'M103-T4', dependencies:['M103-T2'],
    startedAt:'2024-01-15T10:30:58Z', completedAt:'2024-01-15T10:31:52Z', duration:'54s', exitCode:0,
    lastLog:'0 predictions ≥ threshold. No finding.', artifact:'codebert-m103.json' }),
  mkTask({ id:'M103-T4', runId:'#M-103', stage:3, name:'checkmarx-scan', displayName:'Checkmarx Scan', status:'failed',
    parallel:true, parallelWith:'M103-T3', dependencies:['M103-T2'],
    startedAt:'2024-01-15T10:30:58Z', completedAt:'2024-01-15T10:32:07Z', duration:'1m 09s', exitCode:2, retryCount:1,
    lastLog:'FATAL: Scanner returned exit code 2 — incomplete result set',
    failureReason:'Checkmarx partial scan. Scanner có thể đã timeout hoặc mất kết nối với CxSAST server. Exit code 2 = partial results.' }),
  mkTask({ id:'M103-T5', runId:'#M-103', stage:4, name:'combine-results', displayName:'Correlate & Combine', status:'cancelled',
    dependencies:['M103-T3','M103-T4'],
    waitingReason:'Bị hủy do Checkmarx Scan (M103-T4) thất bại.' }),
  mkTask({ id:'M103-T6', runId:'#M-103', stage:5, name:'security-gate', displayName:'Security Gate & Report', status:'cancelled',
    dependencies:['M103-T5'],
    waitingReason:'Bị hủy do pipeline upstream thất bại.' }),
];

/* #M-104 tasks — Django Demo B — RUNNING (3/6 = 50%) */
const TASKS_M104: TaskData[] = [
  mkTask({ id:'M104-T1', runId:'#M-104', stage:1, name:'checkout', displayName:'Checkout', status:'completed',
    dependencies:[], startedAt:'2024-01-15T11:45:03Z', completedAt:'2024-01-15T11:45:15Z', duration:'12s', exitCode:0,
    lastLog:'Cloned org/django-demo-b @ d4a7f9c' }),
  mkTask({ id:'M104-T2', runId:'#M-104', stage:2, name:'setup-python', displayName:'Setup Python', status:'completed',
    dependencies:['M104-T1'], startedAt:'2024-01-15T11:45:15Z', completedAt:'2024-01-15T11:46:04Z', duration:'49s', exitCode:0,
    lastLog:'Python 3.11.7 + 55 packages installed' }),
  mkTask({ id:'M104-T3', runId:'#M-104', stage:3, name:'codebert-scan', displayName:'CodeBERT Detection', status:'running',
    parallel:true, parallelWith:'M104-T4', dependencies:['M104-T2'],
    startedAt:'2024-01-15T11:46:04Z', duration:'—',
    lastLog:'> Phân tích file 14/28: django_app/views/api.py' }),
  mkTask({ id:'M104-T4', runId:'#M-104', stage:3, name:'checkmarx-scan', displayName:'Checkmarx Scan', status:'running',
    parallel:true, parallelWith:'M104-T3', dependencies:['M104-T2'],
    startedAt:'2024-01-15T11:46:04Z', duration:'—',
    lastLog:'> Scanning source tree... 62% complete' }),
  mkTask({ id:'M104-T5', runId:'#M-104', stage:4, name:'combine-results', displayName:'Correlate & Combine', status:'waiting',
    dependencies:['M104-T3','M104-T4'],
    waitingReason:'Chờ CodeBERT Detection và Checkmarx Scan hoàn tất.' }),
  mkTask({ id:'M104-T6', runId:'#M-104', stage:5, name:'security-gate', displayName:'Security Gate & Report', status:'waiting',
    dependencies:['M104-T5'],
    waitingReason:'Chờ bước Correlate & Combine.' }),
];

/* #M-105 tasks — Flask Lab A — RUNNING (5/6 = 83%) */
const TASKS_M105: TaskData[] = [
  mkTask({ id:'M105-T1', runId:'#M-105', stage:1, name:'checkout', displayName:'Checkout', status:'completed',
    dependencies:[], startedAt:'2024-01-15T11:52:04Z', completedAt:'2024-01-15T11:52:16Z', duration:'12s', exitCode:0,
    lastLog:'Cloned org/flask-lab-a @ e2b5c8d' }),
  mkTask({ id:'M105-T2', runId:'#M-105', stage:2, name:'setup-python', displayName:'Setup Python', status:'completed',
    dependencies:['M105-T1'], startedAt:'2024-01-15T11:52:16Z', completedAt:'2024-01-15T11:52:52Z', duration:'36s', exitCode:0,
    lastLog:'Python 3.11.7 + 42 packages' }),
  mkTask({ id:'M105-T3', runId:'#M-105', stage:3, name:'codebert-scan', displayName:'CodeBERT Detection', status:'completed',
    parallel:true, parallelWith:'M105-T4', dependencies:['M105-T2'],
    startedAt:'2024-01-15T11:52:52Z', completedAt:'2024-01-15T11:54:48Z', duration:'1m 56s', exitCode:0,
    lastLog:'1 prediction ≥ 0.70 (file upload handler)', artifact:'codebert-m105.json' }),
  mkTask({ id:'M105-T4', runId:'#M-105', stage:3, name:'checkmarx-scan', displayName:'Checkmarx Scan', status:'completed',
    parallel:true, parallelWith:'M105-T3', dependencies:['M105-T2'],
    startedAt:'2024-01-15T11:52:52Z', completedAt:'2024-01-15T11:55:10Z', duration:'2m 18s', exitCode:0,
    lastLog:'Scan complete — 0 HIGH, 1 MEDIUM finding', artifact:'checkmarx-m105.xml' }),
  mkTask({ id:'M105-T5', runId:'#M-105', stage:4, name:'combine-results', displayName:'Correlate & Combine', status:'running',
    dependencies:['M105-T3','M105-T4'],
    startedAt:'2024-01-15T11:55:10Z', duration:'—',
    lastLog:'> Áp dụng combination policy AND...' }),
  mkTask({ id:'M105-T6', runId:'#M-105', stage:5, name:'security-gate', displayName:'Security Gate & Report', status:'waiting',
    dependencies:['M105-T5'],
    waitingReason:'Chờ Correlate & Combine hoàn tất.' }),
];

/* ─── Events ────────────────────────────────────────────────────────────── */

const EVENTS_M101: EventData[] = [
  { id:'E-M101-1', runId:'#M-101', taskId:'M101-T1', time:'2024-01-15T08:12:00Z', type:'info',    source:'GitHub Actions', message:'Workflow triggered by push (dev-01)' },
  { id:'E-M101-2', runId:'#M-101', taskId:'M101-T1', time:'2024-01-15T08:12:15Z', type:'success', source:'GitHub Actions', message:'Checkout hoàn tất — org/flask-lab-a@a3f2c1d' },
  { id:'E-M101-3', runId:'#M-101', taskId:'M101-T2', time:'2024-01-15T08:12:43Z', type:'success', source:'GitHub Actions', message:'Python 3.11.7 environment sẵn sàng' },
  { id:'E-M101-4', runId:'#M-101', taskId:'M101-T3', time:'2024-01-15T08:14:58Z', type:'success', source:'CodeBERT',       message:'CodeBERT scan hoàn tất — 2 predictions, 1 ≥ 0.70' },
  { id:'E-M101-5', runId:'#M-101', taskId:'M101-T4', time:'2024-01-15T08:15:22Z', type:'success', source:'Checkmarx',     message:'Checkmarx scan hoàn tất — 1 HIGH finding' },
  { id:'E-M101-6', runId:'#M-101', taskId:'M101-T5', time:'2024-01-15T08:15:47Z', type:'success', source:'Correlator',    message:'Combination policy AND: 1 finding matched', findingId:'F-001' },
  { id:'E-M101-7', runId:'#M-101', taskId:'M101-T6', time:'2024-01-15T08:16:12Z', type:'success', source:'Security Gate', message:'Security Gate: PASSED — 1 HIGH finding, threshold không vượt ngưỡng' },
];

const EVENTS_M102: EventData[] = [
  { id:'E-M102-1', runId:'#M-102', taskId:'M102-T1', time:'2024-01-15T09:05:00Z', type:'info',    source:'GitHub Actions', message:'Workflow triggered by pull_request (dev-02)' },
  { id:'E-M102-2', runId:'#M-102', taskId:'M102-T1', time:'2024-01-15T09:05:16Z', type:'success', source:'GitHub Actions', message:'Checkout hoàn tất — org/python-api-c@b8e4f2a' },
  { id:'E-M102-3', runId:'#M-102', taskId:'M102-T2', time:'2024-01-15T09:05:52Z', type:'success', source:'GitHub Actions', message:'Python 3.11.7 + 38 packages installed' },
  { id:'E-M102-4', runId:'#M-102', taskId:'M102-T3', time:'2024-01-15T09:07:44Z', type:'success', source:'CodeBERT',       message:'CodeBERT scan hoàn tất — 1 prediction ≥ 0.84 (hardcoded secret)' },
  { id:'E-M102-5', runId:'#M-102', taskId:'M102-T4', time:'2024-01-15T09:08:15Z', type:'success', source:'Checkmarx',     message:'Checkmarx scan hoàn tất — 1 MEDIUM finding' },
  { id:'E-M102-6', runId:'#M-102', taskId:'M102-T5', time:'2024-01-15T09:08:48Z', type:'success', source:'Correlator',    message:'Combination policy AND: 1 finding matched', findingId:'F-002' },
  { id:'E-M102-7', runId:'#M-102', taskId:'M102-T6', time:'2024-01-15T09:10:38Z', type:'success', source:'Security Gate', message:'Security Gate: PASSED — 1 MEDIUM finding' },
];

const EVENTS_M103: EventData[] = [
  { id:'E-M103-1', runId:'#M-103', taskId:'M103-T1', time:'2024-01-15T10:30:00Z', type:'info',    source:'GitHub Actions', message:'Workflow triggered by push (dev-03)' },
  { id:'E-M103-2', runId:'#M-103', taskId:'M103-T1', time:'2024-01-15T10:30:17Z', type:'success', source:'GitHub Actions', message:'Checkout hoàn tất — org/django-demo-b@c9d1e3b' },
  { id:'E-M103-3', runId:'#M-103', taskId:'M103-T2', time:'2024-01-15T10:30:58Z', type:'success', source:'GitHub Actions', message:'Python 3.11.7 + 55 packages installed' },
  { id:'E-M103-4', runId:'#M-103', taskId:'M103-T3', time:'2024-01-15T10:31:52Z', type:'success', source:'CodeBERT',       message:'CodeBERT scan hoàn tất — 0 prediction ≥ threshold' },
  { id:'E-M103-5', runId:'#M-103', taskId:'M103-T4', time:'2024-01-15T10:32:07Z', type:'error',   source:'Checkmarx',     message:'Checkmarx FAILED — exit code 2, partial scan. Scanner timeout hoặc mất kết nối.' },
  { id:'E-M103-6', runId:'#M-103', taskId:'M103-T5', time:'2024-01-15T10:32:07Z', type:'warning', source:'Pipeline',      message:'Task combine-results bị hủy do dependency thất bại' },
  { id:'E-M103-7', runId:'#M-103', taskId:'M103-T6', time:'2024-01-15T10:32:07Z', type:'warning', source:'Pipeline',      message:'Pipeline dừng — Security Gate không thể đánh giá' },
];

const EVENTS_M104: EventData[] = [
  { id:'E-M104-1', runId:'#M-104', taskId:'M104-T1', time:'2024-01-15T11:45:00Z', type:'info',    source:'GitHub Actions', message:'Workflow triggered by pull_request (dev-03)' },
  { id:'E-M104-2', runId:'#M-104', taskId:'M104-T1', time:'2024-01-15T11:45:15Z', type:'success', source:'GitHub Actions', message:'Checkout hoàn tất — org/django-demo-b@d4a7f9c' },
  { id:'E-M104-3', runId:'#M-104', taskId:'M104-T2', time:'2024-01-15T11:46:04Z', type:'success', source:'GitHub Actions', message:'Python 3.11.7 + 55 packages installed' },
  { id:'E-M104-4', runId:'#M-104', taskId:'M104-T3', time:'2024-01-15T11:46:04Z', type:'info',    source:'CodeBERT',       message:'CodeBERT scan bắt đầu (song song với Checkmarx)' },
  { id:'E-M104-5', runId:'#M-104', taskId:'M104-T4', time:'2024-01-15T11:46:04Z', type:'info',    source:'Checkmarx',     message:'Checkmarx scan bắt đầu (song song với CodeBERT)' },
];

const EVENTS_M105: EventData[] = [
  { id:'E-M105-1', runId:'#M-105', taskId:'M105-T1', time:'2024-01-15T11:52:00Z', type:'info',    source:'GitHub Actions', message:'Workflow triggered by push (dev-01)' },
  { id:'E-M105-2', runId:'#M-105', taskId:'M105-T1', time:'2024-01-15T11:52:16Z', type:'success', source:'GitHub Actions', message:'Checkout hoàn tất — org/flask-lab-a@e2b5c8d' },
  { id:'E-M105-3', runId:'#M-105', taskId:'M105-T2', time:'2024-01-15T11:52:52Z', type:'success', source:'GitHub Actions', message:'Python 3.11.7 + 42 packages installed' },
  { id:'E-M105-4', runId:'#M-105', taskId:'M105-T3', time:'2024-01-15T11:54:48Z', type:'success', source:'CodeBERT',       message:'CodeBERT scan hoàn tất — 1 prediction ≥ 0.70 (upload handler)' },
  { id:'E-M105-5', runId:'#M-105', taskId:'M105-T4', time:'2024-01-15T11:55:10Z', type:'success', source:'Checkmarx',     message:'Checkmarx scan hoàn tất — 0 HIGH, 1 MEDIUM finding' },
  { id:'E-M105-6', runId:'#M-105', taskId:'M105-T5', time:'2024-01-15T11:55:10Z', type:'info',    source:'Correlator',    message:'Correlate & Combine đang chạy: áp dụng combination policy AND' },
];

/* ─── Runs ────────────────────────────────────────────────────────────── */

export const RUNS: RunData[] = [
  {
    id: '#M-101', projectId: 'flask-lab-a', project: 'Flask Lab A',
    repo: 'org/flask-lab-a', branch: 'main', commit: 'a3f2c1d',
    commitMsg: 'feat: add login endpoint',
    ciStatus: 'completed', securityGate: 'passed', findings: 1, confirmedVulns: 0,
    duration: '4m 12s', triggeredBy: 'push', triggeredUser: 'dev-01', queueTime: '8s',
    startedAt: '2024-01-15T08:12:00Z', completedAt: '2024-01-15T08:16:12Z',
    failureReason: null, tasks: TASKS_M101, events: EVENTS_M101, findingIds: ['F-001'],
    securityGateDetail: {
      status: 'passed', policy: 'AND — cả hai nguồn đều phát hiện',
      conditions: ['Findings HIGH < 3', 'Không có CRITICAL finding'],
      receivedSources: ['CodeBERT', 'Checkmarx'],
      missingSources: [],
      affectingFindings: ['F-001'],
      reason: 'Gate PASSED — 1 HIGH finding, dưới ngưỡng block (3). Không có CRITICAL.',
    },
  },
  {
    id: '#M-102', projectId: 'python-api-c', project: 'Python API C',
    repo: 'org/python-api-c', branch: 'feature/auth', commit: 'b8e4f2a',
    commitMsg: 'refactor: auth middleware',
    ciStatus: 'completed', securityGate: 'passed', findings: 1, confirmedVulns: 0,
    duration: '5m 38s', triggeredBy: 'pull_request', triggeredUser: 'dev-02', queueTime: '12s',
    startedAt: '2024-01-15T09:05:00Z', completedAt: '2024-01-15T09:10:38Z',
    failureReason: null, tasks: TASKS_M102, events: EVENTS_M102, findingIds: ['F-002'],
    securityGateDetail: {
      status: 'passed', policy: 'AND — cả hai nguồn đều phát hiện',
      conditions: ['Findings HIGH < 3', 'Không có CRITICAL finding'],
      receivedSources: ['CodeBERT', 'Checkmarx'],
      missingSources: [],
      affectingFindings: ['F-002'],
      reason: 'Gate PASSED — 1 MEDIUM finding, không vi phạm ngưỡng block.',
    },
  },
  {
    id: '#M-103', projectId: 'django-demo-b', project: 'Django Demo B',
    repo: 'org/django-demo-b', branch: 'main', commit: 'c9d1e3b',
    commitMsg: 'fix: SQL query optimization',
    ciStatus: 'failed', securityGate: 'partial_result', findings: 0, confirmedVulns: 0,
    duration: '2m 07s', triggeredBy: 'push', triggeredUser: 'dev-03', queueTime: '5s',
    startedAt: '2024-01-15T10:30:00Z', completedAt: '2024-01-15T10:32:07Z',
    failureReason: 'Checkmarx partial scan — scanner returned exit code 2. Incomplete results.',
    tasks: TASKS_M103, events: EVENTS_M103, findingIds: [],
    securityGateDetail: {
      status: 'partial_result', policy: 'AND — cả hai nguồn đều phát hiện',
      conditions: ['Findings HIGH < 3', 'Không có CRITICAL finding'],
      receivedSources: ['CodeBERT'],
      missingSources: ['Checkmarx (partial scan failure)'],
      affectingFindings: [],
      reason: 'Gate không thể đánh giá — Checkmarx scan thất bại (exit code 2). Kết quả không đầy đủ.',
    },
  },
  {
    id: '#M-104', projectId: 'django-demo-b', project: 'Django Demo B',
    repo: 'org/django-demo-b', branch: 'feature/api-v2', commit: 'd4a7f9c',
    commitMsg: 'feat: REST API v2 endpoints',
    ciStatus: 'running', securityGate: 'pending', findings: 0, confirmedVulns: 0,
    duration: '—', triggeredBy: 'pull_request', triggeredUser: 'dev-03', queueTime: '3s',
    startedAt: '2024-01-15T11:45:00Z', completedAt: null,
    failureReason: null, tasks: TASKS_M104, events: EVENTS_M104, findingIds: [],
    securityGateDetail: {
      status: 'pending', policy: 'AND — chưa cấu hình chính thức',
      conditions: [],
      receivedSources: [],
      missingSources: ['CodeBERT (đang chạy)', 'Checkmarx (đang chạy)'],
      affectingFindings: [],
      reason: 'Chờ scanner hoàn tất. Security Gate chưa có dữ liệu để đánh giá.',
    },
  },
  {
    id: '#M-105', projectId: 'flask-lab-a', project: 'Flask Lab A',
    repo: 'org/flask-lab-a', branch: 'feature/upload', commit: 'e2b5c8d',
    commitMsg: 'feat: file upload handler',
    ciStatus: 'running', securityGate: 'pending', findings: 0, confirmedVulns: 0,
    duration: '—', triggeredBy: 'push', triggeredUser: 'dev-01', queueTime: '6s',
    startedAt: '2024-01-15T11:52:00Z', completedAt: null,
    failureReason: null, tasks: TASKS_M105, events: EVENTS_M105, findingIds: [],
    securityGateDetail: {
      status: 'pending', policy: 'AND — cả hai nguồn đều phát hiện',
      conditions: ['Findings HIGH < 3', 'Không có CRITICAL finding'],
      receivedSources: ['CodeBERT', 'Checkmarx'],
      missingSources: ['Combine result (đang xử lý)'],
      affectingFindings: [],
      reason: 'Chờ Correlate & Combine. Cả hai scanner đã xong — kết quả sẽ được tổng hợp.',
    },
  },
];

/* Historical runs (lightweight — for time filter) */
export interface HistoricalRun {
  id: string; projectId: string; project: string;
  ciStatus: RunStatus; findings: number; startedAt: string;
}
export const HISTORICAL_RUNS: HistoricalRun[] = [
  { id:'#H-091', projectId:'flask-lab-a',  project:'Flask Lab A',  ciStatus:'completed', findings:0, startedAt:'2024-01-12T14:30:00Z' },
  { id:'#H-092', projectId:'python-api-c', project:'Python API C', ciStatus:'completed', findings:0, startedAt:'2024-01-12T09:15:00Z' },
  { id:'#H-093', projectId:'django-demo-b',project:'Django Demo B',ciStatus:'completed', findings:0, startedAt:'2024-01-05T11:20:00Z' },
  { id:'#H-094', projectId:'flask-lab-a',  project:'Flask Lab A',  ciStatus:'failed',    findings:0, startedAt:'2024-01-05T16:45:00Z' },
];

/* ─── Projects ────────────────────────────────────────────────────────── */

export const PROJECTS: ProjectData[] = [
  {
    id: 'flask-lab-a', name: 'Flask Lab A',
    description: 'Ứng dụng web bảo mật với Flask, kiểm thử các pattern vulnerability phổ biến trong Python web. Dùng để thực nghiệm tích hợp CodeBERT + Checkmarx.',
    repository: 'org/flask-lab-a', defaultBranch: 'main',
    technology: 'Python 3.11', framework: 'Flask 3.0',
    environment: 'Development', owner: 'dev-01',
    status: 'active', health: 'warning',
    activeRunId: '#M-105',
    currentPhase: 'P4', completedPhases: 4, totalPhases: 11,
    openFindings: 1, confirmedVulnerabilities: 0,
    securityGate: 'pending', lastActivity: '2024-01-15T11:52:00Z',
    scanners: ['CodeBERT', 'Checkmarx SAST'],
    runIds: ['#M-101', '#M-105', '#H-091', '#H-094'],
  },
  {
    id: 'django-demo-b', name: 'Django Demo B',
    description: 'Demo application Django với REST API và authentication layer. Đang gặp sự cố Checkmarx partial scan, Security Gate chưa được cấu hình.',
    repository: 'org/django-demo-b', defaultBranch: 'main',
    technology: 'Python 3.11', framework: 'Django 5.0',
    environment: 'Development', owner: 'dev-03',
    status: 'degraded', health: 'error',
    activeRunId: '#M-104',
    currentPhase: 'P4', completedPhases: 4, totalPhases: 11,
    openFindings: 0, confirmedVulnerabilities: 0,
    securityGate: 'not_configured', lastActivity: '2024-01-15T11:45:00Z',
    scanners: ['CodeBERT', 'Checkmarx SAST'],
    runIds: ['#M-103', '#M-104', '#H-093'],
  },
  {
    id: 'python-api-c', name: 'Python API C',
    description: 'RESTful API service với FastAPI và JWT authentication. Security Gate đã được áp dụng thành công trên run #M-102.',
    repository: 'org/python-api-c', defaultBranch: 'main',
    technology: 'Python 3.11', framework: 'FastAPI 0.109',
    environment: 'Development', owner: 'dev-02',
    status: 'active', health: 'warning',
    activeRunId: null,
    currentPhase: 'P3', completedPhases: 3, totalPhases: 11,
    openFindings: 1, confirmedVulnerabilities: 0,
    securityGate: 'passed', lastActivity: '2024-01-15T09:10:38Z',
    scanners: ['CodeBERT', 'Checkmarx SAST'],
    runIds: ['#M-102', '#H-092'],
  },
];

/* ─── Findings ────────────────────────────────────────────────────────── */

export const FINDINGS: FindingData[] = [
  {
    id: 'F-001', runId: '#M-101', projectId: 'flask-lab-a', project: 'Flask Lab A',
    repo: 'org/flask-lab-a', commit: 'a3f2c1d',
    file: 'app/views/auth.py', line: 47, function: 'login_user()',
    cwe: 'CWE-89', cweName: 'SQL Injection', severity: 'HIGH',
    sourceDetection: 'Combined (CodeBERT + Checkmarx)',
    codebertConfidence: 0.91, codebertLabel: 'VULNERABLE',
    checkmarxSeverity: 'HIGH', combinationPolicy: 'AND — cả hai nguồn phát hiện',
    codeSnippet: `def login_user(username, password):
    query = "SELECT * FROM users WHERE username='" + username + "'"
    result = db.execute(query)  # Line 47
    return result.fetchone()`,
    evidence: 'Checkmarx: SQL query xây dựng bằng string concatenation không có parameterization. CodeBERT: confidence 0.91 trên tập validation nội bộ.',
    remediation: 'Thay thế string concatenation bằng parameterized query: db.execute("SELECT * FROM users WHERE username=?", (username,))',
    validationTest: 'test_login_sql_injection trong test/test_auth.py',
    verificationStatus: 'pending',
    statusHistory: [{ status: 'detected', timestamp: '2024-01-15T08:16:12Z', actor: 'system' }],
    timestamp: '2024-01-15T08:16:12Z',
    taskId: 'M101-T5', eventId: 'E-M101-6',
  },
  {
    id: 'F-002', runId: '#M-102', projectId: 'python-api-c', project: 'Python API C',
    repo: 'org/python-api-c', commit: 'b8e4f2a',
    file: 'api/middleware/auth.py', line: 23, function: 'verify_token()',
    cwe: 'CWE-798', cweName: 'Hardcoded Credentials', severity: 'MEDIUM',
    sourceDetection: 'Combined (CodeBERT + Checkmarx)',
    codebertConfidence: 0.84, codebertLabel: 'VULNERABLE',
    checkmarxSeverity: 'MEDIUM', combinationPolicy: 'AND — cả hai nguồn phát hiện',
    codeSnippet: `def verify_token(token):
    SECRET = "hardcoded_secret_key_do_not_use"  # Line 23
    return jwt.decode(token, SECRET, algorithms=["HS256"])`,
    evidence: 'Checkmarx: hardcoded secret string. CodeBERT: confidence 0.84.',
    remediation: 'SECRET = os.environ.get("JWT_SECRET") — đọc từ biến môi trường.',
    validationTest: 'test_token_secret trong test/test_auth.py',
    verificationStatus: 'pending',
    statusHistory: [{ status: 'detected', timestamp: '2024-01-15T09:10:38Z', actor: 'system' }],
    timestamp: '2024-01-15T09:10:38Z',
    taskId: 'M102-T5', eventId: 'E-M102-6',
  },
];

/* ─── Incidents ──────────────────────────────────────────────────────── */

export const INCIDENTS: IncidentData[] = [
  {
    id: 'INC-001', type: 'partial_result', impact: 'HIGH',
    project: 'Django Demo B', projectId: 'django-demo-b', runId: '#M-103',
    stage: 'Checkmarx Scan', error: 'Scanner exit code 2 — partial results',
    cause: 'Scanner có thể đã timeout hoặc mất kết nối với CxSAST server. Kết quả không đầy đủ — pipeline bị dừng.',
    timestamp: '2024-01-15T10:32:07Z', handlingStatus: 'open',
    suggestedAction: 'Kiểm tra kết nối tới CxSAST server. Retry run #M-103 hoặc trigger run mới.',
  },
  {
    id: 'INC-002', type: 'pipeline_error', impact: 'MEDIUM',
    project: 'Django Demo B', projectId: 'django-demo-b', runId: '#M-104',
    stage: 'Security Gate', error: 'Security Gate chưa được cấu hình',
    cause: 'Policy chưa thiết lập cho dự án Django Demo B. Pipeline sẽ không block dù phát hiện vulnerability.',
    timestamp: '2024-01-15T11:45:00Z', handlingStatus: 'open',
    suggestedAction: 'Cấu hình Security Gate policy cho Django Demo B trước khi merge vào main.',
  },
];

/* ─── CodeBERT-only predictions (not findings) ────────────────────────── */

export const CODEBERT_PREDICTIONS_ONLY = [
  {
    id: 'P-001', runId: '#M-101', project: 'Flask Lab A',
    file: 'app/utils/helpers.py', line: 89, function: 'parse_input()',
    confidence: 0.62, label: 'VULNERABLE',
    note: 'Dưới ngưỡng kết hợp (0.70). Checkmarx không xác nhận. Không tính là security finding.',
  },
];

/* ─── Project phases ─────────────────────────────────────────────────── */

export const PROJECT_PHASES = [
  { id:'P0',  name:'Khởi tạo dự án',       status:'completed' as const },
  { id:'P1',  name:'Thu thập dataset',      status:'completed' as const },
  { id:'P2',  name:'Fine-tune CodeBERT',    status:'completed' as const },
  { id:'P3',  name:'Tích hợp GitHub Actions', status:'completed' as const },
  { id:'P4',  name:'Tích hợp Checkmarx',   status:'in_progress' as const },
  { id:'P5',  name:'Combination policy',    status:'pending' as const },
  { id:'P6',  name:'Security Gate',         status:'pending' as const },
  { id:'P7',  name:'Held-out evaluation',   status:'pending' as const },
  { id:'P8',  name:'Dashboard hoàn thiện',  status:'pending' as const },
  { id:'P9',  name:'Review & Docs',         status:'pending' as const },
  { id:'P10', name:'Báo cáo tốt nghiệp',    status:'pending' as const },
];

/* ─── Charts ─────────────────────────────────────────────────────────── */

export const CHART_RUNS_24H = [
  { hour:'08:00', completed:1, running:0, failed:0 },
  { hour:'09:00', completed:1, running:0, failed:0 },
  { hour:'10:00', completed:0, running:0, failed:1 },
  { hour:'11:00', completed:0, running:2, failed:0 },
  { hour:'12:00', completed:0, running:0, failed:0 },
];

export const CHART_RUNS_7D = [
  { day:'10/01', completed:2, running:0, failed:0 },
  { day:'11/01', completed:0, running:0, failed:0 },
  { day:'12/01', completed:0, running:0, failed:0 },
  { day:'13/01', completed:0, running:0, failed:0 },
  { day:'14/01', completed:0, running:0, failed:0 },
  { day:'15/01', completed:2, running:2, failed:1 },
];

export const CHART_FINDINGS_TREND = [
  { date:'10/01', findings:0 },
  { date:'11/01', findings:0 },
  { date:'12/01', findings:0 },
  { date:'13/01', findings:0 },
  { date:'14/01', findings:0 },
  { date:'15/01', findings:2 },
];

export const HEALTH_SOURCES = [
  { name:'GitHub Actions', status:'operational'  as const, lastData:'2024-01-15T11:55:00Z', latency:'120ms', error:null },
  { name:'CodeBERT',       status:'operational'  as const, lastData:'2024-01-15T11:52:00Z', latency:'340ms', error:null },
  { name:'Checkmarx',      status:'degraded'     as const, lastData:'2024-01-15T10:32:07Z', latency:'—',     error:'Partial scan (#M-103). Exit code 2.' },
  { name:'VPS/API',        status:'operational'  as const, lastData:'2024-01-15T11:55:00Z', latency:'45ms',  error:null },
  { name:'Dashboard data', status:'operational'  as const, lastData:'2024-01-15T11:55:00Z', latency:'22ms',  error:null },
];

/* ─── Computed helpers ──────────────────────────────────────────────────── */

export type TimeRange = '24h' | '7d' | '30d';

const NOW = new Date('2024-01-15T12:00:00Z').getTime();
const DAY = 86_400_000;

export function filterRunsByRange(range: TimeRange): (RunData | HistoricalRun)[] {
  const cutoff = range === '24h' ? NOW - DAY : range === '7d' ? NOW - 7 * DAY : NOW - 30 * DAY;
  const main = RUNS.filter(r => new Date(r.startedAt).getTime() >= cutoff);
  const hist = HISTORICAL_RUNS.filter(r => new Date(r.startedAt).getTime() >= cutoff);
  return [...main, ...hist];
}

export function computeKPIs(range: TimeRange) {
  const runs = filterRunsByRange(range);
  const mainRuns = runs.filter(r => 'tasks' in r) as RunData[];
  const allRuns  = runs;
  const activeProjects = new Set(allRuns.map(r => r.projectId)).size;
  const totalRuns  = allRuns.length;
  const running    = mainRuns.filter(r => r.ciStatus === 'running').length;
  const completed  = allRuns.filter(r => r.ciStatus === 'completed').length;
  const failed     = allRuns.filter(r => r.ciStatus === 'failed').length;
  const findings   = mainRuns.reduce((s, r) => s + r.findings, 0);
  const confirmed  = mainRuns.reduce((s, r) => s + r.confirmedVulns, 0);
  return { activeProjects, totalRuns, running, completed, failed, findings, confirmed };
}

export function getRunById(id: string): RunData | undefined {
  return RUNS.find(r => r.id === id);
}

export function getProjectById(id: string): ProjectData | undefined {
  return PROJECTS.find(p => p.id === id);
}

export function getRunsForProject(projectId: string): RunData[] {
  return RUNS.filter(r => r.projectId === projectId);
}

export function getProjectRunMetrics(projectId: string, range: TimeRange) {
  const cutoff = range === '24h' ? NOW - DAY : range === '7d' ? NOW - 7*DAY : NOW - 30*DAY;
  const runs = RUNS.filter(r => r.projectId === projectId && new Date(r.startedAt).getTime() >= cutoff);
  const total     = runs.length;
  const completed = runs.filter(r => r.ciStatus === 'completed').length;
  const failed    = runs.filter(r => r.ciStatus === 'failed').length;
  const running   = runs.filter(r => r.ciStatus === 'running').length;
  const succRate  = total ? Math.round((completed / total) * 100) : 0;
  const lastFailed = runs.filter(r => r.ciStatus === 'failed').sort((a,b) => b.startedAt.localeCompare(a.startedAt))[0];
  return { total, completed, failed, running, succRate, lastFailed };
}
