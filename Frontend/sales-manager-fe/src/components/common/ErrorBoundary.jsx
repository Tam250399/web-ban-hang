import { Component } from 'react'
import { Icon } from './Icon'

class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  handleRetry = () => this.setState({ error: null })

  handleReload = () => window.location.reload()

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-brand-bg text-ink">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center border border-brand-divider/60">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Icon name="alert" size={32} />
          </div>
          <h1 className="text-2xl font-extrabold font-display tracking-tight text-ink mb-2">
            Trang gặp sự cố
          </h1>
          <p className="text-sm text-brand-text mb-6 leading-relaxed">
            Đã có lỗi ngoài dự kiến. Bạn có thể thử lại — dữ liệu đã lưu trên máy chủ không bị ảnh hưởng.
          </p>

          {import.meta.env.DEV && (
            <pre className="bg-neutral-900 text-red-300 p-4 rounded-xl text-xs font-mono text-left mb-6 overflow-x-auto max-h-48">
              {String(error?.message || error)}
            </pre>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-extrabold font-display tracking-wide rounded-xl shadow transition cursor-pointer"
              onClick={this.handleRetry}
            >
              Thử lại
            </button>
            <button
              type="button"
              className="px-5 py-2.5 border border-brand-divider hover:bg-neutral-100 text-ink font-bold font-display rounded-xl transition cursor-pointer"
              onClick={this.handleReload}
            >
              Tải lại trang
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
