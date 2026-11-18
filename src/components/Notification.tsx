import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface NotificationProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Notification({ type, message, onClose, duration = 5000 }: NotificationProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 z-50 flex items-start gap-3 rounded-lg p-4 shadow-lg sm:left-auto sm:max-w-sm ${
        type === 'success'
          ? 'bg-green-50 border border-green-200'
          : 'bg-red-50 border border-red-200'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
      )}
      <p className={`text-sm flex-1 ${type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
        {message}
      </p>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
