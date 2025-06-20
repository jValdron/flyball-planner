import { ObjectType, Field, registerEnumType } from 'type-graphql';
import { Club } from '../models/Club';
import { Dog } from '../models/Dog';
import { Handler } from '../models/Handler';
import { Location } from '../models/Location';

export enum EventType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED'
}

registerEnumType(EventType, {
  name: 'EventType',
  description: 'The type of event that occurred',
});

@ObjectType()
export class ClubEvent {
  @Field(() => Club)
  club!: Club;

  @Field(() => EventType)
  eventType!: EventType;
}

@ObjectType()
export class DogEvent {
  @Field(() => Dog)
  dog!: Dog;

  @Field(() => EventType)
  eventType!: EventType;
}

@ObjectType()
export class HandlerEvent {
  @Field(() => Handler)
  handler!: Handler;

  @Field(() => EventType)
  eventType!: EventType;
}

@ObjectType()
export class LocationEvent {
  @Field(() => Location)
  location!: Location;

  @Field(() => EventType)
  eventType!: EventType;
}
