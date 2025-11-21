import { Alert } from '@/context/MonitoringContext';

interface AlertPopupProps {
  alert: Alert;
  onClose: () => void;
}

export default function AlertPopup({ alert, onClose }: AlertPopupProps) {
  return (
    <div className="fixed top-4 right-4 max-w-md z-50">
      <div className={`rounded-lg shadow-lg p-4 text-white ${
        alert.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'
      }`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">{alert.message}</p>
            <p className="text-sm opacity-90">{alert.timestamp}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:opacity-80 transition"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
