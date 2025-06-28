import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from 'type-graphql';
import { Practice } from './Practice';
import { Dog } from './Dog';

export enum AttendanceStatus {
  Attending = 'Attending',
  NotAttending = 'NotAttending',
  Unknown = 'Unknown'
}

registerEnumType(AttendanceStatus, {
  name: 'AttendanceStatus',
  description: 'The attendance status of a dog for a practice'
});

@ObjectType()
@Entity('practice_attendances')
export class PracticeAttendance {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID)
  @Column('uuid')
  practiceId: string;

  @Field(() => ID)
  @Column('uuid')
  dogId: string;

  @Field(() => AttendanceStatus)
  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.Unknown
  })
  attending: AttendanceStatus;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => Practice)
  @ManyToOne(() => Practice, practice => practice.attendances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'practiceId' })
  practice: Practice;

  @Field(() => Dog)
  @ManyToOne(() => Dog)
  @JoinColumn({ name: 'dogId' })
  dog: Dog;
}
