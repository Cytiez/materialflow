import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center px-6">
          <span className="material-symbols-outlined text-[48px] text-stone/30 mb-4 block">broken_image</span>
          <h2 className="text-[18px] font-bold text-soil mb-2">Terjadi kesalahan tak terduga</h2>
          <p className="text-[13px] text-stone mb-6 max-w-sm">
            Halaman ini mengalami error. Coba muat ulang atau kembali ke halaman sebelumnya.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Muat Ulang
            </button>
            <button
              onClick={() => { this.setState({ hasError: false }); window.history.back(); }}
              className="btn-secondary"
            >
              Kembali
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
