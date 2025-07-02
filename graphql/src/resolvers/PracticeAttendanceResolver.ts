import { Resolver, Query, Mutation, Arg, UseMiddleware, Ctx } from 'type-graphql';
import { PracticeAttendance, AttendanceStatus } from '../models/PracticeAttendance';
import { AppDataSource } from '../db';
import { InputType, Field, ID } from 'type-graphql';
import { PubSubService, SubscriptionEvents } from '../services/PubSubService';
import { PracticeSummaryService } from '../services/PracticeSummaryService';
import { Practice } from '../models/Practice';
import { AuthContext, isAuth, createClubFilter } from '../middleware/auth';

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
  @UseMiddleware(isAuth)
  async practiceAttendances(@Arg('practiceId') practiceId: string, @Ctx() { user }: AuthContext): Promise<PracticeAttendance[]> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) return [];

    // Check that the practice belongs to user's club
    const practice = await this.practiceRepository.findOne({
      where: {
        id: practiceId,
        ...clubFilter
      }
    });
    if (!practice) return [];

    return await this.practiceAttendanceRepository.find({
      where: { practiceId },
      relations: ['practice', 'dog', 'dog.owner']
    });
  }

  @Mutation(() => [PracticeAttendance])
  @UseMiddleware(isAuth)
  async updateAttendances(
    @Arg('practiceId') practiceId: string,
    @Arg('updates', () => [AttendanceUpdate]) updates: AttendanceUpdate[],
    @Ctx() { user }: AuthContext
  ): Promise<PracticeAttendance[]> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) {
      throw new Error('Access denied: You are not a member of any clubs');
    }

    // Check that the practice belongs to user's club
    const practice = await this.practiceRepository.findOne({
      where: {
        id: practiceId,
        ...clubFilter
      }
    });
    if (!practice) {
      throw new Error('Access denied: Practice not found or you do not have access to it');
    }

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
