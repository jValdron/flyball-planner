import { ObjectType, Field } from 'type-graphql';
import { Club } from '../models/Club';
import { Dog } from '../models/Dog';
import { Handler } from '../models/Handler';
import { Location } from '../models/Location';

@ObjectType()
export class ClubEvent {
  @Field(() => Club)
  club!: Club;
}

@ObjectType()
export class DogEvent {
  @Field(() => Dog)
  dog!: Dog;
}

@ObjectType()
export class HandlerEvent {
  @Field(() => Handler)
  handler!: Handler;
}

@ObjectType()
export class LocationEvent {
  @Field(() => Location)
  location!: Location;
}