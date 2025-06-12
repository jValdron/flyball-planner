import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from 'type-graphql';
import { Practice } from './Practice';
import { SetDog } from './SetDog';
import { Location } from './Location';
import { Index } from 'typeorm';

export enum SetType {
  Custom = 'Custom',
  FullRuns = 'Full Runs',
  TwoJumpsFlyball = 'Two Jumps Flyball',
  Snapoffs = 'Snapoffs',
  ReverseSnapoffs = 'Reverse Snapoffs',
  BoxWork = 'Box Work',
  Restraints = 'Restraints',
  PowerJumping = 'Power Jumping',
  AroundTheWorld = 'Around the World'
}

registerEnumType(SetType, {
  name: 'SetType',
  description: 'The type of set being performed'
});

@ObjectType()
@Entity('sets')
export class Set {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID)
  @Column('uuid')
  practiceId: string;

  @Field(() => SetType)
  @Column({
    type: 'enum',
    enum: SetType,
    default: SetType.Custom
  })
  type: SetType;

  @Field(() => ID)
  @Column('uuid')
  locationId: string;

  @Field()
  @Column()
  @Index('IDX_set_practice_location_index', { unique: true })
  index: number;

  @Field(() => String, { nullable: true })
  @Column({
    type: 'text',
    nullable: true
  })
  typeCustom: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    type: 'text',
    nullable: true
  })
  notes: string | null;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => Practice)
  @ManyToOne(() => Practice, practice => practice.sets)
  @JoinColumn({ name: 'practiceId' })
  practice: Practice;

  @Field(() => [SetDog])
  @OneToMany(() => SetDog, setDog => setDog.set)
  setDogs: SetDog[];

  @Field(() => Location)
  @ManyToOne(() => Location)
  @JoinColumn({ name: 'locationId' })
  location: Location;
}
