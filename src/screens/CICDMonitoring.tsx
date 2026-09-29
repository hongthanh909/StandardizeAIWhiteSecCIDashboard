import { useState, useEffect } from 'react';
import {
  PROJECTS, RUNS, FINDINGS, PROJECT_PHASES, INCIDENTS,
  pipelineProgress, getProjectById, formatTimestamp, timeAgo,
  type RunData, type TaskData, type ProjectData,
} from '../data/mockData';
import { useApp } from '../context/AppContext';

/* ── Helpers ────────────────────────────────────────────────────────── */
const CI_C: Record<string,string> = { completed:'#22c55e', running:'#4a7ef0', failed:'#ef4444', cancelled:'#475569', waiting:'#f59e0b', passed:'#22c55e', pending:'#f59e0b', not_configured:'#475569', partial_result:'#f97316' };
const CI_L: Record<string,string> = { completed:'Hoàn tất', running:'Đang chạy', failed:'Thất bại', cancelled:'Đã hủy', waiting:'Chờ', passed:'Đạt', pending:'Chờ kết quả', not_configured:'Chưa cấu hình', partial_result:'Kết quả một phần' };

function Pill({ s, label }: { s:string; label?:string }) {
  const c = CI_C[s] ?? '#475569';
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 7px', borderRadius:4, background:`${c}18`, color:c, border:`1px solid ${c}30`, fontSize:10, fontWeight:600 }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:c }}/>
      {label ?? CI_L[s] ?? s}
    </span>
  );
}
function Card({ children, style }: { children:React.ReactNode; style?:React.CSSProperties }) {
  return <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:10, ...style }}>{children}</div>;
}
function SH({ icon, title, badge, badgeColor }: { icon:string; title:string; badge?:string; badgeColor?:string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a7ef0" strokeWidth="1.8">
        <path d={icon} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)' }}>{title}</span>
      {badge && <span style={{ padding:'1px 7px', borderRadius:4, fontSize:10, background:`${badgeColor||'#4a7ef0'}18`, color:badgeColor||'#7aa8f8', border:`1px solid ${badgeColor||'#4a7ef0'}28`, fontFamily:'var(--font-mono)' }}>{badge}</span>}
      <div style={{ flex:1, height:1, background:'var(--border)' }}/>
    </div>
  );
}
function FSel({ label, value, onChange, opts }: { label:string; value:string; onChange:(v:string)=>void; opts:{v:string;l:string}[] }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      <span style={{ fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap' }}>{label}:</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ padding:'4px 24px 4px 8px', borderRadius:5, background:'var(--bg-surface-2)', color:'var(--text-secondary)', border:'1px solid var(--border)', fontSize:11, cursor:'pointer', outline:'none' }}>
        {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
export default function CICDMonitoring() {
  const { selectedRunId, setSelectedRunId, selectedRun, activeProject } = useApp();

  const [filterProject, setFilterProject] = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [selTask, setSelTask] = useState<string>('');

  /* Derive data from selected run */
  const run: RunData | undefined = selectedRun;
  const project: ProjectData | undefined = activeProject;
  const prog = run ? pipelineProgress(run.tasks) : null;

  /* Auto-select first task */
  useEffect(() => {
    if (run && run.tasks.length > 0) {
      const running = run.tasks.find(t => t.status === 'running');
      const last = run.tasks.filter(t => t.status === 'completed').slice(-1)[0];
      setSelTask(running?.id ?? last?.id ?? run.tasks[0].id);
    }
  }, [run?.id]);

  /* Filtered run list */
  const filteredRuns = RUNS.filter(r => {
    if (filterProject && r.projectId !== filterProject) return false;
    if (filterStatus  && r.ciStatus  !== filterStatus)  return false;
    return true;
  });

  const taskData = run?.tasks.find(t => t.id === selTask);
  const runFindings = FINDINGS.filter(f => f.runId === run?.id);

  /* Elapsed time for running run */
  function elapsed(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const m = Math.floor(ms / 60000); const s = Math.floor((ms % 60000) / 1000);
    return `${m}m ${s}s`;
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Title + traceability breadcrumb */}
      <div>
        <h2 style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>Giám sát CI/CD & Security Gate</h2>
        {/* Traceability strip */}
        <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:4, marginTop:6, fontSize:11 }}>
          {[
            { l:'Dự án', v: project?.name ?? '—' },
            { l:'Run',   v: run?.id ?? '—' },
            { l:'Stage', v: taskData ? `Stage ${taskData.stage}` : '—' },
            { l:'Task',  v: taskData?.displayName ?? '—' },
            { l:'Event', v: run?.events.find(e => e.taskId === selTask)?.source ?? '—' },
            { l:'Finding', v: runFindings.length ? runFindings[0].id : '—' },
          ].map((item, i) => (
            <span key={item.l} style={{ display:'flex', alignItems:'center', gap:4 }}>
              {i > 0 && <span style={{ color:'var(--text-dim)' }}>›</span>}
              <span style={{ color:'var(--text-dim)' }}>{item.l}:</span>
              <span style={{ color: i === 0 ? '#22c55e' : i === 1 ? '#7aa8f8' : 'var(--text-secondary)', fontFamily:'var(--font-mono)', fontSize:10 }}>{item.v}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Bộ lọc ───────────────────────────────────────────────── */}
      <Card style={{ padding:'10px 14px' }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:12, alignItems:'center' }}>
          <FSel label="Dự án" value={filterProject} onChange={setFilterProject}
            opts={[{v:'',l:'Tất cả'}, ...PROJECTS.map(p => ({v:p.id, l:p.name}))]}/>
          <FSel label="Trạng thái" value={filterStatus} onChange={setFilterStatus}
            opts={[{v:'',l:'Tất cả'},{v:'running',l:'Đang chạy'},{v:'completed',l:'Hoàn tất'},{v:'failed',l:'Thất bại'}]}/>
          {(filterProject || filterStatus) && (
            <button onClick={() => { setFilterProject(''); setFilterStatus(''); }}
              style={{ padding:'4px 10px', borderRadius:5, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontSize:11, cursor:'pointer' }}>
              Xóa bộ lọc
            </button>
          )}
          <span style={{ fontSize:11, color:'var(--text-dim)' }}>{filteredRuns.length} run</span>
        </div>
      </Card>

      {/* ── Hai vùng chính ───────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:14 }}>

        {/* Run list */}
        <div style={{ display:'flex', flexDirection:'column' }}>
          <p style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.08em', marginBottom:8 }}>CHỌN RUN</p>
          <div style={{ display:'flex', flexDirection:'column', gap:6, overflowY:'auto', maxHeight:'calc(100vh - 300px)' }}>
            {filteredRuns.length === 0 ? (
              <div style={{ padding:'24px', textAlign:'center', fontSize:12, color:'var(--text-dim)', background:'var(--bg-surface)', borderRadius:10, border:'1px solid var(--border)' }}>
                Không có run phù hợp
              </div>
            ) : filteredRuns.map(r => {
              const rp = pipelineProgress(r.tasks);
              const isActive = r.id === selectedRunId;
              return (
                <button key={r.id}
                  onClick={() => { setSelectedRunId(r.id); setSelTask(''); }}
                  style={{ display:'block', width:'100%', textAlign:'left', padding:'12px 13px', borderRadius:9, cursor:'pointer', background: isActive ? 'rgba(74,126,240,0.1)' : 'var(--bg-surface)', border:`1px solid ${isActive ? 'rgba(74,126,240,0.35)' : 'var(--border)'}` }}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:'#7aa8f8' }}>{r.id}</span>
                    <Pill s={r.ciStatus}/>
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:3 }}>{r.project}</div>
                  <div style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-dim)', marginBottom:6 }}>{r.branch} · {r.commit}</div>
                  <div style={{ height:3, borderRadius:3, background:'var(--bg-surface-3)', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${rp.pct}%`, background: r.ciStatus==='failed' ? '#ef4444' : r.ciStatus==='completed' ? '#22c55e' : '#4a7ef0', borderRadius:3 }}/>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:10 }}>
                    <span style={{ color:'var(--text-dim)' }}>{rp.done}/{rp.total} tasks</span>
                    <span style={{ fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>{rp.pct}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        {!run ? (
          <EmptyState title="Chọn run để xem chi tiết" reason="Chọn một run từ danh sách bên trái."/>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* Project info card */}
            <Card style={{ padding:'14px 16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8, flexWrap:'wrap' }}>
                    <span style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{run.project}</span>
                    <Pill s={run.ciStatus}/>
                    <Pill s={run.securityGate}/>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'#7aa8f8' }}>{run.id}</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:10 }}>
                    {[
                      ['Repository', run.repo],
                      ['Branch', run.branch],
                      ['Commit', run.commit],
                      ['Kích hoạt', `${run.triggeredBy}`],
                      ['Người dùng', run.triggeredUser],
                      ['Môi trường', project?.environment ?? '—'],
                      ['Bắt đầu', formatTimestamp(run.startedAt)],
                      ['Thời gian chạy', run.completedAt ? run.duration : elapsed(run.startedAt)],
                      ['Queue time', run.queueTime],
                    ].map(([k,v]) => (
                      <div key={k}>
                        <div style={{ fontSize:10, color:'var(--text-dim)' }}>{k}</div>
                        <div style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-secondary)', marginTop:1 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {/* Progress */}
                  {prog && (
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-dim)', marginBottom:4 }}>
                        <span>Tiến độ: {prog.done}/{prog.total} tasks hoàn tất{prog.running ? ` · đang: ${prog.running}` : ''}{prog.blocking ? ` · chặn: ${prog.blocking}` : ''}{prog.next && !prog.running ? ` · tiếp: ${prog.next}` : ''}</span>
                        <span style={{ fontFamily:'var(--font-mono)', fontWeight:600, color:'var(--text-secondary)' }}>{prog.pct}%</span>
                      </div>
                      <div style={{ height:5, borderRadius:4, background:'var(--bg-surface-3)', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${prog.pct}%`, background: run.ciStatus==='failed' ? '#ef4444' : run.ciStatus==='completed' ? '#22c55e' : '#4a7ef0', borderRadius:4, transition:'width 0.3s' }}/>
                      </div>
                    </div>
                  )}
                  {run.failureReason && (
                    <div style={{ marginTop:8, padding:'7px 10px', borderRadius:7, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', fontSize:11, color:'#fca5a5' }}>
                      Nguyên nhân thất bại: {run.failureReason}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Pipeline diagram */}
            <section>
              <SH icon="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v10m0 0h10"
                  title={`Sơ đồ pipeline — ${run.id}`} />
              <div style={{ display:'flex', alignItems:'flex-start', gap:6, overflowX:'auto', paddingBottom:4 }}>
                {/* Group parallel tasks */}
                {renderPipelineNodes(run, selTask, setSelTask)}
              </div>
            </section>

            {/* Task detail + Events side by side */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <TaskDetailPanel task={taskData}/>
              <EventPanel run={run} selTask={selTask}/>
            </div>

            {/* Security Gate */}
            <SecurityGatePanel run={run}/>

            {/* Findings */}
            <section>
              <SH icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.071 16.5c-.77.833.192 2.5 1.732 2.5z"
                  title={`Findings — ${run.id}`} badge={`${runFindings.length}`} badgeColor={runFindings.length ? '#f59e0b' : undefined}/>
              {runFindings.length === 0 ? (
                <div style={{ padding:'16px', background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:10, textAlign:'center', fontSize:12, color:'var(--text-dim)' }}>
                  {run.ciStatus === 'running' ? 'Run đang chạy — findings sẽ xuất hiện sau khi hoàn tất' : 'Không có security finding'}
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {runFindings.map(f => {
                    const sc: Record<string,string> = { CRITICAL:'#dc2626', HIGH:'#ef4444', MEDIUM:'#f59e0b', LOW:'#4a7ef0', INFO:'#475569' };
                    const fc = sc[f.severity] ?? '#475569';
                    return (
                      <Card key={f.id} style={{ padding:'12px 14px' }}>
                        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:5, flexWrap:'wrap' }}>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700, color:'#7aa8f8' }}>{f.id}</span>
                          <span style={{ padding:'2px 7px', borderRadius:4, fontSize:10, fontWeight:700, background:`${fc}18`, color:fc, border:`1px solid ${fc}28` }}>{f.severity}</span>
                          <span style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{f.cweName}</span>
                          <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>{f.cwe}</span>
                          <span style={{ padding:'1px 6px', borderRadius:4, fontSize:10, background:'rgba(245,158,11,0.1)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.2)' }}>Chờ xác minh</span>
                        </div>
                        <div style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>{f.file}:{f.line} · {f.function}</div>
                        <div style={{ fontSize:11, color:'var(--text-secondary)', marginTop:5 }}>
                          CodeBERT confidence: <strong style={{ fontFamily:'var(--font-mono)' }}>{Math.round(f.codebertConfidence*100)}%</strong> ·
                          Checkmarx: <strong>{f.checkmarxSeverity}</strong> ·
                          Policy: {f.combinationPolicy}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Incidents related to this project */}
            {INCIDENTS.filter(i => i.projectId === run.projectId).length > 0 && (
              <section>
                <SH icon="M12 9v2m0 4h.01" title="Sự cố liên quan" badgeColor="#ef4444"
                    badge={String(INCIDENTS.filter(i => i.projectId === run.projectId).length)}/>
                {INCIDENTS.filter(i => i.projectId === run.projectId).map(inc => {
                  const ic = { HIGH:'#ef4444', MEDIUM:'#f59e0b', LOW:'#4a7ef0' }[inc.impact] ?? '#475569';
                  return (
                    <div key={inc.id} style={{ display:'flex', overflow:'hidden', background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:10, marginBottom:6 }}>
                      <div style={{ width:3, flexShrink:0, background:ic }}/>
                      <div style={{ flex:1, padding:'10px 14px' }}>
                        <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:3, flexWrap:'wrap' }}>
                          <span style={{ padding:'2px 7px', borderRadius:4, fontSize:10, fontWeight:700, background:`${ic}18`, color:ic }}>{inc.impact}</span>
                          <span style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{inc.error}</span>
                          <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>{inc.runId} · {inc.stage}</span>
                        </div>
                        <p style={{ fontSize:11, color:'var(--text-secondary)' }}>{inc.cause}</p>
                        <p style={{ fontSize:10, color:'var(--text-dim)', marginTop:3 }}>🔧 {inc.suggestedAction}</p>
                      </div>
                    </div>
                  );
                })}
              </section>
            )}

            {/* Project phases */}
            <section>
              <SH icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  title="Tiến độ đề tài" badge="P0–P10" />
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:7 }}>
                {PROJECT_PHASES.map(p => {
                  const c = p.status==='completed' ? '#22c55e' : p.status==='in_progress' ? '#4a7ef0' : 'var(--border)';
                  return (
                    <div key={p.id} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 10px', borderRadius:8, background:'var(--bg-surface)', border:`1px solid ${p.status==='in_progress' ? 'rgba(74,126,240,0.3)' : 'var(--border)'}` }}>
                      <span style={{ width:20, height:20, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, background:`${c}18`, color:c, flexShrink:0 }}>{p.id}</span>
                      <span style={{ fontSize:10, color: p.status==='pending' ? 'var(--text-dim)' : 'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-dim)', marginBottom:4 }}>
                  <span>4/11 phase hoàn tất · P4 đang thực hiện</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontWeight:600 }}>36%</span>
                </div>
                <div style={{ height:4, borderRadius:4, background:'var(--bg-surface-3)' }}>
                  <div style={{ height:'100%', width:'36%', background:'#22c55e', borderRadius:4 }}/>
                </div>
              </div>
            </section>

            {/* Audit trail */}
            <section>
              <SH icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" title="Audit trail" />
              <Card style={{ overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'var(--bg-surface-2)', borderBottom:'1px solid var(--border)' }}>
                      {['Run ID','Dự án','Kích hoạt','CI Status','Security Gate','Findings','Thời điểm'].map(h => (
                        <th key={h} style={{ padding:'8px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...RUNS].reverse().map((r, i) => (
                      <tr key={r.id} style={{ borderBottom: i < RUNS.length-1 ? '1px solid rgba(28,40,71,0.5)' : 'none', background: i%2===0 ? 'transparent' : 'rgba(16,22,48,0.4)', cursor:'pointer' }}
                        onClick={() => setSelectedRunId(r.id)}>
                        <td style={{ padding:'9px 14px' }}>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color: r.id===selectedRunId ? '#7aa8f8' : '#5a8acf' }}>{r.id}</span>
                        </td>
                        <td style={{ padding:'9px 14px', fontSize:12, color:'var(--text-secondary)' }}>{r.project}</td>
                        <td style={{ padding:'9px 14px', fontSize:11, color:'var(--text-muted)' }}>{r.triggeredBy} ({r.triggeredUser})</td>
                        <td style={{ padding:'9px 14px' }}><Pill s={r.ciStatus}/></td>
                        <td style={{ padding:'9px 14px' }}><Pill s={r.securityGate}/></td>
                        <td style={{ padding:'9px 14px', fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color: r.findings>0 ? '#f59e0b' : '#22c55e' }}>{r.findings}</td>
                        <td style={{ padding:'9px 14px', fontSize:11, color:'var(--text-dim)' }}>{timeAgo(r.startedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </section>

          </div>
        )}
      </div>
    </div>
  );
}

/* ── Pipeline nodes renderer ───────────────────────────────────────────── */
function renderPipelineNodes(run: RunData, selTask: string, setSelTask: (id:string)=>void) {
  const stages = new Map<number, TaskData[]>();
  run.tasks.forEach(t => {
    if (!stages.has(t.stage)) stages.set(t.stage, []);
    stages.get(t.stage)!.push(t);
  });

  const nodes: React.ReactNode[] = [];
  const stageNums = [...stages.keys()].sort((a,b) => a-b);

  stageNums.forEach((stage, si) => {
    const tasks = stages.get(stage)!;
    nodes.push(
      <div key={stage} style={{ display:'flex', flexDirection:'column', gap:5, flexShrink:0 }}>
        {tasks.map(task => {
          const tc = CI_C[task.status] ?? '#475569';
          const isActive = task.id === selTask;
          return (
            <button key={task.id} onClick={() => setSelTask(task.id)} style={{
              display:'flex', flexDirection:'column', alignItems:'center', padding:'11px 12px',
              borderRadius:9, border:`1px solid ${isActive ? 'rgba(74,126,240,0.4)' : 'var(--border)'}`,
              background: isActive ? 'rgba(74,126,240,0.1)' : 'var(--bg-surface)',
              cursor:'pointer', minWidth:108,
            }}>
              <div style={{ width:32, height:32, borderRadius:'50%', marginBottom:7, background:`${tc}18`, border:`2px solid ${tc}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {task.status==='completed' && (
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke={tc} strokeWidth="2.5">
                    <path d="M4 10l4.5 4.5 8-8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {task.status==='running' && <span className="pulse" style={{ width:8, height:8, borderRadius:'50%', background:tc }}/>}
                {task.status==='waiting' && <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--border)' }}/>}
                {task.status==='failed'  && <span style={{ fontSize:14, color:tc, lineHeight:1 }}>✕</span>}
                {task.status==='cancelled' && <span style={{ fontSize:12, color:tc, lineHeight:1 }}>—</span>}
              </div>
              <span style={{ fontSize:10, fontFamily:'var(--font-mono)', fontWeight:600, color:'var(--text-secondary)', textAlign:'center', lineHeight:1.3 }}>
                {task.displayName}
              </span>
              <span style={{ fontSize:9, fontFamily:'var(--font-mono)', color:tc, marginTop:3 }}>
                {task.status==='running' ? 'running…' : task.status==='waiting' ? 'waiting' : task.status==='cancelled' ? 'cancelled' : task.duration}
              </span>
              {task.parallel && (
                <span style={{ fontSize:8, color:'var(--text-dim)', marginTop:2 }}>parallel</span>
              )}
            </button>
          );
        })}
      </div>
    );
    if (si < stageNums.length-1) {
      nodes.push(
        <div key={`arrow-${stage}`} style={{ width:20, height:32, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, alignSelf:'center', marginTop: stages.get(stage)!.length > 1 ? 0 : 0 }}>
          <div style={{ width:16, height:1, background:'var(--border)' }}/>
        </div>
      );
    }
  });
  return nodes;
}

/* ── Task detail panel ────────────────────────────────────────────────── */
function TaskDetailPanel({ task }: { task: TaskData | undefined }) {
  return (
    <Card style={{ padding:'14px 16px' }}>
      <p style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.08em', marginBottom:10 }}>
        TASK DETAIL{task ? ` — ${task.id}` : ''}
      </p>
      {!task ? (
        <EmptyState title="Chọn task" reason="Nhấn vào task trong sơ đồ pipeline." />
      ) : (
        <>
          {[
            ['Task ID', task.id],
            ['Tên tác vụ', task.displayName],
            ['Stage', String(task.stage)],
            ['Trạng thái', CI_L[task.status] ?? task.status],
            ['Dependencies', task.dependencies.join(', ') || '—'],
            ['Bắt đầu', task.startedAt ? formatTimestamp(task.startedAt) : 'Chưa bắt đầu'],
            ['Kết thúc', task.completedAt ? formatTimestamp(task.completedAt) : '—'],
            ['Thời lượng', task.duration],
            ['Retry count', String(task.retryCount)],
            ['Exit code', task.exitCode !== null ? String(task.exitCode) : '—'],
          ].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid rgba(28,40,71,0.4)' }}>
              <span style={{ fontSize:10, color:'var(--text-dim)' }}>{k}</span>
              <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-secondary)' }}>{v}</span>
            </div>
          ))}
          {task.failureReason && (
            <div style={{ marginTop:8, padding:'7px 10px', borderRadius:7, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.18)', fontSize:11, color:'#fca5a5' }}>
              <strong>Lý do thất bại:</strong> {task.failureReason}
            </div>
          )}
          {task.waitingReason && (
            <div style={{ marginTop:8, padding:'7px 10px', borderRadius:7, background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.18)', fontSize:11, color:'#fbbf24' }}>
              {task.waitingReason}
            </div>
          )}
          <div style={{ marginTop:10, padding:'8px 10px', borderRadius:7, background:'var(--bg-input)', border:'1px solid var(--border)' }}>
            <p style={{ fontSize:9, color:'var(--text-dim)', marginBottom:4 }}>Log gần nhất:</p>
            <p style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-muted)', lineHeight:1.6 }}>{task.lastLog}</p>
          </div>
          {task.artifact && (
            <div style={{ marginTop:7, fontSize:10, color:'var(--text-dim)' }}>
              Artifact: <span style={{ fontFamily:'var(--font-mono)', color:'var(--text-secondary)' }}>{task.artifact}</span>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

/* ── Event panel ────────────────────────────────────────────────────── */
function EventPanel({ run, selTask }: { run: RunData; selTask: string }) {
  return (
    <Card style={{ padding:'14px 16px' }}>
      <p style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.08em', marginBottom:10 }}>PIPELINE EVENTS</p>
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {run.events.map(ev => {
          const isHl = ev.taskId === selTask;
          const ec = ev.type==='error' ? '#ef4444' : ev.type==='warning' ? '#f59e0b' : ev.type==='success' ? '#22c55e' : '#4a7ef0';
          return (
            <div key={ev.id} style={{
              display:'flex', gap:8, padding:'6px 8px', borderRadius:6,
              background: isHl ? 'rgba(74,126,240,0.08)' : 'transparent',
              border:`1px solid ${isHl ? 'rgba(74,126,240,0.2)' : 'transparent'}`,
            }}>
              <span style={{ width:5, height:5, borderRadius:'50%', flexShrink:0, marginTop:4, background:ec }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                  <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-dim)' }}>
                    {formatTimestamp(ev.time).split(',')[1]?.trim() || formatTimestamp(ev.time)}
                  </span>
                  <span style={{ fontSize:9, color:'var(--text-dim)' }}>{ev.source}</span>
                </div>
                <p style={{ fontSize:11, color:'var(--text-secondary)', lineHeight:1.5 }}>{ev.message}</p>
                {ev.findingId && (
                  <span style={{ fontSize:9, fontFamily:'var(--font-mono)', color:'#7aa8f8' }}>→ Finding {ev.findingId}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Security Gate panel ────────────────────────────────────────────── */
function SecurityGatePanel({ run }: { run: RunData }) {
  const sg = run.securityGateDetail;
  const c = CI_C[sg.status] ?? '#475569';
  return (
    <section>
      <SH icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          title="Security Gate" badge={CI_L[sg.status] ?? sg.status} badgeColor={c}/>
      <Card style={{ padding:'14px 16px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:'var(--text-dim)', marginBottom:6 }}>POLICY</p>
            <p style={{ fontSize:12, color:'var(--text-secondary)' }}>{sg.policy}</p>
            {sg.conditions.length > 0 && (
              <ul style={{ marginTop:6, paddingLeft:14 }}>
                {sg.conditions.map(c => <li key={c} style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:2 }}>{c}</li>)}
              </ul>
            )}
          </div>
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:'var(--text-dim)', marginBottom:6 }}>NGUỒN DỮ LIỆU</p>
            {sg.receivedSources.length > 0 && (
              <div style={{ marginBottom:5 }}>
                <span style={{ fontSize:10, color:'#22c55e' }}>Đã nhận: </span>
                {sg.receivedSources.map(s => <span key={s} style={{ fontSize:11, color:'var(--text-secondary)', marginRight:6 }}>{s}</span>)}
              </div>
            )}
            {sg.missingSources.length > 0 && (
              <div>
                <span style={{ fontSize:10, color:'#ef4444' }}>Còn thiếu: </span>
                {sg.missingSources.map(s => <span key={s} style={{ fontSize:11, color:'#fca5a5', marginRight:6 }}>{s}</span>)}
              </div>
            )}
          </div>
        </div>
        <div style={{ marginTop:10, padding:'8px 12px', borderRadius:8, background:`${c}10`, border:`1px solid ${c}25` }}>
          <p style={{ fontSize:11, color:'var(--text-secondary)' }}>{sg.reason}</p>
        </div>
        {sg.affectingFindings.length > 0 && (
          <div style={{ marginTop:8 }}>
            <span style={{ fontSize:10, color:'var(--text-dim)' }}>Findings ảnh hưởng quyết định: </span>
            {sg.affectingFindings.map(f => (
              <span key={f} style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'#f59e0b', marginRight:6 }}>{f}</span>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}

function EmptyState({ title, reason }: { title:string; reason:string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', textAlign:'center', color:'var(--text-dim)' }}>
      <p style={{ fontSize:12, fontWeight:600 }}>{title}</p>
      <p style={{ fontSize:11, marginTop:4 }}>{reason}</p>
    </div>
  );
}
