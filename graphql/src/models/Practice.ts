import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from 'type-graphql';
import { Club } from './Club';
import { PracticeAttendance } from './PracticeAttendance';
import { Set } from './Set';
import { User } from './User';

export enum PracticeStatus {
  Draft = 'Draft',
  Ready = 'Ready'
}

registerEnumType(PracticeStatus, {
  name: 'PracticeStatus',
  description: 'The status of a practice',
});

@ObjectType()
@Entity()
export class Practice {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID)
  @Column('uuid')
  clubId: string;

  @Field(() => ID)
  @Column('uuid')
  plannedById: string;

  @Field()
  @Column({ type: 'timestamp' })
  scheduledAt: Date;

  @Field(() => PracticeStatus)
  @Column({
    type: 'enum',
    enum: PracticeStatus,
    default: PracticeStatus.Draft
  })
  status: PracticeStatus;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => Club)
  @ManyToOne(() => Club)
  @JoinColumn({ name: 'clubId' })
  club: Promise<Club>;

  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'plannedById' })
  plannedBy: User;

  @Field(() => [PracticeAttendance])
  @OneToMany(() => PracticeAttendance, attendance => attendance.practice)
  attendances: PracticeAttendance[];

  @Field(() => [Set])
  @OneToMany(() => Set, set => set.practice)
  sets: Set[];
}
