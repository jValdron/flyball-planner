import { createPubSub } from '@graphql-yoga/subscription';
import { EventType } from '../types/SubscriptionTypes';

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

export const pubsub = createPubSub();

function getEventType(event: SubscriptionEvents): EventType {
  if (event.includes('_CREATED')) return EventType.CREATED;
  if (event.includes('_UPDATED')) return EventType.UPDATED;
  if (event.includes('_DELETED')) return EventType.DELETED;
  return EventType.UPDATED; // fallback
}

export class PubSubService {
  static async publish<T>(event: SubscriptionEvents, payload: T): Promise<void> {
    try {
      await pubsub.publish(event, payload);
    } catch (error) {
      console.error(`Error publishing event ${event}:`, error);
    }
  }

  static async publishClubEvent(event: SubscriptionEvents, club: any): Promise<void> {
    try {
      await this.publish(event, { club, eventType: getEventType(event) });
    } catch (error) {
      console.error(`Error publishing club event ${event}:`, error);
    }
  }

  static async publishDogEvent(event: SubscriptionEvents, dog: any): Promise<void> {
    try {
      await this.publish(event, { dog, eventType: getEventType(event) });
    } catch (error) {
      console.error(`Error publishing dog event ${event}:`, error);
    }
  }

  static async publishHandlerEvent(event: SubscriptionEvents, handler: any): Promise<void> {
    try {
      await this.publish(event, { handler, eventType: getEventType(event) });
    } catch (error) {
      console.error(`Error publishing handler event ${event}:`, error);
    }
  }

  static async publishLocationEvent(event: SubscriptionEvents, location: any): Promise<void> {
    try {
      await this.publish(event, { location, eventType: getEventType(event) });
    } catch (error) {
      console.error(`Error publishing location event ${event}:`, error);
    }
  }

  static async publishPracticeEvent(event: SubscriptionEvents, practice: any): Promise<void> {
    try {
      await this.publish(event, { practice, eventType: getEventType(event) });
    } catch (error) {
      console.error(`Error publishing practice event ${event}:`, error);
    }
  }

  static async publishPracticeAttendanceEvent(event: SubscriptionEvents, attendance: any): Promise<void> {
    try {
      await this.publish(event, { attendance, eventType: getEventType(event) });
    } catch (error) {
      console.error(`Error publishing practice attendance event ${event}:`, error);
    }
  }

  static async publishPracticeSetEvent(event: SubscriptionEvents, practiceSet: any): Promise<void> {
    try {
      await this.publish(event, { practiceSet, eventType: getEventType(event) });
    } catch (error) {
      console.error(`Error publishing practice set event ${event}:`, error);
    }
  }
}
