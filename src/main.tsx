import { StrictMode, Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/vazirmatn/300.css';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/600.css';
import '@fontsource/vazirmatn/700.css';
import '@fontsource/vazirmatn/800.css';
import '@fontsource/vazirmatn/900.css';
import '@fontsource/cormorant/500.css';
import '@fontsource/cormorant/600.css';
import './styles/app.css';
import App from './App';

/** Last line of defence: a render error never leaves the register on a blank screen. */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error(error);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div className="card card-pad stack" style={{ maxWidth: 460 }}>
          <h2>خطای نمایشی رخ داد</h2>
          <p className="muted">داده‌های شما سالم و ذخیره‌شده است. صفحه را دوباره بارگذاری کنید.</p>
          <button className="btn btn-primary" onClick={() => location.reload()}>بارگذاری مجدد</button>
        </div>
      </div>
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
