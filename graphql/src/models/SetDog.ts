import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID } from 'type-graphql';
import { Set } from './Set';
import { Dog } from './Dog';

@ObjectType()
@Entity('set_dogs')
export class SetDog {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID)
  @Column('uuid')
  setId: string;

  @Field(() => ID)
  @Column('uuid')
  dogId: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => Set)
  @ManyToOne(() => Set, set => set.setDogs)
  @JoinColumn({ name: 'setId' })
  set: Set;

  @Field(() => Dog)
  @ManyToOne(() => Dog)
  @JoinColumn({ name: 'dogId' })
  dog: Dog;
}
