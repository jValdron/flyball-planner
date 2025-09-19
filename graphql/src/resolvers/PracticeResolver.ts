import { randomBytes } from 'crypto'

import { Resolver, Query, Mutation, Arg, UseMiddleware, Ctx, InputType, Field, ID } from 'type-graphql'

import { Practice, PracticeStatus } from '../models/Practice'
import { AppDataSource } from '../db'
import { AuthContext, isAuth, hasClubAccess, createClubFilter } from '../middleware/auth'
import { PubSubService, SubscriptionEvents } from '../services/PubSubService'
import { PracticeSummaryService } from '../services/PracticeSummaryService'
import { PracticeSummary } from '../types/SubscriptionTypes'

@Resolver(Practice)
export class PracticeResolver {
  private practiceRepository = AppDataSource.getRepository(Practice);

  private generateShareCode(): string {
    return randomBytes(16).toString('hex');
  }

  @Query(() => [PracticeSummary])
  @UseMiddleware(isAuth, hasClubAccess)
  async practiceSummariesByClub(@Arg('clubId') clubId: string, @Ctx() { user }: AuthContext): Promise<PracticeSummary[]> {
    const practices = await this.practiceRepository
      .createQueryBuilder('practice')
      .leftJoinAndSelect('practice.plannedBy', 'plannedBy')
      .leftJoinAndSelect('practice.attendances', 'attendances')
      .leftJoinAndSelect('practice.sets', 'sets')
      .where('practice.clubId = :clubId', { clubId })
      .andWhere('(practice.isPrivate = false OR practice.plannedById = :userId)', { userId: user?.id })
      .getMany();

    return Promise.all(practices.map(practice => PracticeSummaryService.createPracticeSummary(practice)));
  }

  @Query(() => Practice, { nullable: true })
  @UseMiddleware(isAuth)
  async practice(@Arg('id') id: string, @Ctx() { user }: AuthContext): Promise<Practice | null> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) return null;

    const practice = await this.practiceRepository
      .createQueryBuilder('practice')
      .leftJoinAndSelect('practice.plannedBy', 'plannedBy')
      .leftJoinAndSelect('practice.attendances', 'attendances')
      .leftJoinAndSelect('practice.sets', 'sets')
      .leftJoinAndSelect('sets.dogs', 'setDogs')
      .leftJoinAndSelect('setDogs.dog', 'dog')
      .leftJoinAndSelect('dog.owner', 'owner')
      .leftJoinAndSelect('sets.location', 'location')
      .where('practice.id = :id', { id })
      .andWhere('practice.clubId IN (:...clubIds)', { clubIds: user?.clubIds || [] })
      .andWhere('(practice.isPrivate = false OR practice.plannedById = :userId)', { userId: user?.id })
      .getOne();

    // Generate shareCode if it doesn't exist (for existing practices)
    if (practice && !practice.shareCode) {
      practice.shareCode = this.generateShareCode();
      await this.practiceRepository.save(practice);
    }

    return practice;
  }

  @Query(() => Practice, { nullable: true })
  async publicPractice(@Arg('id') id: string, @Arg('code') code: string): Promise<Practice | null> {
    return await this.practiceRepository.findOne({
      where: {
        id,
        shareCode: code
      },
      relations: [
        'attendances',
        'attendances.dog',
        'sets',
        'sets.dogs',
        'sets.dogs.dog',
        'sets.location',
        'club',
        'club.locations'
      ],
      order: {
        sets: {
          index: 'ASC',
          dogs: {
            index: 'ASC'
          }
        }
      }
    });
  }

  @Mutation(() => Practice)
  @UseMiddleware(isAuth, hasClubAccess)
  async createPractice(
    @Arg('clubId') clubId: string,
    @Arg('scheduledAt') scheduledAt: Date,
    @Arg('status', () => PracticeStatus) status: PracticeStatus,
    @Arg('isPrivate', { defaultValue: false }) isPrivate: boolean,
    @Ctx() { user }: AuthContext
  ): Promise<Practice> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const practice = this.practiceRepository.create({
      clubId,
      scheduledAt,
      status,
      plannedById: user.id,
      isPrivate,
      shareCode: this.generateShareCode()
    });
    const savedPractice = await this.practiceRepository.save(practice);

    const practiceWithRelations = await this.practiceRepository.findOne({
      where: { id: savedPractice.id },
      relations: ['attendances', 'sets', 'plannedBy']
    });

    if (practiceWithRelations) {
      const summary = await PracticeSummaryService.createPracticeSummary(practiceWithRelations);
      await PubSubService.publishPracticeSummaryEvent(SubscriptionEvents.PRACTICE_CREATED, summary);
    }

    return savedPractice;
  }

  @Mutation(() => Practice, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePractice(
    @Arg('id') id: string,
    @Ctx() { user }: AuthContext,
    @Arg('scheduledAt', { nullable: true }) scheduledAt?: Date,
    @Arg('status', () => PracticeStatus, { nullable: true }) status?: PracticeStatus,
    @Arg('isPrivate', { nullable: true }) isPrivate?: boolean
  ): Promise<Practice | null> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) return null;

    const practice = await this.practiceRepository.findOne({
      where: {
        id,
        ...clubFilter
      }
    });
    if (!practice) return null;

    if (practice.plannedById !== user?.id) {
      throw new Error('You can only update practices you created');
    }

    const newScheduledAt = scheduledAt ?? practice.scheduledAt;
    const newStatus = status;

    if (newStatus === PracticeStatus.Draft && newScheduledAt < new Date()) {
      throw new Error('Cannot mark a past practice as Draft. Past practices must remain in Ready status.');
    }

    Object.assign(practice, {
      scheduledAt: newScheduledAt,
      status: status ?? practice.status,
      isPrivate: isPrivate ?? practice.isPrivate
    });

    const updatedPractice = await this.practiceRepository.save(practice);

    await PubSubService.publishPracticeEvent(SubscriptionEvents.PRACTICE_UPDATED, updatedPractice);

    const summary = await PracticeSummaryService.createPracticeSummaryById(updatedPractice.id);
    if (summary) {
      await PubSubService.publishPracticeSummaryEvent(SubscriptionEvents.PRACTICE_ATTENDANCE_UPDATED, summary);
    }

    return updatedPractice;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePractice(@Arg('id') id: string, @Ctx() { user }: AuthContext): Promise<boolean> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) return false;

    const practice = await this.practiceRepository.findOne({
      where: {
        id,
        ...clubFilter
      },
      relations: ['attendances', 'sets', 'plannedBy']
    });

    if (!practice) return false;

    if (practice.plannedById !== user?.id) {
      throw new Error('You can only delete practices you created');
    }

    const summary = await PracticeSummaryService.createPracticeSummary(practice);
    const result = await this.practiceRepository.delete(id);
    const deleted = result.affected !== 0;

    if (deleted) {
      await PubSubService.publishPracticeSummaryEvent(SubscriptionEvents.PRACTICE_DELETED, summary);
    }

    return deleted;
  }
}
