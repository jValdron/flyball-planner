import { Spinner, Container } from 'react-bootstrap'

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | undefined;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size,
  className = 'text-center mt-5'
}) => {
  return (
    <Container className={className}>
      <Spinner animation="border" role="status" size={size}>
        <span className="visually-hidden">{message}</span>
      </Spinner>
      {message && (
        <div className="mt-3 text-muted">
          {message}
        </div>
      )}
    </Container>
  );
};