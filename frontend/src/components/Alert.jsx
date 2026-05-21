import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import './Alert.css';

const Alert = ({ alert, onRemove }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (alert.duration <= 0) return;

    const interval = 50; // Update progress every 50ms
    const step = (interval / alert.duration) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - step;
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [alert.duration, isPaused]);

  const getIcon = () => {
    switch (alert.type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <XCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'info':
      default:
        return <Info size={20} />;
    }
  };

  const getColors = () => {
    switch (alert.type) {
      case 'success':
        return {
          bg: 'var(--success-bg, #f0fdf4)',
          border: 'var(--success-border, #22c55e)',
          icon: 'var(--success-icon, #16a34a)',
          text: 'var(--success-text, #15803d)',
        };
      case 'error':
        return {
          bg: 'var(--error-bg, #fef2f2)',
          border: 'var(--error-border, #ef4444)',
          icon: 'var(--error-icon, #dc2626)',
          text: 'var(--error-text, #b91c1c)',
        };
      case 'warning':
        return {
          bg: 'var(--warning-bg, #fffbeb)',
          border: 'var(--warning-border, #f59e0b)',
          icon: 'var(--warning-icon, #d97706)',
          text: 'var(--warning-text, #b45309)',
        };
      case 'info':
      default:
        return {
          bg: 'var(--info-bg, #eff6ff)',
          border: 'var(--info-border, #3b82f6)',
          icon: 'var(--info-icon, #2563eb)',
          text: 'var(--info-text, #1d4ed8)',
        };
    }
  };

  const colors = getColors();

  return (
    <div
      className={`alert alert-${alert.type}`}
      style={{
        '--alert-bg': colors.bg,
        '--alert-border': colors.border,
        '--alert-icon': colors.icon,
        '--alert-text': colors.text,
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="alert-icon-wrapper">{getIcon()}</div>
      <div className="alert-content">
        <p className="alert-message">{alert.message}</p>
        {alert.description && <p className="alert-description">{alert.description}</p>}
      </div>
      <button className="alert-close" onClick={() => onRemove(alert.id)} aria-label="Close">
        <X size={16} />
      </button>
      {alert.duration > 0 && (
        <div className="alert-progress">
          <div
            className="alert-progress-bar"
            style={{
              width: `${progress}%`,
              backgroundColor: colors.border,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Alert;
