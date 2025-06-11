import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ObjectType, Field, ID } from 'type-graphql';
import { Dog } from './Dog';

@ObjectType()
@Entity('owners')
export class Owner {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => [Dog])
  @OneToMany(() => Dog, dog => dog.owner)
  dogs: Dog[];
}
