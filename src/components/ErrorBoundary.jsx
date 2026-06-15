import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '3rem 2rem', 
          background: '#2B2323', 
          color: '#ff8a8a', 
          border: '1px solid rgba(255, 138, 138, 0.2)', 
          borderRadius: '4px', 
          maxWidth: '1000px', 
          margin: '4rem auto', 
          textAlign: 'left',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          fontFamily: 'var(--font-sans), monospace'
        }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '300', marginBottom: '1rem', color: '#ff6b6b', letterSpacing: '0.05em' }}>
            {this.props.lang === "Cn" ? "⚡ 高端定制模块渲染异常" : "⚡ Bespoke Module Render Exception"}
          </h3>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#D4C5C5', fontWeight: '300' }}>
            {this.props.lang === "Cn" 
              ? "在加载此模块时，浏览器抛出了一个运行时异常。这可能是由于特定的局部逻辑错误或外部资源连接异常。已为您拦截并捕获诊断信息："
              : "A runtime exception occurred while mounting this module. This is typically due to localized logic errors or connection drops. Diagnostic stack trace has been captured below:"}
          </p>
          <div style={{ background: '#1C1616', padding: '1.5rem', borderRadius: '3px', marginTop: '1.5rem', borderLeft: '3px solid #ff6b6b', overflowX: 'auto' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', fontFamily: 'monospace', color: '#ff6b6b', marginBottom: '0.5rem' }}>
              Error: {this.state.error?.message}
            </div>
            <pre style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#D4C5C5', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
              {this.state.error?.stack}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
