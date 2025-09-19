import { useEffect, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { wsClient } from '../apollo/client';
import { useTheme } from '../contexts/ThemeContext';

export const WebSocketStatus: React.FC = () => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { isDark } = useTheme();

  useEffect(() => {

    const handleConnected = () => {
      setShowToast(false);
    };

    const handleClosed = () => {
      setToastMessage('Connection lost. Reconnecting...');
      setShowToast(true);
    };

    const handleError = (error: any) => {
      setToastMessage(`Connection error: ${error.message || 'Unknown error'}`);
      setShowToast(true);
    };

    wsClient.on('connected', handleConnected);
    wsClient.on('closed', handleClosed);
    wsClient.on('error', handleError);
  }, []);

  return (
    <ToastContainer position="bottom-start" className="p-3">
      <Toast
        show={showToast}
        onClose={() => setShowToast(false)}
        delay={3000}
        autohide
        bg={isDark ? 'dark' : 'light'}
        className={isDark ? 'text-white' : ''}
      >
        <Toast.Body>
          {toastMessage}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
};
