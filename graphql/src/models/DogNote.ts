import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID } from 'type-graphql';
import { Dog } from './Dog';
import { SetDogNote } from './SetDogNote';

@ObjectType()
@Entity()
export class DogNote {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column('text')
  content: string;

  @Field(() => ID)
  @Column('uuid')
  dogId: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => Dog)
  @ManyToOne(() => Dog, dog => dog.notes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dogId' })
  dog: Dog;

  @Field(() => [SetDogNote], { nullable: true })
  @OneToMany(() => SetDogNote, (setDogNote) => setDogNote.dogNote)
  setDogNotes: SetDogNote[];
}