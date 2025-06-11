import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ObjectType, Field, ID } from 'type-graphql';
import { Practice } from './Practice';
import { SetDog } from './SetDog';

@ObjectType()
@Entity('sets')
export class Set {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID)
  @Column('uuid')
  practiceId: string;

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
}
