import { useAlert } from '../context/AlertContext';
import Alert from './Alert';
import './Alert.css';

const AlertContainer = () => {
  const { alerts, removeAlert } = useAlert();

  if (alerts.length === 0) return null;

  return (
    <div className="alert-container">
      {alerts.map((alert) => (
        <Alert key={alert.id} alert={alert} onRemove={removeAlert} />
      ))}
    </div>
  );
};

export default AlertContainer;
