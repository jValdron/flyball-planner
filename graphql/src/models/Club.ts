import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ObjectType, Field, ID } from 'type-graphql';
import { Dog } from './Dog';
import { Practice } from './Practice';

@ObjectType()
@Entity('clubs')
export class Club {
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
  @OneToMany(() => Dog, dog => dog.club)
  dogs: Dog[];

  @Field(() => [Practice])
  @OneToMany(() => Practice, practice => practice.club)
  practices: Practice[];
}
