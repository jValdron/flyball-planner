import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID } from 'type-graphql';
import { Dog } from './Dog';
import { Club } from './Club';

@ObjectType()
@Entity('handlers')
export class Handler {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  givenName: string;

  @Field()
  @Column()
  surname: string;

  @Field(() => ID)
  @Column()
  clubId: string;

  @Field(() => Club, { nullable: true })
  @ManyToOne(() => Club)
  @JoinColumn({ name: 'clubId' })
  club: Club;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => [Dog], { nullable: true })
  @OneToMany(() => Dog, dog => dog.owner, { cascade: true })
  dogs: Dog[] | null;
}
