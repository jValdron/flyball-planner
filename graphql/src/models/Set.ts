import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from 'type-graphql';
import { Practice } from './Practice';
import { SetDog } from './SetDog';
import { Location } from './Location';
import { Index } from 'typeorm';

export enum SetType {
  Custom = 'Custom',
  FullRuns = 'FullRuns',
  TwoJumpsFlyball = 'TwoJumpsFlyball',
  Snapoffs = 'Snapoffs',
  ReverseSnapoffs = 'ReverseSnapoffs',
  BoxWork = 'BoxWork',
  Restraints = 'Restraints',
  PowerJumping = 'PowerJumping',
  AroundTheWorld = 'AroundTheWorld'
}

registerEnumType(SetType, {
  name: 'SetType',
  description: 'The type of set being performed'
});

@ObjectType()
@Entity()
export class Set {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID)
  @Column('uuid')
  practiceId: string;

  @Field(() => SetType, { nullable: true })
  @Column({
    type: 'enum',
    enum: SetType,
    nullable: true
  })
  type: SetType | null;

  @Field(() => ID)
  @Column('uuid')
  locationId: string;

  @Field()
  @Column()
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
  @ManyToOne(() => Practice, practice => practice.sets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'practiceId' })
  practice: Practice;

  @Field(() => [SetDog])
  @OneToMany(() => SetDog, setDog => setDog.set)
  dogs: SetDog[];

  @Field(() => Location)
  @ManyToOne(() => Location)
  @JoinColumn({ name: 'locationId' })
  location: Location;
}
