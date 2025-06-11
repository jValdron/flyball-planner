import { Resolver, Query, Mutation, Arg } from 'type-graphql';
import { Practice, PracticeStatus } from '../models/Practice';
import { AppDataSource } from '../db';

@Resolver(Practice)
export class PracticeResolver {
  private practiceRepository = AppDataSource.getRepository(Practice);

  @Query(() => [Practice])
  async practices(): Promise<Practice[]> {
    return await this.practiceRepository.find();
  }

  @Query(() => Practice, { nullable: true })
  async practice(@Arg('id') id: string): Promise<Practice | null> {
    return await this.practiceRepository.findOneBy({ id });
  }

  @Mutation(() => Practice)
  async createPractice(
    @Arg('clubId') clubId: string,
    @Arg('scheduledAt') scheduledAt: Date,
    @Arg('status') status: PracticeStatus
  ): Promise<Practice> {
    const practice = this.practiceRepository.create({
      clubId,
      scheduledAt,
      status
    });
    return await this.practiceRepository.save(practice);
  }

  @Mutation(() => Practice, { nullable: true })
  async updatePractice(
    @Arg('id') id: string,
    @Arg('clubId', { nullable: true }) clubId?: string,
    @Arg('scheduledAt', { nullable: true }) scheduledAt?: Date,
    @Arg('status', { nullable: true }) status?: PracticeStatus
  ): Promise<Practice | null> {
    const practice = await this.practiceRepository.findOneBy({ id });
    if (!practice) return null;

    Object.assign(practice, {
      clubId: clubId ?? practice.clubId,
      scheduledAt: scheduledAt ?? practice.scheduledAt,
      status: status ?? practice.status
    });

    return await this.practiceRepository.save(practice);
  }

  @Mutation(() => Boolean)
  async deletePractice(@Arg('id') id: string): Promise<boolean> {
    const result = await this.practiceRepository.delete(id);
    return result.affected !== 0;
  }
}
