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
      <div className="error-boundary">
        <div className="error-boundary-card">
          <span className="error-boundary-icon"><Icon name="alert" size={34} /></span>
          <h1>Trang gặp sự cố</h1>
          <p>
            Đã có lỗi ngoài dự kiến. Bạn có thể thử lại — dữ liệu đã lưu trên máy chủ không bị ảnh hưởng.
          </p>

          {import.meta.env.DEV && (
            <pre className="error-boundary-detail">{String(error?.message || error)}</pre>
          )}

          <div className="error-boundary-actions">
            <button type="button" className="btn-primary" onClick={this.handleRetry}>
              Thử lại
            </button>
            <button type="button" className="btn-ghost" onClick={this.handleReload}>
              Tải lại trang
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
