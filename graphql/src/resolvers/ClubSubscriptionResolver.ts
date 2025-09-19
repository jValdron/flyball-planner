import { Resolver, Subscription, Root, Arg, UseMiddleware, Ctx } from 'type-graphql'

import { ClubEvent, DogEvent, HandlerEvent, LocationEvent } from '../types/SubscriptionTypes'
import { isAuth } from '../middleware/auth'
import { SubscriptionEvents } from '../services/PubSubService'

// Helper functions for subscription filters
const createClubFilter = (user: any, clubId: string) => {
  if (!user || !user.clubIds) return false;
  return user.clubIds.includes(clubId);
};

const createEntityClubFilter = (user: any, entityClubId: string, specifiedClubId?: string) => {
  if (!user || !user.clubIds) return false;

  // If clubId is specified, check that user is member of that club and entity matches
  if (specifiedClubId) {
    return user.clubIds.includes(specifiedClubId) && entityClubId === specifiedClubId;
  }

  // Otherwise, check that user is member of the entity's club
  return user.clubIds.includes(entityClubId);
};

@Resolver()
export class ClubSubscriptionResolver {
  @Subscription(() => ClubEvent, {
    topics: [SubscriptionEvents.CLUB_CREATED, SubscriptionEvents.CLUB_UPDATED, SubscriptionEvents.CLUB_DELETED],
    filter: ({ payload, context }) => {
      return createClubFilter(context.user, payload.club.id);
    }
  })
  @UseMiddleware(isAuth)
  clubChanged(@Root() payload: ClubEvent): ClubEvent {
    return payload;
  }

  @Subscription(() => DogEvent, {
    topics: [SubscriptionEvents.DOG_CREATED, SubscriptionEvents.DOG_UPDATED, SubscriptionEvents.DOG_DELETED],
    filter: ({ payload, context, args }) => {
      return createEntityClubFilter(context.user, payload.dog.clubId, args.clubId);
    }
  })
  @UseMiddleware(isAuth)
  dogChanged(
    @Root() payload: DogEvent,
    @Arg('clubId', { nullable: true }) clubId?: string
  ): DogEvent {
    return payload;
  }

  @Subscription(() => HandlerEvent, {
    topics: [SubscriptionEvents.HANDLER_CREATED, SubscriptionEvents.HANDLER_UPDATED, SubscriptionEvents.HANDLER_DELETED],
    filter: ({ payload, context, args }) => {
      return createEntityClubFilter(context.user, payload.handler.clubId, args.clubId);
    }
  })
  @UseMiddleware(isAuth)
  handlerChanged(
    @Root() payload: HandlerEvent,
    @Arg('clubId', { nullable: true }) clubId?: string
  ): HandlerEvent {
    return payload;
  }

  @Subscription(() => ClubEvent, {
    topics: [SubscriptionEvents.CLUB_CREATED, SubscriptionEvents.CLUB_UPDATED, SubscriptionEvents.CLUB_DELETED],
    filter: ({ payload, context, args }) => {
      return createEntityClubFilter(context.user, payload.club.id, args.clubId);
    }
  })
  @UseMiddleware(isAuth)
  clubById(
    @Root() payload: ClubEvent,
    @Arg('clubId', { nullable: true }) clubId?: string
  ): ClubEvent {
    return payload;
  }

  @Subscription(() => LocationEvent, {
    topics: [SubscriptionEvents.LOCATION_CREATED, SubscriptionEvents.LOCATION_UPDATED, SubscriptionEvents.LOCATION_DELETED],
    filter: ({ payload, context, args }) => {
      return createEntityClubFilter(context.user, payload.location.clubId, args.clubId);
    }
  })
  @UseMiddleware(isAuth)
  locationChanged(
    @Root() payload: LocationEvent,
    @Arg('clubId', { nullable: true }) clubId?: string
  ): LocationEvent {
    return payload;
  }
}
