import { useState } from 'react';
import { FINDINGS, CODEBERT_PREDICTIONS_ONLY, formatTimestamp, timeAgo } from '../data/mockData';

type Finding = typeof FINDINGS[number];
type Tab = 'overview' | 'evidence' | 'remediation' | 'history';

const SEV_COLOR: Record<string,string> = {
  CRITICAL:'#dc2626', HIGH:'#ef4444', MEDIUM:'#f59e0b', LOW:'#4a7ef0', INFO:'#6366f1',
};

function SevBadge({ s }: { s: string }) {
  const c = SEV_COLOR[s] ?? '#475569';
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'2px 7px', borderRadius:4,
      background:`${c}1a`, color:c, border:`1px solid ${c}30`,
      fontSize:10, fontWeight:700,
    }}>{s}</span>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:10, ...style }}>
      {children}
    </div>
  );
}

interface Filters { project:string; severity:string; cwe:string; source:string; status:string }
const DEFAULT: Filters = { project:'', severity:'', cwe:'', source:'', status:'' };

/* ══════════════════════════════════════════════════════════════════════ */
export default function SecurityAlerts() {
  const [filters, setFilters] = useState<Filters>(DEFAULT);
  const [selId, setSelId] = useState<string>(FINDINGS[0]?.id ?? '');
  const [tab, setTab] = useState<Tab>('overview');

  const activeCount = Object.values(filters).filter(Boolean).length;

  const filtered = FINDINGS.filter(f => {
    if (filters.project  && f.project  !== filters.project)  return false;
    if (filters.severity && f.severity !== filters.severity) return false;
    if (filters.cwe      && f.cwe      !== filters.cwe)      return false;
    return true;
  });

  const sel = filtered.find(f => f.id === selId) ?? filtered[0];

  function pick<K extends keyof Filters>(k: K, v: string) {
    setFilters(p => ({ ...p, [k]: v }));
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, height:'100%' }}>

      {/* Title */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexShrink:0 }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>Cảnh báo bảo mật</h2>
          <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>
            2 security findings · 0 confirmed vulnerabilities · dữ liệu 24 giờ
          </p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {activeCount > 0 && (
            <span style={{ padding:'3px 9px', borderRadius:4, background:'rgba(74,126,240,0.12)', color:'#7aa8f8', border:'1px solid rgba(74,126,240,0.22)', fontSize:11 }}>
              {activeCount} bộ lọc
            </span>
          )}
          <button onClick={() => setFilters(DEFAULT)} style={{
            padding:'5px 12px', borderRadius:6, cursor:'pointer',
            background:'var(--bg-surface)', color: activeCount ? 'var(--text-secondary)' : 'var(--text-dim)',
            border:'1px solid var(--border)', fontSize:11,
          }}>
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <Card style={{ padding:'10px 14px', flexShrink:0 }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:12, alignItems:'center' }}>
          <Flt label="Dự án" val={filters.project} onChange={v => pick('project',v)}
            opts={[{v:'',l:'Tất cả'},{v:'Flask Lab A',l:'Flask Lab A'},{v:'Python API C',l:'Python API C'},{v:'Django Demo B',l:'Django Demo B'}]}/>
          <Flt label="Severity" val={filters.severity} onChange={v => pick('severity',v)}
            opts={[{v:'',l:'Tất cả'},{v:'CRITICAL',l:'Critical'},{v:'HIGH',l:'High'},{v:'MEDIUM',l:'Medium'},{v:'LOW',l:'Low'}]}/>
          <Flt label="CWE" val={filters.cwe} onChange={v => pick('cwe',v)}
            opts={[{v:'',l:'Tất cả'},{v:'CWE-89',l:'CWE-89'},{v:'CWE-798',l:'CWE-798'}]}/>
          <Flt label="Nguồn" val={filters.source} onChange={v => pick('source',v)}
            opts={[{v:'',l:'Tất cả'},{v:'combined',l:'Combined'},{v:'codebert',l:'CodeBERT only'},{v:'checkmarx',l:'Checkmarx only'}]}/>
          <Flt label="Xác minh" val={filters.status} onChange={v => pick('status',v)}
            opts={[{v:'',l:'Tất cả'},{v:'pending',l:'Chờ xác minh'},{v:'confirmed',l:'Đã xác nhận'},{v:'false_positive',l:'False Positive'}]}/>
        </div>
      </Card>

      {/* CodeBERT-only notice */}
      <div style={{
        flexShrink:0, padding:'8px 14px', borderRadius:8, display:'flex', alignItems:'flex-start', gap:8,
        background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.18)',
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8" style={{ flexShrink:0, marginTop:1 }}>
          <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p style={{ fontSize:11, color:'#a5b4fc', lineHeight:1.5 }}>
          <strong>CodeBERT-only prediction:</strong> {CODEBERT_PREDICTIONS_ONLY[0].file}:{CODEBERT_PREDICTIONS_ONLY[0].line}
          {' '}(confidence {Math.round(CODEBERT_PREDICTIONS_ONLY[0].confidence * 100)}%) — dưới ngưỡng kết hợp.
          <strong> Không tính vào security finding.</strong> Hiển thị trong phần Evidence của finding liên quan.
        </p>
      </div>

      {/* Master – Detail */}
      <div style={{ display:'flex', gap:14, flex:1, minHeight:0 }}>

        {/* List panel — 340px */}
        <div style={{
          width:340, flexShrink:0, display:'flex', flexDirection:'column',
          background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden',
        }}>
          <div style={{ padding:'9px 14px', background:'var(--bg-surface-2)', borderBottom:'1px solid var(--border)' }}>
            <span style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)' }}>{filtered.length} finding(s)</span>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {filtered.length === 0
              ? <div style={{ padding:'32px 14px', textAlign:'center', color:'var(--text-dim)', fontSize:12 }}>Không có finding khớp</div>
              : filtered.map(f => {
                  const isActive = f.id === selId;
                  return (
                    <button key={f.id} onClick={() => { setSelId(f.id); setTab('overview'); }}
                      style={{
                        display:'block', width:'100%', textAlign:'left', padding:'12px 14px', border:'none',
                        cursor:'pointer', borderBottom:'1px solid var(--border)',
                        background: isActive ? 'rgba(74,126,240,0.1)' : 'transparent',
                        borderLeft: isActive ? '2px solid #4a7ef0' : '2px solid transparent',
                      }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:600, color:'#7aa8f8' }}>{f.id}</span>
                        <SevBadge s={f.severity}/>
                      </div>
                      <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', marginBottom:3 }}>{f.cweName}</div>
                      <div style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>{f.file}:{f.line}</div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                        <span style={{ fontSize:10, color:'var(--text-dim)' }}>{f.project}</span>
                        <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-dim)' }}>{f.runId}</span>
                      </div>
                    </button>
                  );
                })
            }
          </div>
        </div>

        {/* Detail panel */}
        <div style={{
          flex:1, minWidth:0, display:'flex', flexDirection:'column',
          background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden',
        }}>
          {!sel
            ? <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-dim)', fontSize:13 }}>
                Chọn finding để xem chi tiết
              </div>
            : <>
                {/* Detail header */}
                <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:'#7aa8f8' }}>{sel.id}</span>
                        <SevBadge s={sel.severity}/>
                        <span style={{
                          padding:'2px 8px', borderRadius:4, fontSize:10,
                          background:'rgba(245,158,11,0.12)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.25)',
                        }}>
                          Chờ xác minh
                        </span>
                      </div>
                      <h3 style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>
                        Lỗ hổng tiềm ẩn: {sel.cweName} ({sel.cwe})
                      </h3>
                      <div style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>
                        {sel.file}:{sel.line} · {sel.function}
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      {[
                        { l:'Xác nhận lỗ hổng', c:'#ef4444' },
                        { l:'False Positive',   c:'#6366f1' },
                        { l:'Kiểm tra lại',     c:'#4a7ef0' },
                      ].map(b => (
                        <button key={b.l} style={{
                          padding:'5px 11px', borderRadius:6, cursor:'pointer',
                          background:`${b.c}12`, color:b.c, border:`1px solid ${b.c}28`,
                          fontSize:11, fontWeight:500,
                        }}>{b.l}</button>
                      ))}
                    </div>
                  </div>

                  {/* Meta grid */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginTop:14 }}>
                    {[
                      { k:'Dự án', v:sel.project },
                      { k:'Run ID', v:sel.runId },
                      { k:'Repository', v:sel.repo },
                      { k:'Commit', v:sel.commit },
                    ].map(m => (
                      <div key={m.k}>
                        <div style={{ fontSize:10, color:'var(--text-dim)' }}>{m.k}</div>
                        <div style={{ fontSize:11, fontFamily:'var(--font-mono)', fontWeight:600, color:'var(--text-secondary)', marginTop:2 }}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ display:'flex', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
                  {(['overview','evidence','remediation','history'] as Tab[]).map(t => {
                    const lbl = { overview:'Tổng quan', evidence:'Bằng chứng', remediation:'Khắc phục', history:'Lịch sử' }[t];
                    return (
                      <button key={t} onClick={() => setTab(t)} style={{
                        padding:'10px 18px', border:'none', cursor:'pointer', background:'transparent',
                        fontSize:12, fontWeight: tab === t ? 600 : 400,
                        color: tab === t ? '#7aa8f8' : 'var(--text-muted)',
                        borderBottom: tab === t ? '2px solid #4a7ef0' : '2px solid transparent',
                      }}>{lbl}</button>
                    );
                  })}
                </div>

                {/* Tab body */}
                <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
                  <DetailTab tab={tab} f={sel}/>
                </div>
              </>
          }
        </div>
      </div>
    </div>
  );
}

function DetailTab({ tab, f }: { tab: Tab; f: Finding }) {
  if (tab === 'overview') return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Detection signals */}
      <div>
        <p style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.08em', marginBottom:8 }}>TÍN HIỆU PHÁT HIỆN</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
          <Signal label="CodeBERT confidence"
            value={`${Math.round(f.codebertConfidence*100)}%`}
            sub={f.codebertLabel}
            color={f.codebertConfidence > 0.8 ? '#ef4444' : '#f59e0b'}/>
          <Signal label="Checkmarx severity" value={f.checkmarxSeverity} sub="SAST result"
            color={{ HIGH:'#ef4444', MEDIUM:'#f59e0b', LOW:'#4a7ef0' }[f.checkmarxSeverity] ?? '#475569'}/>
          <Signal label="Combination policy" value="AND" sub={f.combinationPolicy} color="#22c55e"/>
        </div>
      </div>

      {/* Code snippet */}
      <div>
        <p style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.08em', marginBottom:8 }}>CODE SNIPPET</p>
        <pre style={{
          padding:'14px 16px', borderRadius:8, overflow:'auto',
          background:'var(--bg-input)', border:'1px solid var(--border)',
          fontFamily:'var(--font-mono)', fontSize:11, color:'#a8c4e0', lineHeight:1.7,
        }}>
          {f.codeSnippet}
        </pre>
      </div>
    </div>
  );

  if (tab === 'evidence') return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <InfoBlock title="BẰNG CHỨNG">{f.evidence}</InfoBlock>
      <div style={{
        padding:'12px 14px', borderRadius:8,
        background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.15)',
      }}>
        <p style={{ fontSize:10, fontWeight:700, color:'#818cf8', letterSpacing:'0.08em', marginBottom:6 }}>SOURCE SIGNALS</p>
        <p style={{ fontSize:12, color:'#a5b4fc', lineHeight:1.6 }}>
          CodeBERT prediction confidence:{' '}
          <strong style={{ fontFamily:'var(--font-mono)' }}>{Math.round(f.codebertConfidence*100)}%</strong>
          {' '}(label: {f.codebertLabel}). Checkmarx scan severity:{' '}
          <strong>{f.checkmarxSeverity}</strong>.
        </p>
      </div>
    </div>
  );

  if (tab === 'remediation') return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <InfoBlock title="HƯỚNG DẪN KHẮC PHỤC">{f.remediation}</InfoBlock>
      <div style={{ padding:'12px 14px', borderRadius:8, background:'var(--bg-surface-2)', border:'1px solid var(--border)' }}>
        <p style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.08em', marginBottom:6 }}>VALIDATION TEST</p>
        <code style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text-secondary)' }}>{f.validationTest}</code>
      </div>
    </div>
  );

  return (
    <div>
      <p style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.08em', marginBottom:10 }}>LỊCH SỬ TRẠNG THÁI</p>
      {f.statusHistory.map((h, i) => (
        <div key={i} style={{
          display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, marginBottom:6,
          background:'var(--bg-surface-2)', border:'1px solid var(--border)',
        }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#4a7ef0', flexShrink:0 }}/>
          <span style={{ fontSize:12, fontWeight:600, textTransform:'capitalize', color:'var(--text-primary)' }}>{h.status}</span>
          <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>{formatTimestamp(h.timestamp)}</span>
          <span style={{ fontSize:11, color:'var(--text-dim)' }}>by {h.actor}</span>
        </div>
      ))}
    </div>
  );
}

function Signal({ label, value, sub, color }: { label:string; value:string; sub:string; color:string }) {
  return (
    <div style={{ padding:'10px 12px', borderRadius:8, background:'var(--bg-surface-2)', border:'1px solid var(--border)' }}>
      <div style={{ fontSize:10, color:'var(--text-dim)', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:18, fontWeight:700, fontFamily:'var(--font-mono)', color }}>{value}</div>
      <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{sub}</div>
    </div>
  );
}

function InfoBlock({ title, children }: { title:string; children:string }) {
  return (
    <div style={{ padding:'12px 14px', borderRadius:8, background:'var(--bg-surface-2)', border:'1px solid var(--border)' }}>
      <p style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.08em', marginBottom:6 }}>{title}</p>
      <p style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.7 }}>{children}</p>
    </div>
  );
}

function Flt({ label, val, onChange, opts }: {
  label: string; val: string;
  onChange: (v: string) => void;
  opts: { v: string; l: string }[];
}) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      <span style={{ fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap' }}>{label}:</span>
      <select value={val} onChange={e => onChange(e.target.value)} style={{
        padding:'4px 24px 4px 8px', borderRadius:5, outline:'none',
        background:'var(--bg-surface-2)', color:'var(--text-secondary)',
        border:'1px solid var(--border)', fontSize:11, cursor:'pointer',
      }}>
        {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}
