import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { ObjectType, Field, ID } from 'type-graphql'

import { Club } from './Club'

@ObjectType()
@Entity()
export class Location {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID)
  @Column('uuid')
  clubId: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ default: false })
  isDefault: boolean;

  @Field()
  @Column({ default: true })
  isDoubleLane: boolean;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => Club, { nullable: true })
  @ManyToOne(() => Club)
  @JoinColumn({ name: 'clubId' })
  club?: Promise<Club>;
}
