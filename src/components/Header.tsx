import { useApp } from '../context/AppContext';
import { formatTimestamp } from '../data/mockData';

interface HeaderProps { screenTitle: string }

export default function Header({ screenTitle }: HeaderProps) {
  const { selectedRun, activeProject } = useApp();

  const repo    = activeProject?.repository  ?? '—';
  const branch  = selectedRun?.branch        ?? '—';
  const commit  = selectedRun?.commit        ?? '—';
  const runId   = selectedRun?.id            ?? '—';
  const updated = selectedRun?.completedAt ?? selectedRun?.startedAt ?? '';

  return (
    <header style={{
      position:'fixed', top:0, left:240, right:0, zIndex:40,
      background:'var(--bg-sidebar)',
      borderBottom:'1px solid var(--border)',
    }}>
      {/* Banner 32px */}
      <div style={{
        height:32, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        background:'rgba(245,158,11,0.07)', borderBottom:'1px solid rgba(245,158,11,0.18)',
      }}>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#f59e0b" strokeWidth="1.5">
          <path d="M8 1L1.5 14h13L8 1z" strokeLinejoin="round"/>
          <path d="M8 6v3M8 11v.5" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize:10, fontWeight:700, color:'#f59e0b', letterSpacing:'0.12em', textTransform:'uppercase' }}>
          Dữ Liệu Minh Họa
        </span>
        <span style={{ fontSize:10, color:'rgba(245,158,11,0.45)' }}>
          — Không phải kết quả thực nghiệm
        </span>
      </div>

      {/* Main row 57px */}
      <div style={{ height:57, display:'flex', alignItems:'center', padding:'0 28px', gap:18 }}>

        {/* Title */}
        <div style={{ flexShrink:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', lineHeight:1.2 }}>
            AI WhiteSec CI Dashboard
          </div>
          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{screenTitle}</div>
        </div>

        <div style={{ width:1, height:26, background:'var(--border)', flexShrink:0 }}/>

        {/* Dynamic metadata */}
        <div style={{ display:'flex', alignItems:'center', gap:16, flex:1, flexWrap:'wrap' }}>
          <Chip icon="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" label={repo} />
          <Chip icon="M13 10V3L4 14h7v7l9-11h-7z" label={branch} />
          <Chip icon="M7 20l4-16m2 16l4-16" label={commit} mono />
          <Chip icon="M4 4v5h.582m15.356 2A8 8 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            label={runId} mono accent />
          {activeProject && (
            <span style={{ fontSize:11, color:'var(--text-dim)' }}>
              {activeProject.name}
            </span>
          )}
        </div>

        {/* Right */}
        <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          {updated && (
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:10, color:'var(--text-muted)' }}>Cập nhật lần cuối</div>
              <div style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-secondary)', marginTop:1 }}>
                {formatTimestamp(updated)}
              </div>
            </div>
          )}
          <button style={{
            padding:'5px 12px', borderRadius:6, border:'1px solid var(--border)',
            background:'var(--bg-surface)', color:'var(--text-secondary)',
            fontSize:11, fontWeight:500, cursor:'pointer',
          }}>
            Dữ liệu mẫu
          </button>
        </div>
      </div>
    </header>
  );
}

function Chip({ icon, label, mono, accent }: { icon:string; label:string; mono?:boolean; accent?:boolean }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
        stroke={accent ? '#4a7ef0' : 'var(--text-muted)'} strokeWidth="2" style={{ flexShrink:0 }}>
        <path d={icon} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{
        fontSize:11, fontFamily: mono ? 'var(--font-mono)' : undefined,
        color: accent ? '#7aa8f8' : 'var(--text-secondary)',
      }}>
        {label}
      </span>
    </div>
  );
}
