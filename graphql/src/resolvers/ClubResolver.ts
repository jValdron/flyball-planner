import { Resolver, Query, Mutation, Arg } from 'type-graphql';
import { Club } from '../models/Club';
import { AppDataSource } from '../db';
import { Dog } from '../models/Dog';
import { PubSubService, SubscriptionEvents } from '../services/PubSubService';

@Resolver(Club)
export class ClubResolver {
  private clubRepository = AppDataSource.getRepository(Club);
  private dogRepository = AppDataSource.getRepository(Dog);

  @Query(() => [Club])
  async clubs(): Promise<Club[]> {
    return await this.clubRepository.find();
  }

  @Query(() => Club, { nullable: true })
  async club(@Arg('id') id: string): Promise<Club | null> {
    return await this.clubRepository.findOne({
      where: { id },
      relations: ['dogs', 'handlers', 'locations']
    });
  }

  @Mutation(() => Club)
  async createClub(@Arg('name') name: string): Promise<Club> {
    const club = this.clubRepository.create({ name });
    const savedClub = await this.clubRepository.save(club);

    await PubSubService.publishClubEvent(SubscriptionEvents.CLUB_CREATED, savedClub);

    return savedClub;
  }

  @Mutation(() => Club, { nullable: true })
  async updateClub(
    @Arg('id') id: string,
    @Arg('name', { nullable: true }) name?: string,
    @Arg('nafaClubNumber', { nullable: true }) nafaClubNumber?: string,
    @Arg('defaultPracticeTime', { nullable: true }) defaultPracticeTime?: string
  ): Promise<Club | null> {
    const club = await this.clubRepository.findOneBy({ id });
    if (!club) return null;

    Object.assign(club, {
      name: name ?? club.name,
      nafaClubNumber: nafaClubNumber ?? club.nafaClubNumber,
      defaultPracticeTime: defaultPracticeTime ?? club.defaultPracticeTime
    });

    const updatedClub = await this.clubRepository.save(club);

    await PubSubService.publishClubEvent(SubscriptionEvents.CLUB_UPDATED, updatedClub);

    return updatedClub;
  }

  @Mutation(() => Boolean)
  async deleteClub(@Arg('id') id: string): Promise<boolean> {
    const club = await this.clubRepository.findOneBy({ id });
    if (!club) return false;

    const result = await this.clubRepository.delete(id);
    const deleted = result.affected !== 0;

    if (deleted) {
      await PubSubService.publishClubEvent(SubscriptionEvents.CLUB_DELETED, club);
    }

    return deleted;
  }
}
