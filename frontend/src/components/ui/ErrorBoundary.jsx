import { Component } from "react";
import PropTypes from "prop-types";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * ErrorBoundary — Minimum class wrapper (bắt buộc bởi React)
 * Việc còn lại toàn bộ codebase dùng function component + JSX.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Caught:", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={containerStyle}>
          <AlertTriangle size={48} style={{ color: "var(--color-warning)", marginBottom: 16 }} />
          <h3 style={titleStyle}>Đã xảy ra lỗi</h3>
          <p style={descStyle}>
            Có lỗi không mong muốn xảy ra. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu sự cố tiếp diễn.
          </p>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details style={{ marginBottom: 16, textAlign: "left", maxWidth: "100%", overflow: "auto" }}>
              <summary style={{ cursor: "pointer", fontSize: "var(--font-size-small)", color: "var(--text-secondary)" }}>
                Chi tiết lỗi
              </summary>
              <pre style={{ fontSize: "var(--font-size-micro)", color: "var(--color-error)", whiteSpace: "pre-wrap", marginTop: 8 }}>
                {this.state.error.message}
                {"\n"}
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <button
            type="button"
            onClick={this.handleRetry}
            className="btn-vms btn-vms-primary"
            style={{ padding: "7px 16px", fontSize: "var(--font-size-small)" }}
          >
            <RefreshCw size={16} />
            Thử lại
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;

const containerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "60vh",
  padding: "var(--space-4)",
  textAlign: "center",
  gap: 16,
};

const titleStyle = {
  margin: 0,
  fontSize: "var(--font-size-h2)",
  fontWeight: "var(--font-weight-semibold)",
  color: "var(--text-primary)",
};

const descStyle = {
  margin: 0,
  maxWidth: 400,
  fontSize: "var(--font-size-small)",
  color: "var(--text-secondary)",
};