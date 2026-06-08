import { Outlet, useLocation } from 'react-router-dom';
import LiquidEther from './LiquidEther.jsx';
import Navbar from './Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  const isAuthScreen = location.pathname.startsWith('/sign');
  const isLanding = location.pathname === '/welcome' || location.pathname === '/';
  const isChromeless = isAuthScreen || isLanding;

  let pageClass = 'page-app';
  if (isAuthScreen) pageClass = 'page-auth';
  if (isLanding) pageClass = 'page-landing';

  return (
    <div className="app-shell">
      <div className="bg-fx">
        <LiquidEther
          colors={['#c41230', '#f08596', '#00A0B0']}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
      </div>

      {!isChromeless && user && !loading && <Navbar />}

      <main className={`page ${pageClass}`}>
        <Outlet />
      </main>
    </div>
  );
}
