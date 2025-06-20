import { Resolver, Subscription, Root, Arg } from 'type-graphql';
import { PracticeEvent, PracticeSummaryEvent, PracticeAttendanceEvent, PracticeSetEvent } from '../types/SubscriptionTypes';
import { SubscriptionEvents } from '../services/PubSubService';

@Resolver()
export class PracticeSubscriptionResolver {
  @Subscription(() => PracticeSummaryEvent, {
    topics: [SubscriptionEvents.PRACTICE_SUMMARY_CREATED, SubscriptionEvents.PRACTICE_SUMMARY_UPDATED, SubscriptionEvents.PRACTICE_SUMMARY_DELETED, SubscriptionEvents.PRACTICE_ATTENDANCE_UPDATED, SubscriptionEvents.PRACTICE_SET_UPDATED, SubscriptionEvents.PRACTICE_SET_DELETED]
  })
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
    filter: ({ payload, args }) => {
      return payload.practice && payload.practice.id === args.practiceId;
    }
  })
  practiceChanged(
    @Root() payload: PracticeEvent,
    @Arg('practiceId') practiceId: string
  ): PracticeEvent {
    return payload;
  }

  @Subscription(() => PracticeAttendanceEvent, {
    topics: [SubscriptionEvents.PRACTICE_ATTENDANCE_UPDATED],
    filter: ({ payload, args }) => {
      return payload.attendance && payload.attendance.practiceId === args.practiceId;
    }
  })
  practiceAttendanceChanged(
    @Root() payload: PracticeAttendanceEvent,
    @Arg('practiceId') practiceId: string
  ): PracticeAttendanceEvent {
    return payload;
  }

  @Subscription(() => PracticeSetEvent, {
    topics: [SubscriptionEvents.PRACTICE_SET_UPDATED, SubscriptionEvents.PRACTICE_SET_DELETED],
    filter: ({ payload, args }) => {
      return payload.set && payload.set.practiceId === args.practiceId;
    }
  })
  practiceSetChanged(
    @Root() payload: PracticeSetEvent,
    @Arg('practiceId') practiceId: string
  ): PracticeSetEvent {
    return payload;
  }
}