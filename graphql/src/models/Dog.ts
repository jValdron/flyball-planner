import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ObjectType, Field, ID, Int, registerEnumType } from 'type-graphql';
import { Handler } from './Handler';
import { Club } from './Club';
import { DogNote } from './DogNote';

export enum DogStatus {
  Active = 'Active',
  Inactive = 'Inactive'
}

export enum TrainingLevel {
  Beginner = 1,
  Novice = 2,
  Intermediate = 3,
  Advanced = 4,
  Solid = 5
}

registerEnumType(DogStatus, {
  name: 'DogStatus',
  description: 'The status of a dog',
});

registerEnumType(TrainingLevel, {
  name: 'TrainingLevel',
  description: 'The training level of a dog',
});

@ObjectType()
@Entity()
export class Dog {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true, unique: true })
  crn: string | null;

  @Field(() => ID)
  @Column('uuid')
  ownerId: string;

  @Field(() => ID)
  @Column('uuid')
  clubId: string;

  @Field(() => TrainingLevel)
  @Column({
    type: 'enum',
    enum: TrainingLevel,
    default: TrainingLevel.Beginner
  })
  trainingLevel: TrainingLevel;

  @Field(() => DogStatus)
  @Column({
    type: 'enum',
    enum: DogStatus,
    default: DogStatus.Active
  })
  status: DogStatus;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => Handler, { nullable: true })
  @ManyToOne(() => Handler, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: Promise<Handler>;

  @Field(() => Club, { nullable: true })
  @ManyToOne(() => Club)
  @JoinColumn({ name: 'clubId' })
  club: Promise<Club>;

  @Field(() => [DogNote])
  @OneToMany(() => DogNote, dogNote => dogNote.dog)
  notes: DogNote[];
}
