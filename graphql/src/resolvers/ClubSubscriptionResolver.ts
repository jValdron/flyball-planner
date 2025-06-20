import { Resolver, Subscription, Root, Arg } from 'type-graphql';
import { ClubEvent, DogEvent, HandlerEvent, LocationEvent } from '../types/SubscriptionTypes';
import { pubsub, SubscriptionEvents } from '../services/PubSubService';

@Resolver()
export class ClubSubscriptionResolver {
  @Subscription(() => ClubEvent, {
    topics: [SubscriptionEvents.CLUB_CREATED, SubscriptionEvents.CLUB_UPDATED, SubscriptionEvents.CLUB_DELETED]
  })
  clubChanged(@Root() payload: ClubEvent): ClubEvent {
    return payload;
  }

  @Subscription(() => DogEvent, {
    topics: [SubscriptionEvents.DOG_CREATED, SubscriptionEvents.DOG_UPDATED, SubscriptionEvents.DOG_DELETED]
  })
  dogChanged(
    @Root() payload: DogEvent,
    @Arg('clubId', { nullable: true }) clubId?: string
  ): DogEvent {
    return payload;
  }

  @Subscription(() => HandlerEvent, {
    topics: [SubscriptionEvents.HANDLER_CREATED, SubscriptionEvents.HANDLER_UPDATED, SubscriptionEvents.HANDLER_DELETED]
  })
  handlerChanged(
    @Root() payload: HandlerEvent,
    @Arg('clubId', { nullable: true }) clubId?: string
  ): HandlerEvent {
    return payload;
  }

  @Subscription(() => ClubEvent, {
    topics: [SubscriptionEvents.CLUB_CREATED, SubscriptionEvents.CLUB_UPDATED, SubscriptionEvents.CLUB_DELETED]
  })
  clubById(
    @Root() payload: ClubEvent,
    @Arg('clubId', { nullable: true }) clubId?: string
  ): ClubEvent {
    return payload;
  }

  @Subscription(() => LocationEvent, {
    topics: [SubscriptionEvents.LOCATION_CREATED, SubscriptionEvents.LOCATION_UPDATED, SubscriptionEvents.LOCATION_DELETED]
  })
  locationChanged(
    @Root() payload: LocationEvent,
    @Arg('clubId', { nullable: true }) clubId?: string
  ): LocationEvent {
    return payload;
  }
}
