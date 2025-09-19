import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { ObjectType, Field, ID } from 'type-graphql'

import { Club } from './Club'
import { User } from './User'

@ObjectType()
@Entity()
export class UserInvite {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  code: string;

  @Field()
  @Column()
  email: string;

  @Field()
  @Column()
  clubId: string;

  @Field(() => Club)
  @ManyToOne(() => Club, { eager: true })
  @JoinColumn({ name: 'clubId' })
  club: Club;

  @Field({ nullable: true })
  @Column({ nullable: true })
  invitedById: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'invitedById' })
  invitedBy: User;

  @Field()
  @Column()
  expiresAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  usedAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  usedById: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'usedById' })
  usedBy: User;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  // Computed fields
  @Field()
  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  @Field()
  get isUsed(): boolean {
    return this.usedAt !== null;
  }

  @Field()
  get isValid(): boolean {
    return !this.isExpired && !this.isUsed;
  }
}
