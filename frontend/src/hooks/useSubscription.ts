import { useSubscription } from '@apollo/client';
import {
  CLUB_CHANGED_SUBSCRIPTION,
  CLUB_BY_ID_SUBSCRIPTION,
  DOG_CHANGED_SUBSCRIPTION,
  HANDLER_CHANGED_SUBSCRIPTION,
  LOCATION_CHANGED_SUBSCRIPTION,
} from '../graphql/subscriptions';
import type {
  ClubChangedSubscription,
  ClubChangedSubscriptionVariables,
  ClubByIdSubscription,
  ClubByIdSubscriptionVariables,
  DogChangedSubscription,
  DogChangedSubscriptionVariables,
  HandlerChangedSubscription,
  HandlerChangedSubscriptionVariables,
  LocationChangedSubscription,
  LocationChangedSubscriptionVariables,
} from '../graphql/generated/graphql';

export function useClubChangedSubscription(
  options?: {
    onError?: (error: Error) => void;
    skip?: boolean;
  }
) {
  return useSubscription<ClubChangedSubscription, ClubChangedSubscriptionVariables>(
    CLUB_CHANGED_SUBSCRIPTION,
    {
      skip: options?.skip,
      onError: options?.onError,
    }
  );
}

export function useClubByIdSubscription(
  clubId?: string,
  options?: {
    onError?: (error: Error) => void;
    skip?: boolean;
  }
) {
  return useSubscription<ClubByIdSubscription, ClubByIdSubscriptionVariables>(
    CLUB_BY_ID_SUBSCRIPTION,
    {
      variables: clubId ? { clubId } : undefined,
      skip: options?.skip || !clubId,
      onError: options?.onError,
    }
  );
}

export function useDogChangedSubscription(
  clubId?: string,
  options?: {
    onError?: (error: Error) => void;
    skip?: boolean;
  }
) {
  return useSubscription<DogChangedSubscription, DogChangedSubscriptionVariables>(
    DOG_CHANGED_SUBSCRIPTION,
    {
      variables: clubId ? { clubId } : undefined,
      skip: options?.skip,
      onError: options?.onError,
    }
  );
}

export function useHandlerChangedSubscription(
  clubId?: string,
  options?: {
    onError?: (error: Error) => void;
    skip?: boolean;
  }
) {
  return useSubscription<HandlerChangedSubscription, HandlerChangedSubscriptionVariables>(
    HANDLER_CHANGED_SUBSCRIPTION,
    {
      variables: clubId ? { clubId } : undefined,
      skip: options?.skip,
      onError: options?.onError,
    }
  );
}

export function useLocationChangedSubscription(
  clubId?: string,
  options?: {
    onError?: (error: Error) => void;
    skip?: boolean;
  }
) {
  return useSubscription<LocationChangedSubscription, LocationChangedSubscriptionVariables>(
    LOCATION_CHANGED_SUBSCRIPTION,
    {
      variables: clubId ? { clubId } : undefined,
      skip: options?.skip,
      onError: options?.onError,
    }
  );
}