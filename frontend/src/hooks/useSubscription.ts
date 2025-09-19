import { useSubscription } from '@apollo/client';
import {
  CLUB_CHANGED_SUBSCRIPTION,
  CLUB_BY_ID_SUBSCRIPTION,
  DOG_CHANGED_SUBSCRIPTION,
  PRACTICE_DOG_NOTE_CHANGED_SUBSCRIPTION,
  PRACTICE_SET_RATING_CHANGED_SUBSCRIPTION,
  HANDLER_CHANGED_SUBSCRIPTION,
  LOCATION_CHANGED_SUBSCRIPTION,
  PRACTICE_SUMMARY_CHANGED_SUBSCRIPTION,
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
  PracticeSummaryChangedSubscription,
  PracticeSummaryChangedSubscriptionVariables,
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
      skip: options?.skip ?? false,
      onError: options?.onError || ((error: Error) => {
        console.error('Club subscription error:', error);
      }),
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
      skip: options?.skip ?? !clubId,
      onError: options?.onError || ((error: Error) => {
        console.error('Club by ID subscription error:', error);
      }),
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
      skip: options?.skip ?? !clubId,
      onError: options?.onError || ((error: Error) => {
        console.error('Dog subscription error:', error);
      }),
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
      skip: options?.skip ?? !clubId,
      onError: options?.onError || ((error: Error) => {
        console.error('Handler subscription error:', error);
      }),
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
      skip: options?.skip ?? !clubId,
      onError: options?.onError || ((error: Error) => {
        console.error('Location subscription error:', error);
      }),
    }
  );
}

export function usePracticeSummaryChangedSubscription(
  clubId?: string,
  options?: {
    onError?: (error: Error) => void;
    skip?: boolean;
  }
) {
  return useSubscription<PracticeSummaryChangedSubscription, PracticeSummaryChangedSubscriptionVariables>(
    PRACTICE_SUMMARY_CHANGED_SUBSCRIPTION,
    {
      variables: clubId ? { clubId } : undefined,
      skip: options?.skip ?? !clubId,
      onError: options?.onError || ((error: Error) => {
        console.error('Practice summary subscription error:', error);
      }),
    }
  );
}

export function usePracticeDogNoteChangedSubscription(
  practiceId?: string,
  options?: {
    onError?: (error: Error) => void;
    skip?: boolean;
  }
) {
  return useSubscription(
    PRACTICE_DOG_NOTE_CHANGED_SUBSCRIPTION,
    {
      variables: practiceId ? { practiceId } : undefined,
      skip: options?.skip ?? !practiceId,
      onError: options?.onError || ((error: Error) => {
        console.error('Practice dog note subscription error:', error);
      }),
    }
  );
}

export function usePracticeSetRatingChangedSubscription(
  practiceId?: string,
  options?: {
    onError?: (error: Error) => void;
    skip?: boolean;
  }
) {
  return useSubscription(
    PRACTICE_SET_RATING_CHANGED_SUBSCRIPTION,
    {
      variables: practiceId ? { practiceId } : undefined,
      skip: options?.skip ?? !practiceId,
      onError: options?.onError || ((error: Error) => {
        console.error('Practice set rating subscription error:', error);
      }),
    }
  );
}
