import React from 'react';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#FEF2F2', height: '100vh', color: '#991B1B' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Algo deu errado (React Crash)</h1>
          <p style={{ marginTop: '1rem' }}>A aplicação encontrou um erro crítico e não pôde carregar.</p>
          
          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#FEE2E2', borderRadius: '0.5rem', overflow: 'auto' }}>
            <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Erro:</strong>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
              {this.state.error && this.state.error.toString()}
            </pre>
          </div>

          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#FEE2E2', borderRadius: '0.5rem', overflow: 'auto' }}>
             <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Component Stack:</strong>
             <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
               {this.state.errorInfo && this.state.errorInfo.componentStack}
             </pre>
          </div>

          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '2rem', padding: '0.5rem 1rem', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
          >
            Tentar Recarregar
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default GlobalErrorBoundary;
