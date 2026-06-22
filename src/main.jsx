console.log("=== MAIN.JSX ENTRY START ===");
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx';
import './style.css';

class TopErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    console.log("=== TopErrorBoundary getDerivedStateFromError caught ===", error);
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("=== TopErrorBoundary componentDidCatch caught ===", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div id="crafton-error-overlay" style={{ padding: '20px', background: '#2B1E1E', color: '#FF6B6B', fontSize: '18px', zIndex: 99999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'auto', fontFamily: 'monospace' }}>
          <h1>🚨 Rendering Crashed at Top Level</h1>
          <p>A critical runtime exception occurred during render. Stack trace:</p>
          <pre style={{ background: '#140E0E', padding: '15rem 1.5rem', borderRadius: '4px', overflowX: 'auto', color: '#E5CFCF', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.message}
            {"\n\n"}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

console.log("=== MAIN.JSX MOUNTING ===");
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TopErrorBoundary>
      <App />
    </TopErrorBoundary>
  </React.StrictMode>
);
console.log("=== MAIN.JSX ENTRY END ===");


