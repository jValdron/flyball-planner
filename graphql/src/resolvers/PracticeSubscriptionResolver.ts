import { Resolver, Subscription, Root, Arg, UseMiddleware } from 'type-graphql'

import { PracticeEvent, PracticeSummaryEvent, PracticeAttendanceEvent, PracticeSetEvent, PracticeDogNoteEvent, PracticeSetRatingEvent } from '../types/SubscriptionTypes'
import { isAuth } from '../middleware/auth'
import { SubscriptionEvents } from '../services/PubSubService'

// Helper functions for subscription filters
const createPracticeClubFilter = (user: any, practiceClubId: string, specifiedClubId?: string) => {
  if (!user || !user.clubIds) return false;

  // If clubId is specified, check that user is member of that club and practice matches
  if (specifiedClubId) {
    return user.clubIds.includes(specifiedClubId) && practiceClubId === specifiedClubId;
  }

  // Otherwise, check that user is member of the practice's club
  return user.clubIds.includes(practiceClubId);
};

const createPracticeFilter = (user: any, practiceId: string, practiceClubId: string) => {
  if (!user || !user.clubIds) return false;
  return user.clubIds.includes(practiceClubId);
};

const canUserSeePractice = (user: any, practice: any) => {
  if (!user || !user.clubIds) return false;

  if (!user.clubIds.includes(practice.clubId)) return false;

  if (practice.isPrivate) {
    return user.id === practice.plannedById;
  }

  return true;
};

@Resolver()
export class PracticeSubscriptionResolver {
  @Subscription(() => PracticeSummaryEvent, {
    topics: [SubscriptionEvents.PRACTICE_SUMMARY_CREATED, SubscriptionEvents.PRACTICE_SUMMARY_UPDATED, SubscriptionEvents.PRACTICE_SUMMARY_DELETED, SubscriptionEvents.PRACTICE_ATTENDANCE_UPDATED, SubscriptionEvents.PRACTICE_SET_UPDATED, SubscriptionEvents.PRACTICE_SET_DELETED],
    filter: ({ payload, context, args }) => {
      if (!payload?.practice?.clubId) return false;
      if (!createPracticeClubFilter(context.user, payload.practice.clubId, args.clubId)) return false;
      return canUserSeePractice(context.user, payload.practice);
    }
  })
  @UseMiddleware(isAuth)
  practiceSummaryChanged(
    @Root() payload: PracticeSummaryEvent,
    @Arg('clubId') clubId: string
  ): PracticeSummaryEvent | null {
    if (payload.practice.clubId !== clubId) {
      return null;
    }
    return payload;
  }

  @Subscription(() => PracticeEvent, {
    topics: [SubscriptionEvents.PRACTICE_UPDATED],
    filter: ({ payload, context, args }) => {
      if (!payload?.practice?.id || !payload?.practice?.clubId) return false;
      if (payload.practice.id !== args.practiceId || !createPracticeFilter(context.user, args.practiceId, payload.practice.clubId)) return false;
      return canUserSeePractice(context.user, payload.practice);
    }
  })
  @UseMiddleware(isAuth)
  practiceChanged(
    @Root() payload: PracticeEvent,
    @Arg('practiceId') practiceId: string
  ): PracticeEvent {
    return payload;
  }

  @Subscription(() => PracticeAttendanceEvent, {
    topics: [SubscriptionEvents.PRACTICE_ATTENDANCE_UPDATED],
    filter: ({ payload, context, args }) => {
      if (!payload?.attendance?.practiceId) return false;
      if (payload.attendance.practiceId !== args.practiceId) return false;
      if (payload.practice) {
        return canUserSeePractice(context.user, payload.practice);
      }
      return createPracticeFilter(context.user, args.practiceId, payload.attendance.practiceId);
    }
  })
  @UseMiddleware(isAuth)
  practiceAttendanceChanged(
    @Root() payload: PracticeAttendanceEvent,
    @Arg('practiceId') practiceId: string
  ): PracticeAttendanceEvent {
    return payload;
  }

  @Subscription(() => PracticeSetEvent, {
    topics: [SubscriptionEvents.PRACTICE_SET_UPDATED, SubscriptionEvents.PRACTICE_SET_DELETED],
    filter: ({ payload, context, args }) => {
      if (!payload?.set?.practiceId) return false;
      if (payload.set.practiceId !== args.practiceId) return false;
      if (payload.practice) {
        return canUserSeePractice(context.user, payload.practice);
      }
      return createPracticeFilter(context.user, args.practiceId, payload.set.practiceId);
    }
  })
  @UseMiddleware(isAuth)
  practiceSetChanged(
    @Root() payload: PracticeSetEvent,
    @Arg('practiceId') practiceId: string
  ): PracticeSetEvent {
    return payload;
  }

  @Subscription(() => PracticeDogNoteEvent, {
    topics: [SubscriptionEvents.PRACTICE_DOG_NOTE_CREATED, SubscriptionEvents.PRACTICE_DOG_NOTE_UPDATED, SubscriptionEvents.PRACTICE_DOG_NOTE_DELETED],
    filter: ({ payload, context, args }) => {
      if (!payload?.practiceId) return false;
      if (payload.practiceId !== args.practiceId) return false;
      if (payload.practice) {
        return canUserSeePractice(context.user, payload.practice);
      }
      return createPracticeFilter(context.user, args.practiceId, payload.practiceId);
    }
  })
  @UseMiddleware(isAuth)
  practiceDogNoteChanged(
    @Root() payload: PracticeDogNoteEvent,
    @Arg('practiceId') practiceId: string
  ): PracticeDogNoteEvent {
    return payload;
  }

  @Subscription(() => PracticeSetRatingEvent, {
    topics: [SubscriptionEvents.PRACTICE_SET_RATING_UPDATED],
    filter: ({ payload, context, args }) => {
      if (!payload?.practiceId) return false;
      return payload.practiceId === args.practiceId;
    }
  })
  @UseMiddleware(isAuth)
  practiceSetRatingChanged(
    @Root() payload: PracticeSetRatingEvent,
    @Arg('practiceId') practiceId: string
  ): PracticeSetRatingEvent {
    return payload;
  }
}
