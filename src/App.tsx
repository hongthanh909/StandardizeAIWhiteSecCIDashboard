import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Overview from './screens/Overview';
import SecurityAlerts from './screens/SecurityAlerts';
import ModelEvaluation from './screens/ModelEvaluation';
import CICDMonitoring from './screens/CICDMonitoring';
import { AppProvider, useApp } from './context/AppContext';

type Screen = 'overview' | 'alerts' | 'evaluation' | 'monitoring';

const TITLES: Record<Screen, string> = {
  overview:   'Tổng quan hệ thống',
  alerts:     'Cảnh báo bảo mật',
  evaluation: 'Đánh giá mô hình & Benchmark',
  monitoring: 'Giám sát CI/CD & Security Gate',
};

function AppInner() {
  const { screen, navigateTo } = useApp();
  const s = screen as Screen;

  function go(next: string) {
    navigateTo(next);
  }

  return (
    <>
      <Sidebar active={s} onNavigate={go} />
      <Header screenTitle={TITLES[s] ?? ''} />
      <main style={{
        marginLeft: 240,
        marginTop: 89,
        minHeight: 'calc(100vh - 89px)',
        padding: '28px 32px 40px',
        background: 'var(--bg-base)',
      }}>
        <div key={s} className="fade-slide">
          {s === 'overview'   && <Overview />}
          {s === 'alerts'     && <SecurityAlerts />}
          {s === 'evaluation' && <ModelEvaluation />}
          {s === 'monitoring' && <CICDMonitoring />}
        </div>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
