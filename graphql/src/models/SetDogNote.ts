import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID } from 'type-graphql';
import { SetDog } from './SetDog';
import { DogNote } from './DogNote';

@ObjectType()
@Entity()
export class SetDogNote {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID)
  @Column('uuid')
  setDogId: string;

  @Field(() => ID)
  @Column('uuid')
  dogNoteId: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => SetDog)
  @ManyToOne(() => SetDog, setDog => setDog.setDogNotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'setDogId' })
  setDog: SetDog;

  @Field(() => DogNote)
  @ManyToOne(() => DogNote, dogNote => dogNote.setDogNotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dogNoteId' })
  dogNote: DogNote;
}
