import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import {
  PROJECTS, RUNS, INCIDENTS, HEALTH_SOURCES, FINDINGS,
  CHART_RUNS_24H, CHART_RUNS_7D, CHART_FINDINGS_TREND,
  PROJECT_PHASES, pipelineProgress, getRunsForProject, getProjectRunMetrics,
  computeKPIs, formatTimestamp, timeAgo,
  type ProjectData, type TimeRange,
} from '../data/mockData';
import { useApp } from '../context/AppContext';

/* ── Helpers ──────────────────────────────────────────────────────────── */
const SEV_C: Record<string,string> = { CRITICAL:'#dc2626', HIGH:'#ef4444', MEDIUM:'#f59e0b', LOW:'#4a7ef0', INFO:'#6366f1' };
const CI_C:  Record<string,string> = { completed:'#22c55e', running:'#4a7ef0', failed:'#ef4444', cancelled:'#475569', pending:'#f59e0b', passed:'#22c55e', not_configured:'#475569', partial_result:'#f97316' };
const CI_L:  Record<string,string> = { completed:'Hoàn tất', running:'Đang chạy', failed:'Thất bại', cancelled:'Đã hủy', pending:'Chờ', passed:'Đạt', not_configured:'Chưa cấu hình', partial_result:'Kết quả một phần' };
const HEALTH_C = (s: string) => ({ healthy:'#22c55e', warning:'#f59e0b', error:'#ef4444' })[s] ?? '#475569';
const HEALTH_L = (s: string) => ({ healthy:'Tốt', warning:'Cảnh báo', error:'Lỗi' })[s] ?? s;

function Pill({ s, label }: { s:string; label?:string }) {
  const c = CI_C[s] ?? '#475569';
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 7px', borderRadius:4, background:`${c}18`, color:c, border:`1px solid ${c}30`, fontSize:10, fontWeight:600 }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:c }}/>
      {label ?? CI_L[s] ?? s}
    </span>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:10, ...style }}>{children}</div>;
}

function SH({ icon, title, badge, badgeColor, count }: { icon:string; title:string; badge?:string; badgeColor?:string; count?:string }) {
  const b = badge ?? count;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a7ef0" strokeWidth="1.8">
        <path d={icon} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)' }}>{title}</span>
      {b && (
        <span style={{ padding:'1px 7px', borderRadius:4, fontSize:10, background:`${badgeColor||'#4a7ef0'}18`, color:badgeColor||'#7aa8f8', border:`1px solid ${badgeColor||'#4a7ef0'}28`, fontFamily:'var(--font-mono)' }}>
          {b}
        </span>
      )}
      <div style={{ flex:1, height:1, background:'var(--border)' }}/>
    </div>
  );
}

function RangeToggle({ value, onChange }: { value:TimeRange; onChange:(r:TimeRange)=>void }) {
  return (
    <div style={{ display:'flex', gap:2, padding:'3px', borderRadius:8, background:'var(--bg-surface)', border:'1px solid var(--border)' }}>
      {(['24h','7d','30d'] as TimeRange[]).map(r => (
        <button key={r} onClick={() => onChange(r)} style={{
          padding:'5px 12px', borderRadius:6, border:'none', cursor:'pointer',
          background: value === r ? 'var(--bg-surface-3)' : 'transparent',
          color: value === r ? 'var(--text-primary)' : 'var(--text-muted)',
          fontSize:12, fontWeight: value === r ? 600 : 400,
          outline: value === r ? '1px solid var(--border)' : 'none',
        }}>
          {r}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
export default function Overview() {
  const { navigateTo, setSelectedRunId } = useApp();
  const [range, setRange] = useState<TimeRange>('24h');
  const [profileProject, setProfileProject] = useState<ProjectData | null>(null);

  const kpis = computeKPIs(range);

  const chartData: Record<string,number|string>[] = (range === '24h' ? CHART_RUNS_24H : CHART_RUNS_7D) as Record<string,number|string>[];
  const xKey = range === '24h' ? 'hour' : 'day';

  /* Filtered runs for table */
  const NOW_MS = new Date('2024-01-15T12:00:00Z').getTime();
  const DAY = 86_400_000;
  const cutoff = range === '24h' ? NOW_MS - DAY : range === '7d' ? NOW_MS - 7*DAY : 0;
  const filteredRuns = RUNS.filter(r => new Date(r.startedAt).getTime() >= cutoff);

  function goToMonitoring(runId?: string) {
    navigateTo('monitoring', runId);
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

      {/* Title + range */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>Tổng quan hệ thống</h2>
          <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>
            Trạng thái pipeline bảo mật — dữ liệu minh họa
          </p>
        </div>
        <RangeToggle value={range} onChange={setRange}/>
      </div>

      {/* ── KPI ──────────────────────────────────────────────────── */}
      <section>
        <SH icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            title="KPI" count={range as string} />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {[
            { v:String(kpis.activeProjects), l:'Dự án có hoạt động', ic:'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', c:undefined },
            { v:String(kpis.totalRuns),      l:'Tổng số runs',        ic:'M4 4v5h.582m15.356 2A8 8 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', c:undefined },
            { v:String(kpis.running),        l:'Đang chạy',           ic:'M13 10V3L4 14h7v7l9-11h-7z', c:'#4a7ef0' },
            { v:String(kpis.completed),      l:'Hoàn tất',            ic:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', c:'#22c55e' },
            { v:String(kpis.failed),         l:'Thất bại',            ic:'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', c:'#ef4444' },
            { v:String(kpis.findings),       l:'Security findings',   ic:'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.071 16.5c-.77.833.192 2.5 1.732 2.5z', c:'#f59e0b' },
            { v:String(kpis.confirmed),      l:'Lỗ hổng xác minh',   ic:'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', c:'#22c55e' },
            { v:'—', l:'Security Gate',      ic:'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', c:'#475569' },
          ].map((k, i) => (
            <Card key={i} style={{ padding:'14px 16px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={k.c ?? 'var(--text-muted)'} strokeWidth="1.8" style={{ marginBottom:10 }}>
                <path d={k.ic} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div style={{ fontSize:26, fontWeight:700, fontFamily:'var(--font-mono)', color:k.c ?? 'var(--text-primary)', lineHeight:1 }}>{k.v}</div>
              <div style={{ fontSize:11, color:'var(--text-secondary)', marginTop:5 }}>{k.l}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Danh mục dự án ──────────────────────────────────────── */}
      <section>
        <SH icon="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            title="Danh mục dự án" badge={`${PROJECTS.length} dự án`} />
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {PROJECTS.map(proj => {
            const activeRun = proj.activeRunId ? RUNS.find(r => r.id === proj.activeRunId) : undefined;
            const prog = activeRun ? pipelineProgress(activeRun.tasks) : null;
            const metrics = getProjectRunMetrics(proj.id, range);
            const hc = HEALTH_C(proj.health);
            return (
              <Card key={proj.id} style={{ padding:0, overflow:'hidden' }}>
                {/* Left accent */}
                <div style={{ display:'flex' }}>
                  <div style={{ width:3, flexShrink:0, background:hc, borderRadius:'10px 0 0 10px' }}/>
                  <div style={{ flex:1, padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>

                      {/* Left info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                          <span style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{proj.name}</span>
                          <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-dim)' }}>{proj.repository}</span>
                          <span style={{ padding:'1px 6px', borderRadius:4, fontSize:10, background:`${hc}18`, color:hc, border:`1px solid ${hc}28` }}>
                            {HEALTH_L(proj.health)}
                          </span>
                          {proj.status === 'degraded' && (
                            <span style={{ padding:'1px 6px', borderRadius:4, fontSize:10, background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)' }}>
                              Degraded
                            </span>
                          )}
                        </div>

                        <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:10 }}>
                          <Meta l="Framework" v={`${proj.framework}`}/>
                          <Meta l="Owner" v={proj.owner}/>
                          <Meta l="Môi trường" v={proj.environment}/>
                          <Meta l="Scanner" v={proj.scanners.join(', ')}/>
                          <Meta l="Hoạt động" v={timeAgo(proj.lastActivity)}/>
                        </div>

                        {/* Pipeline progress */}
                        {prog && activeRun ? (
                          <div style={{ marginBottom:8 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-dim)', marginBottom:4 }}>
                              <span>Run {activeRun.id} · {prog.done}/{prog.total} tasks · {prog.running ? `đang: ${prog.running}` : prog.blocking ? `chặn: ${prog.blocking}` : 'chờ'}</span>
                              <span style={{ fontFamily:'var(--font-mono)', fontWeight:600, color:'var(--text-secondary)' }}>{prog.pct}%</span>
                            </div>
                            <div style={{ height:4, borderRadius:4, background:'var(--bg-surface-3)', overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${prog.pct}%`, background: activeRun.ciStatus === 'failed' ? '#ef4444' : '#4a7ef0', borderRadius:4, transition:'width 0.3s ease' }}/>
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize:11, color:'var(--text-dim)', marginBottom:8 }}>Không có run đang hoạt động</div>
                        )}

                        {/* Stats row */}
                        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                          <StatChip l="Runs" v={String(metrics.total)} c="var(--text-secondary)"/>
                          <StatChip l="Thành công" v={`${metrics.succRate}%`} c={metrics.succRate > 70 ? '#22c55e' : '#f59e0b'}/>
                          <StatChip l="Findings" v={String(proj.openFindings)} c={proj.openFindings > 0 ? '#f59e0b' : '#22c55e'}/>
                          <StatChip l="Xác minh" v={String(proj.confirmedVulnerabilities)} c="var(--text-secondary)"/>
                          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                            <span style={{ fontSize:10, color:'var(--text-dim)' }}>Security Gate:</span>
                            <Pill s={proj.securityGate}/>
                          </div>
                          {/* Phase progress */}
                          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                            <span style={{ fontSize:10, color:'var(--text-dim)' }}>Đề tài:</span>
                            <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-secondary)' }}>
                              {proj.completedPhases}/{proj.totalPhases} phase ({Math.round(proj.completedPhases/proj.totalPhases*100)}%) · {proj.currentPhase} đang thực hiện
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right actions */}
                      <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                        <button
                          onClick={() => { goToMonitoring(proj.activeRunId || undefined); }}
                          style={{ padding:'6px 14px', borderRadius:6, cursor:'pointer', background:'rgba(74,126,240,0.12)', color:'#7aa8f8', border:'1px solid rgba(74,126,240,0.25)', fontSize:11, fontWeight:500, whiteSpace:'nowrap' }}
                        >
                          Xem giám sát →
                        </button>
                        <button
                          onClick={() => setProfileProject(proj)}
                          style={{ padding:'6px 14px', borderRadius:6, cursor:'pointer', background:'transparent', color:'var(--text-muted)', border:'1px solid var(--border)', fontSize:11, whiteSpace:'nowrap' }}
                        >
                          Hồ sơ dự án
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Sự cố ────────────────────────────────────────────────── */}
      <section>
        <SH icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.071 16.5c-.77.833.192 2.5 1.732 2.5z"
            title="Sự cố trong 24 giờ" badge={`${INCIDENTS.length}`} badgeColor="#f59e0b" />
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {INCIDENTS.map(inc => {
            const ic = { HIGH:'#ef4444', MEDIUM:'#f59e0b', LOW:'#4a7ef0' }[inc.impact] ?? '#475569';
            return (
              <div key={inc.id} style={{ display:'flex', overflow:'hidden', background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:10 }}>
                <div style={{ width:3, flexShrink:0, background:ic }}/>
                <div style={{ flex:1, padding:'12px 14px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:4 }}>
                      <span style={{ padding:'2px 7px', borderRadius:4, fontSize:10, fontWeight:700, background:`${ic}18`, color:ic, border:`1px solid ${ic}28` }}>{inc.impact}</span>
                      <span style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{inc.error}</span>
                      <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>{inc.runId}</span>
                      <span style={{ fontSize:10, color:'var(--text-dim)' }}>· {inc.project} · {inc.stage}</span>
                    </div>
                    <p style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:3 }}>{inc.cause}</p>
                    <div style={{ display:'flex', gap:12 }}>
                      <span style={{ fontSize:10, color:'var(--text-dim)' }}>
                        🔧 Đề xuất: {inc.suggestedAction}
                      </span>
                    </div>
                    <div style={{ display:'flex', gap:10, marginTop:5, flexWrap:'wrap' }}>
                      <span style={{ fontSize:10, color:'var(--text-dim)' }}>{formatTimestamp(inc.timestamp)}</span>
                      <span style={{ padding:'1px 6px', borderRadius:4, fontSize:10, background:'rgba(239,68,68,0.08)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.18)' }}>
                        {inc.handlingStatus === 'open' ? 'Chưa xử lý' : inc.handlingStatus}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => goToMonitoring(inc.runId)}
                    style={{ padding:'5px 12px', borderRadius:6, background:'rgba(74,126,240,0.1)', color:'#7aa8f8', border:'1px solid rgba(74,126,240,0.22)', fontSize:11, cursor:'pointer', flexShrink:0, whiteSpace:'nowrap' }}
                  >
                    Xem run →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Health strip ─────────────────────────────────────────── */}
      <section>
        <SH icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            title="Health strip nguồn dữ liệu" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
          {HEALTH_SOURCES.map(s => {
            const c = s.status==='operational' ? '#22c55e' : s.status==='degraded' ? '#f59e0b' : '#ef4444';
            const lbl = s.status==='operational' ? 'Hoạt động' : s.status==='degraded' ? 'Giảm hiệu năng' : 'Không khả dụng';
            return (
              <Card key={s.name} style={{ padding:'12px 14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{s.name}</span>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:c, boxShadow:`0 0 6px ${c}55`, marginTop:2 }}/>
                </div>
                <div style={{ fontSize:11, fontWeight:600, color:c, marginBottom:6 }}>{lbl}</div>
                <div style={{ fontSize:10, color:'var(--text-dim)', lineHeight:1.8 }}>
                  <div>Dữ liệu: <span style={{ fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>{formatTimestamp(s.lastData).split(',')[0]}</span></div>
                  <div>Độ trễ: <span style={{ fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>{s.latency}</span></div>
                </div>
                {s.error && <div style={{ marginTop:6, padding:'4px 8px', borderRadius:5, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.18)', fontSize:10, color:'#fca5a5' }}>{s.error}</div>}
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Các lần chạy gần đây ─────────────────────────────────── */}
      <section>
        <SH icon="M4 6h16M4 10h16M4 14h16M4 18h16"
            title="Các lần chạy gần đây" badge={`${filteredRuns.length} run`} />
        <Card style={{ overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--bg-surface-2)', borderBottom:'1px solid var(--border)' }}>
                {['Run ID','Dự án','Branch / Commit','CI Status','Security Gate','Findings','Thời lượng','Khởi chạy'].map(h => (
                  <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRuns.length === 0 ? (
                <tr><td colSpan={8} style={{ padding:'24px', textAlign:'center', fontSize:12, color:'var(--text-dim)' }}>
                  Không có run trong khoảng thời gian này
                </td></tr>
              ) : filteredRuns.map((r, i) => (
                <tr key={r.id} style={{
                  borderBottom: i < filteredRuns.length-1 ? '1px solid rgba(28,40,71,0.6)' : 'none',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(16,22,48,0.4)',
                  cursor:'pointer',
                }} onClick={() => goToMonitoring(r.id)}>
                  <td style={{ padding:'10px 14px' }}>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:'#7aa8f8' }}>{r.id}</span>
                  </td>
                  <td style={{ padding:'10px 14px', fontSize:12, color:'var(--text-secondary)' }}>{r.project}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>{r.branch}</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-dim)', marginLeft:6 }}>#{r.commit}</span>
                  </td>
                  <td style={{ padding:'10px 14px' }}><Pill s={r.ciStatus}/></td>
                  <td style={{ padding:'10px 14px' }}><Pill s={r.securityGate}/></td>
                  <td style={{ padding:'10px 14px', fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color: r.findings > 0 ? '#f59e0b' : '#22c55e' }}>
                    {r.findings}
                  </td>
                  <td style={{ padding:'10px 14px', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>{r.duration}</td>
                  <td style={{ padding:'10px 14px', fontSize:11, color:'var(--text-dim)' }}>{timeAgo(r.startedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {/* ── Biểu đồ ─────────────────────────────────────────────── */}
      <section>
        <SH icon="M16 8v8m-4-5v5m-4-2v2" title="Biểu đồ phân tích" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Card style={{ padding:'14px 16px' }}>
            <p style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', marginBottom:12 }}>Runs theo trạng thái ({range})</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={chartData} barSize={7} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,40,71,0.8)" vertical={false}/>
                <XAxis dataKey={xKey} tick={{ fill:'var(--text-dim)', fontSize:9 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'var(--text-dim)', fontSize:9 }} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip contentStyle={{ background:'var(--bg-surface-3)', border:'1px solid var(--border)', borderRadius:6, fontSize:11 }} labelStyle={{ color:'var(--text-secondary)' }}/>
                <Bar dataKey="completed" name="Hoàn tất"  fill="#22c55e" radius={[3,3,0,0]}/>
                <Bar dataKey="running"   name="Đang chạy" fill="#4a7ef0" radius={[3,3,0,0]}/>
                <Bar dataKey="failed"    name="Thất bại"  fill="#ef4444" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card style={{ padding:'14px 16px' }}>
            <p style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', marginBottom:12 }}>Xu hướng findings (7 ngày)</p>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={CHART_FINDINGS_TREND}>
                <defs>
                  <linearGradient id="fg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.28}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,40,71,0.8)"/>
                <XAxis dataKey="date" tick={{ fill:'var(--text-dim)', fontSize:9 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'var(--text-dim)', fontSize:9 }} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip contentStyle={{ background:'var(--bg-surface-3)', border:'1px solid var(--border)', borderRadius:6, fontSize:11 }}/>
                <Area type="monotone" dataKey="findings" stroke="#f59e0b" strokeWidth={2} fill="url(#fg2)" name="Findings" dot={{ fill:'#f59e0b', r:3 }}/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </section>

      {/* ── Project Profile Drawer ───────────────────────────────── */}
      {profileProject && (
        <ProjectProfileDrawer
          project={profileProject}
          onClose={() => setProfileProject(null)}
          onGoMonitor={(runId) => { setProfileProject(null); goToMonitoring(runId); }}
          range={range}
        />
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function Meta({ l, v }: { l:string; v:string }) {
  return (
    <span style={{ fontSize:11 }}>
      <span style={{ color:'var(--text-dim)' }}>{l}: </span>
      <span style={{ color:'var(--text-secondary)' }}>{v}</span>
    </span>
  );
}

function StatChip({ l, v, c }: { l:string; v:string; c:string }) {
  return (
    <div style={{ display:'flex', gap:4, alignItems:'center' }}>
      <span style={{ fontSize:10, color:'var(--text-dim)' }}>{l}:</span>
      <span style={{ fontSize:11, fontFamily:'var(--font-mono)', fontWeight:600, color:c }}>{v}</span>
    </div>
  );
}

function ProjectProfileDrawer({
  project, onClose, onGoMonitor, range,
}: {
  project: ProjectData;
  onClose: () => void;
  onGoMonitor: (runId?: string) => void;
  range: TimeRange;
}) {
  const metrics = getProjectRunMetrics(project.id, range);
  const projRuns = getRunsForProject(project.id);
  const activeRun = project.activeRunId ? RUNS.find(r => r.id === project.activeRunId) : undefined;
  const prog = activeRun ? pipelineProgress(activeRun.tasks) : null;
  const completedPhases = PROJECT_PHASES.filter(p => p.status === 'completed');
  const inProgressPhase = PROJECT_PHASES.find(p => p.status === 'in_progress');
  const hc = HEALTH_C(project.health);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:60 }}
      />
      {/* Drawer */}
      <div style={{
        position:'fixed', top:89, right:0, bottom:0, width:480, zIndex:70,
        background:'var(--bg-surface)', borderLeft:'1px solid var(--border)',
        overflowY:'auto',
        animation:'slideIn 180ms cubic-bezier(0.16,1,0.3,1)',
      }}>
        <style>{`@keyframes slideIn { from { transform:translateX(100%); opacity:0 } to { transform:translateX(0); opacity:1 } }`}</style>

        {/* Header */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
          <div>
            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:3 }}>
              <span style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)' }}>{project.name}</span>
              <span style={{ padding:'2px 8px', borderRadius:4, fontSize:10, background:`${hc}18`, color:hc, border:`1px solid ${hc}28` }}>{HEALTH_L(project.health)}</span>
            </div>
            <p style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.6 }}>{project.description}</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:20, lineHeight:1, padding:4 }}>×</button>
        </div>

        <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Technical info */}
          <InfoSection title="Thông tin kỹ thuật">
            {[
              ['Repository', project.repository],
              ['Branch mặc định', project.defaultBranch],
              ['Công nghệ', project.technology],
              ['Framework', project.framework],
              ['Môi trường', project.environment],
              ['Owner', project.owner],
              ['Scanner', project.scanners.join(', ')],
            ].map(([k,v]) => <InfoRow key={k} label={k} value={v}/>)}
          </InfoSection>

          {/* Current run progress */}
          {activeRun && prog && (
            <InfoSection title="Run đang hoạt động">
              <InfoRow label="Run ID" value={activeRun.id} mono/>
              <InfoRow label="Branch" value={activeRun.branch} mono/>
              <InfoRow label="Commit" value={activeRun.commit} mono/>
              <InfoRow label="Kích hoạt" value={`${activeRun.triggeredBy} (${activeRun.triggeredUser})`}/>
              <InfoRow label="Bắt đầu" value={formatTimestamp(activeRun.startedAt)}/>
              <div style={{ marginTop:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-dim)', marginBottom:4 }}>
                  <span>Tiến độ pipeline: {prog.done}/{prog.total} tasks</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontWeight:600 }}>{prog.pct}%</span>
                </div>
                <div style={{ height:5, borderRadius:4, background:'var(--bg-surface-3)', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${prog.pct}%`, background:'#4a7ef0', borderRadius:4 }}/>
                </div>
                {prog.running && <p style={{ fontSize:10, color:'var(--text-muted)', marginTop:4 }}>Đang: {prog.running}</p>}
                {prog.next && <p style={{ fontSize:10, color:'var(--text-dim)', marginTop:2 }}>Tiếp theo: {prog.next}</p>}
              </div>
              <button
                onClick={() => onGoMonitor(activeRun.id)}
                style={{ marginTop:10, padding:'6px 14px', borderRadius:6, cursor:'pointer', background:'rgba(74,126,240,0.1)', color:'#7aa8f8', border:'1px solid rgba(74,126,240,0.25)', fontSize:11 }}
              >
                Mở trong Giám sát CI/CD →
              </button>
            </InfoSection>
          )}

          {/* Metrics */}
          <InfoSection title={`Thống kê run (${range})`}>
            <InfoRow label="Tổng runs"     value={String(metrics.total)}/>
            <InfoRow label="Hoàn tất"      value={String(metrics.completed)}/>
            <InfoRow label="Thất bại"      value={String(metrics.failed)}/>
            <InfoRow label="Đang chạy"     value={String(metrics.running)}/>
            <InfoRow label="Tỷ lệ thành công" value={`${metrics.succRate}%`}/>
            {metrics.lastFailed && (
              <div style={{ marginTop:6 }}>
                <div style={{ fontSize:10, color:'var(--text-dim)', marginBottom:3 }}>Run thất bại gần nhất:</div>
                <div style={{ padding:'8px 10px', borderRadius:7, background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.15)' }}>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'#fca5a5' }}>{metrics.lastFailed.id}</div>
                  <div style={{ fontSize:11, color:'var(--text-secondary)', marginTop:3 }}>{metrics.lastFailed.failureReason ?? 'Không rõ nguyên nhân'}</div>
                </div>
              </div>
            )}
          </InfoSection>

          {/* Security */}
          <InfoSection title="Bảo mật">
            <InfoRow label="Security Gate" value={CI_L[project.securityGate] ?? project.securityGate}/>
            <InfoRow label="Findings đang mở" value={String(project.openFindings)}/>
            <InfoRow label="Lỗ hổng xác minh" value={String(project.confirmedVulnerabilities)}/>
          </InfoSection>

          {/* Project phases */}
          <InfoSection title={`Tiến độ đề tài: ${completedPhases.length}/11 phase · ${Math.round(completedPhases.length/11*100)}%`}>
            <div style={{ marginBottom:8 }}>
              <div style={{ height:5, borderRadius:4, background:'var(--bg-surface-3)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${completedPhases.length/11*100}%`, background:'#22c55e', borderRadius:4 }}/>
              </div>
            </div>
            {inProgressPhase && (
              <div style={{ marginBottom:6, padding:'6px 10px', borderRadius:7, background:'rgba(74,126,240,0.1)', border:'1px solid rgba(74,126,240,0.2)' }}>
                <span style={{ fontSize:11, color:'#7aa8f8' }}>{inProgressPhase.id} đang thực hiện: {inProgressPhase.name}</span>
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
              {PROJECT_PHASES.map(p => {
                const c = p.status==='completed' ? '#22c55e' : p.status==='in_progress' ? '#4a7ef0' : 'var(--border)';
                return (
                  <div key={p.id} style={{ display:'flex', gap:6, alignItems:'center', padding:'4px 0' }}>
                    <span style={{ width:18, height:18, borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, background:`${c}18`, color:c, flexShrink:0 }}>{p.id}</span>
                    <span style={{ fontSize:10, color: p.status==='pending' ? 'var(--text-dim)' : 'var(--text-secondary)' }}>{p.name}</span>
                  </div>
                );
              })}
            </div>
          </InfoSection>

        </div>
      </div>
    </>
  );
}

function InfoSection({ title, children }: { title:string; children: React.ReactNode }) {
  return (
    <div style={{ padding:'12px 14px', borderRadius:9, background:'var(--bg-surface-2)', border:'1px solid var(--border)' }}>
      <p style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.08em', marginBottom:8 }}>{title.toUpperCase()}</p>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label:string; value:string; mono?:boolean }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0', borderBottom:'1px solid rgba(28,40,71,0.4)' }}>
      <span style={{ fontSize:11, color:'var(--text-dim)' }}>{label}</span>
      <span style={{ fontSize:11, fontFamily: mono ? 'var(--font-mono)' : undefined, color:'var(--text-secondary)' }}>{value}</span>
    </div>
  );
}
