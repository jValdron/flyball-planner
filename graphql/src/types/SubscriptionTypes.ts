import { ObjectType, Field, registerEnumType } from 'type-graphql';
import { Club } from '../models/Club';
import { Dog } from '../models/Dog';
import { Handler } from '../models/Handler';
import { Location } from '../models/Location';
import { Practice, PracticeStatus } from '../models/Practice';
import { PracticeAttendance } from '../models/PracticeAttendance';
import { Set as SetModel } from '../models/Set';

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

@ObjectType()
export class PracticeEvent {
  @Field(() => Practice)
  practice!: Practice;

  @Field(() => EventType)
  eventType!: EventType;
}

@ObjectType()
export class PracticeAttendanceEvent {
  @Field(() => PracticeAttendance)
  attendance!: PracticeAttendance;

  @Field(() => EventType)
  eventType!: EventType;
}

@ObjectType()
export class PracticeSetEvent {
  @Field(() => SetModel)
  set!: SetModel;

  @Field(() => EventType)
  eventType!: EventType;
}

@ObjectType()
export class PracticeSummary {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  clubId!: string;

  @Field(() => Date)
  scheduledAt!: Date;

  @Field(() => PracticeStatus)
  status!: PracticeStatus;

  @Field(() => Number)
  setsCount!: number;

  @Field(() => Number)
  attendingCount!: number;

  @Field(() => Number)
  notAttendingCount!: number;

  @Field(() => Number)
  unconfirmedCount!: number;
}

@ObjectType()
export class PracticeSummaryEvent {
  @Field(() => PracticeSummary)
  practice!: PracticeSummary;

  @Field(() => EventType)
  eventType!: EventType;
}

@ObjectType()
export class PracticeDogNoteEvent {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  content!: string;

  @Field(() => String)
  practiceId!: string;

  @Field(() => String)
  setId!: string;

  @Field(() => [String])
  dogIds!: string[];

  @Field(() => EventType)
  eventType!: EventType;
}

@ObjectType()
export class PracticeDogNote {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  content!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  @Field(() => String)
  setId!: string;

  @Field(() => [String])
  dogIds!: string[];
}
