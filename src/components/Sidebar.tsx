export type Screen = 'overview' | 'alerts' | 'evaluation' | 'monitoring';

interface SidebarProps {
  active: Screen;
  onNavigate: (s: Screen) => void;
}

const NAV: { id: Screen; label: string; path: string }[] = [
  {
    id: 'overview',
    label: 'Tổng quan',
    path: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    id: 'alerts',
    label: 'Cảnh báo bảo mật',
    path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.071 16.5c-.77.833.192 2.5 1.732 2.5z',
  },
  {
    id: 'evaluation',
    label: 'Đánh giá mô hình',
    path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    id: 'monitoring',
    label: 'Giám sát CI/CD',
    path: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
];

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside
      style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 240, zIndex: 50,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Brand */}
      <div style={{ padding: '20px 16px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          {/* Shield icon */}
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, #3b63e8 0%, #22d3ee 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3.5 5.5V10.5C3.5 14.1 6.4 17.4 10 18C13.6 17.4 16.5 14.1 16.5 10.5V5.5L10 2Z"
                stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(255,255,255,0.15)"/>
              <path d="M7.5 10L9.5 12L13 8.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
              AI WhiteSec CI
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 40 }}>
          Hệ thống phân tích bảo mật
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(item => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: isActive ? 'rgba(74,126,240,0.13)' : 'transparent',
                color: isActive ? '#7aa8f8' : 'var(--text-secondary)',
                borderLeft: isActive ? '2px solid #4a7ef0' : '2px solid transparent',
                textAlign: 'left', width: '100%',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLElement).style.color = '#a8bede';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                }
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" style={{ flexShrink: 0 }}>
                <path d={item.path} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
              {isActive && (
                <span style={{
                  marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
                  background: '#4a7ef0', flexShrink: 0,
                }}/>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: 'var(--bg-surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--border)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--text-muted)">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Operator</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Nhóm vận hành</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
