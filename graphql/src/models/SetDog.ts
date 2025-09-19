import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm'
import { ObjectType, Field, ID, registerEnumType } from 'type-graphql'

import { Set } from './Set'
import { Dog } from './Dog'
import { SetDogNote } from './SetDogNote'

export enum Lane {
  Left = 'Left',
  Right = 'Right'
}

registerEnumType(Lane, {
  name: 'Lane',
  description: 'The lane that the set is being performed in'
});

@ObjectType()
@Entity()
export class SetDog {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  index: number;

  @Field(() => ID)
  @Column('uuid')
  setId: string;

  @Field(() => ID)
  @Column('uuid')
  dogId: string;

  @Field(() => Lane, { nullable: true })
  @Column({
    type: 'enum',
    enum: Lane,
    default: Lane.Left,
    nullable: true
  })
  lane: Lane;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => Set)
  @ManyToOne(() => Set, set => set.dogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'setId' })
  set: Set;

  @Field(() => Dog)
  @ManyToOne(() => Dog)
  @JoinColumn({ name: 'dogId' })
  dog: Dog;

  @Field(() => [SetDogNote])
  @OneToMany(() => SetDogNote, setDogNote => setDogNote.setDog)
  setDogNotes: SetDogNote[];
}
