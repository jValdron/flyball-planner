import { Resolver, Query, Mutation, Arg } from 'type-graphql';
import { Practice, PracticeStatus } from '../models/Practice';
import { AppDataSource } from '../db';
import { PubSubService, SubscriptionEvents } from '../services/PubSubService';
import { PracticeSummaryService } from '../services/PracticeSummaryService';
import { PracticeSummary } from '../types/SubscriptionTypes';

@Resolver(Practice)
export class PracticeResolver {
  private practiceRepository = AppDataSource.getRepository(Practice);

  @Query(() => [PracticeSummary])
  async practiceSummariesByClub(@Arg('clubId') clubId: string): Promise<PracticeSummary[]> {
    const practices = await this.practiceRepository.find({
      where: { clubId },
      relations: ['attendances', 'sets']
    });

    return Promise.all(practices.map(practice => PracticeSummaryService.createPracticeSummary(practice)));
  }

  @Query(() => Practice, { nullable: true })
  async practice(@Arg('id') id: string): Promise<Practice | null> {
    return await this.practiceRepository.findOne({
      where: { id },
      relations: [
        'attendances',
        'sets',
        'sets.dogs'
      ]
    });
  }

  @Mutation(() => Practice)
  async createPractice(
    @Arg('clubId') clubId: string,
    @Arg('scheduledAt') scheduledAt: Date,
    @Arg('status', () => PracticeStatus) status: PracticeStatus
  ): Promise<Practice> {
    const practice = this.practiceRepository.create({
      clubId,
      scheduledAt,
      status
    });
    const savedPractice = await this.practiceRepository.save(practice);

    // Load relations for the summary
    const practiceWithRelations = await this.practiceRepository.findOne({
      where: { id: savedPractice.id },
      relations: ['attendances', 'sets']
    });

    if (practiceWithRelations) {
      const summary = await PracticeSummaryService.createPracticeSummary(practiceWithRelations);
      await PubSubService.publishPracticeSummaryEvent(SubscriptionEvents.PRACTICE_CREATED, summary);
    }

    return savedPractice;
  }

  @Mutation(() => Practice, { nullable: true })
  async updatePractice(
    @Arg('id') id: string,
    @Arg('clubId', { nullable: true }) clubId?: string,
    @Arg('scheduledAt', { nullable: true }) scheduledAt?: Date,
    @Arg('status', () => PracticeStatus, { nullable: true }) status?: PracticeStatus
  ): Promise<Practice | null> {
    const practice = await this.practiceRepository.findOneBy({ id });
    if (!practice) return null;

    Object.assign(practice, {
      clubId: clubId ?? practice.clubId,
      scheduledAt: scheduledAt ?? practice.scheduledAt,
      status: status ?? practice.status
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
  async deletePractice(@Arg('id') id: string): Promise<boolean> {
    const practice = await this.practiceRepository.findOne({
      where: { id },
      relations: ['attendances', 'sets']
    });

    if (!practice) return false;

    const summary = await PracticeSummaryService.createPracticeSummary(practice);
    const result = await this.practiceRepository.delete(id);
    const deleted = result.affected !== 0;

    if (deleted) {
      await PubSubService.publishPracticeSummaryEvent(SubscriptionEvents.PRACTICE_DELETED, summary);
    }

    return deleted;
  }
}
