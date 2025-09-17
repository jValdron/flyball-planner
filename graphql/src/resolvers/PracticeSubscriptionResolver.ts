import { Resolver, Subscription, Root, Arg, UseMiddleware } from 'type-graphql';
import { PracticeEvent, PracticeSummaryEvent, PracticeAttendanceEvent, PracticeSetEvent, PracticeDogNoteEvent } from '../types/SubscriptionTypes';
import { SubscriptionEvents } from '../services/PubSubService';
import { AuthContext, isAuth } from '../middleware/auth';

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

@Resolver()
export class PracticeSubscriptionResolver {
  @Subscription(() => PracticeSummaryEvent, {
    topics: [SubscriptionEvents.PRACTICE_SUMMARY_CREATED, SubscriptionEvents.PRACTICE_SUMMARY_UPDATED, SubscriptionEvents.PRACTICE_SUMMARY_DELETED, SubscriptionEvents.PRACTICE_ATTENDANCE_UPDATED, SubscriptionEvents.PRACTICE_SET_UPDATED, SubscriptionEvents.PRACTICE_SET_DELETED],
    filter: ({ payload, context, args }) => {
      return createPracticeClubFilter(context.user, payload.practice.clubId, args.clubId);
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
      return payload.practice &&
             payload.practice.id === args.practiceId &&
             createPracticeFilter(context.user, args.practiceId, payload.practice.clubId);
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
      return payload.attendance && payload.attendance.practiceId === args.practiceId;
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
      return payload.set && payload.set.practiceId === args.practiceId;
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
      return payload.practiceId === args.practiceId;
    }
  })
  @UseMiddleware(isAuth)
  practiceDogNoteChanged(
    @Root() payload: PracticeDogNoteEvent,
    @Arg('practiceId') practiceId: string
  ): PracticeDogNoteEvent {
    return payload;
  }
}
