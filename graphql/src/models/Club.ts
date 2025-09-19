import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm'
import { ObjectType, Field, ID } from 'type-graphql'

import { Dog } from './Dog'
import { Handler } from './Handler'
import { Location } from './Location'
import { User } from './User'
import { UserInvite } from './UserInvite'

@ObjectType()
@Entity()
export class Club {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  nafaClubNumber: string;

  @Field({ description: 'Default practice time in 24-hour format (HH:mm)' })
  @Column()
  defaultPracticeTime: string;

  @Field({ description: 'Ideal number of sets per dog for this club' })
  @Column({ type: 'int', default: 2 })
  idealSetsPerDog: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => [Dog])
  @OneToMany(() => Dog, dog => dog.club)
  dogs: Dog[];

  @Field(() => [Handler])
  @OneToMany(() => Handler, handler => handler.club)
  handlers: Handler[];

  @Field(() => [Location])
  @OneToMany(() => Location, location => location.club)
  locations: Location[];

  @Field(() => [User])
  @ManyToMany(() => User, user => user.clubs)
  @JoinTable({ name: 'user_clubs_club' })
  users: User[];

  @Field(() => [UserInvite])
  @OneToMany(() => UserInvite, invite => invite.club)
  userInvites: UserInvite[];
}
