import { PubSub } from 'graphql-subscriptions';

export enum SubscriptionEvents {
  CLUB_CREATED = 'CLUB_CREATED',
  CLUB_UPDATED = 'CLUB_UPDATED',
  CLUB_DELETED = 'CLUB_DELETED',
  DOG_CREATED = 'DOG_CREATED',
  DOG_UPDATED = 'DOG_UPDATED',
  DOG_DELETED = 'DOG_DELETED',
  HANDLER_CREATED = 'HANDLER_CREATED',
  HANDLER_UPDATED = 'HANDLER_UPDATED',
  HANDLER_DELETED = 'HANDLER_DELETED',
  LOCATION_CREATED = 'LOCATION_CREATED',
  LOCATION_UPDATED = 'LOCATION_UPDATED',
  LOCATION_DELETED = 'LOCATION_DELETED',

  PRACTICE_CREATED = 'PRACTICE_CREATED',
  PRACTICE_UPDATED = 'PRACTICE_UPDATED',
  PRACTICE_DELETED = 'PRACTICE_DELETED',
  PRACTICE_ATTENDANCE_UPDATED = 'PRACTICE_ATTENDANCE_UPDATED',
  PRACTICE_SET_CREATED = 'PRACTICE_SET_CREATED',
  PRACTICE_SET_UPDATED = 'PRACTICE_SET_UPDATED',
  PRACTICE_SET_DELETED = 'PRACTICE_SET_DELETED',
}

export const pubsub = new PubSub();

export class PubSubService {
  static async publish<T>(event: SubscriptionEvents, payload: T): Promise<void> {
    await pubsub.publish(event, payload);
  }

  static async publishClubEvent(event: SubscriptionEvents, club: any): Promise<void> {
    await this.publish(event, { club });
  }

  static async publishDogEvent(event: SubscriptionEvents, dog: any): Promise<void> {
    await this.publish(event, { dog });
  }

  static async publishHandlerEvent(event: SubscriptionEvents, handler: any): Promise<void> {
    await this.publish(event, { handler });
  }

  static async publishLocationEvent(event: SubscriptionEvents, location: any): Promise<void> {
    await this.publish(event, { location });
  }

  static async publishPracticeEvent(event: SubscriptionEvents, practice: any): Promise<void> {
    await this.publish(event, { practice });
  }

  static async publishPracticeAttendanceEvent(event: SubscriptionEvents, attendance: any): Promise<void> {
    await this.publish(event, { attendance });
  }

  static async publishPracticeSetEvent(event: SubscriptionEvents, practiceSet: any): Promise<void> {
    await this.publish(event, { practiceSet });
  }
}