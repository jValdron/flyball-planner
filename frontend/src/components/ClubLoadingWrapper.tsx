import type { ReactNode } from 'react';
import { useClub } from '../contexts/ClubContext';
import { LoadingSpinner } from './LoadingSpinner';

interface ClubLoadingWrapperProps {
  children: ReactNode;
  loadingMessage?: string;
}

export const ClubLoadingWrapper: React.FC<ClubLoadingWrapperProps> = ({
  children,
  loadingMessage = 'Loading clubs data...'
}) => {
  const { loading, selectedClub } = useClub();

  if (loading && !selectedClub) {
    return <LoadingSpinner message={loadingMessage} />;
  }

  if (loading && selectedClub) {
    return <LoadingSpinner message="Loading club data..." />;
  }

  return <>{children}</>;
};
