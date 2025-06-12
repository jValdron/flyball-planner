import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Int, registerEnumType } from 'type-graphql';
import { Handler } from './Handler';
import { Club } from './Club';

export enum DogStatus {
  Active = 'Active',
  Inactive = 'Inactive'
}

registerEnumType(DogStatus, {
  name: 'DogStatus',
  description: 'The status of a dog',
});

@ObjectType()
@Entity('dogs')
export class Dog {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true, unique: true })
  crn: string | null;

  @Field(() => ID)
  @Column('uuid')
  ownerId: string;

  @Field(() => ID)
  @Column('uuid')
  clubId: string;

  @Field(() => Int)
  @Column({ type: 'int', default: 1 })
  trainingLevel: number;

  @Field(() => DogStatus)
  @Column({
    type: 'enum',
    enum: DogStatus,
    default: DogStatus.Active
  })
  status: DogStatus;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => Handler)
  @ManyToOne(() => Handler, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: Handler;

  @Field(() => Club)
  @ManyToOne(() => Club)
  @JoinColumn({ name: 'clubId' })
  club: Club;
}
