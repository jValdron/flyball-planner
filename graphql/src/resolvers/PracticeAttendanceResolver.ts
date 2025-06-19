import { Resolver, Query, Mutation, Arg } from 'type-graphql';
import { PracticeAttendance, AttendanceStatus } from '../models/PracticeAttendance';
import { AppDataSource } from '../db';
import { InputType, Field, ID } from 'type-graphql';

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
          // Update existing record
          attendance.attending = update.attending;
        } else {
          // Create new record
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
      return updatedAttendances;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
