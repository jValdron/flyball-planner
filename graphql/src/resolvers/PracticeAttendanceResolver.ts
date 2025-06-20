import { Resolver, Query, Mutation, Arg } from 'type-graphql';
import { PracticeAttendance, AttendanceStatus } from '../models/PracticeAttendance';
import { AppDataSource } from '../db';
import { InputType, Field, ID } from 'type-graphql';
import { PubSubService, SubscriptionEvents } from '../services/PubSubService';
import { PracticeSummaryService } from '../services/PracticeSummaryService';
import { Practice } from '../models/Practice';

@InputType()
class AttendanceUpdate {
  @Field(() => ID)
  dogId: string;

  @Field(() => AttendanceStatus)
  attending: AttendanceStatus;
}

@Resolver(PracticeAttendance)
export class PracticeAttendanceResolver {
  private practiceAttendanceRepository = AppDataSource.getRepository(PracticeAttendance);
  private practiceRepository = AppDataSource.getRepository(Practice);

  @Query(() => [PracticeAttendance])
  async practiceAttendances(@Arg('practiceId') practiceId: string): Promise<PracticeAttendance[]> {
    return await this.practiceAttendanceRepository.find({
      where: { practiceId },
      relations: ['practice', 'dog', 'dog.owner']
    });
  }

  @Mutation(() => [PracticeAttendance])
  async updateAttendances(
    @Arg('practiceId') practiceId: string,
    @Arg('updates', () => [AttendanceUpdate]) updates: AttendanceUpdate[]
  ): Promise<PracticeAttendance[]> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updatedAttendances: PracticeAttendance[] = [];

      for (const update of updates) {
        let attendance = await queryRunner.manager.findOne(PracticeAttendance, {
          where: { practiceId, dogId: update.dogId }
        });

        if (attendance) {
          attendance.attending = update.attending;
        } else {
          attendance = queryRunner.manager.create(PracticeAttendance, {
            practiceId,
            dogId: update.dogId,
            attending: update.attending
          });
        }

        const savedAttendance = await queryRunner.manager.save(attendance);
        updatedAttendances.push(savedAttendance);
      }

      await queryRunner.commitTransaction();

      for (const attendance of updatedAttendances) {
        await PubSubService.publishPracticeAttendanceEvent(SubscriptionEvents.PRACTICE_ATTENDANCE_UPDATED, attendance);
      }

      const summary = await PracticeSummaryService.createPracticeSummaryById(practiceId);
      if (summary) {
        await PubSubService.publishPracticeSummaryEvent(SubscriptionEvents.PRACTICE_ATTENDANCE_UPDATED, summary);
      }

      return updatedAttendances;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
