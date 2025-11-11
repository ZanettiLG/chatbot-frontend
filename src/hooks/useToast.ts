import { useDispatch } from 'react-redux';
import { addNotification } from '../store/uiSlice';

export type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  severity?: ToastSeverity;
  persistent?: boolean;
}

export const useToast = () => {
  const dispatch = useDispatch();

  const showToast = (message: string, options: ToastOptions = {}) => {
    dispatch(
      addNotification({
        message,
        type: options.severity || 'info',
      })
    );
  };

  const showSuccess = (message: string) => {
    showToast(message, { severity: 'success' });
  };

  const showError = (message: string) => {
    showToast(message, { severity: 'error' });
  };

  const showWarning = (message: string) => {
    showToast(message, { severity: 'warning' });
  };

  const showInfo = (message: string) => {
    showToast(message, { severity: 'info' });
  };

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

