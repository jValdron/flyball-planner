import { useEffect, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { wsClient } from '../apollo/client';

export const WebSocketStatus: React.FC = () => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success');

  useEffect(() => {
    const handleConnected = () => {
      setToastMessage('Reconnected to server');
      setToastVariant('success');
      setShowToast(true);

      setTimeout(() => setShowToast(false), 3000);
    };

    const handleClosed = () => {
      setToastMessage('Lost connection to server. Attempting to reconnect...');
      setToastVariant('danger');
      setShowToast(true);
    };

    const handleError = (error: any) => {
      setToastMessage(`Connection error: ${error.message || 'Unknown error'}`);
      setToastVariant('danger');
      setShowToast(true);
    };

    wsClient.on('connected', handleConnected);
    wsClient.on('closed', handleClosed);
    wsClient.on('error', handleError);
  }, []);

  return (
    <ToastContainer position="top-end" className="p-3">
      <Toast
        show={showToast}
        onClose={() => setShowToast(false)}
        delay={toastVariant === 'success' ? 3000 : 5000}
        autohide={toastVariant === 'success'}
        bg={toastVariant}
      >
        <Toast.Header closeButton>
          <strong className="me-auto">
            {toastVariant === 'success' ? '🟢 Connected' : '🔴 Disconnected'}
          </strong>
        </Toast.Header>
        <Toast.Body className={toastVariant === 'danger' ? 'text-white' : ''}>
          {toastMessage}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
};