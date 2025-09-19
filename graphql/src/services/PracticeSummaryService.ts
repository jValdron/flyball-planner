import { AppDataSource } from '../db'
import { Practice } from '../models/Practice'
import { AttendanceStatus } from '../models/PracticeAttendance'
import { Dog, DogStatus } from '../models/Dog'
import { PracticeSummary } from '../types/SubscriptionTypes'

export class PracticeSummaryService {
  private static practiceRepository = AppDataSource.getRepository(Practice);
  private static dogRepository = AppDataSource.getRepository(Dog);

  static async createPracticeSummary(practice: Practice): Promise<PracticeSummary> {
    const attendances = practice.attendances || [];
    const sets = practice.sets || [];

    const allActiveDogs = await this.dogRepository.find({
      where: {
        clubId: practice.clubId,
        status: DogStatus.Active
      }
    });

    const activeDogIds = new Set(allActiveDogs.map(dog => dog.id));
    const activeAttendances = attendances.filter(a => activeDogIds.has(a.dogId));

    const attendanceMap = new Map(
      activeAttendances.map(a => [a.dogId, a.attending])
    );

    const attendingCount = activeAttendances.filter(a => a.attending === AttendanceStatus.Attending).length;
    const notAttendingCount = activeAttendances.filter(a => a.attending === AttendanceStatus.NotAttending).length;

    const unconfirmedCount = allActiveDogs.filter(dog => {
      const attendance = attendanceMap.get(dog.id);
      return !attendance || attendance === AttendanceStatus.Unknown;
    }).length;

    return {
      id: practice.id,
      clubId: practice.clubId,
      scheduledAt: practice.scheduledAt,
      status: practice.status,
      setsCount: sets.length,
      attendingCount,
      notAttendingCount,
      unconfirmedCount,
      plannedBy: practice.plannedBy,
    };
  }

  static async createPracticeSummaryById(practiceId: string): Promise<PracticeSummary | null> {
    const practice = await this.practiceRepository.findOne({
      where: { id: practiceId },
      relations: ['attendances', 'sets', 'plannedBy']
    });

    if (!practice) {
      return null;
    }

    return this.createPracticeSummary(practice);
  }
}