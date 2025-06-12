import { Resolver, Query, Mutation, Arg } from 'type-graphql';
import { Club } from '../models/Club';
import { AppDataSource } from '../db';
import { Dog } from '../models/Dog';

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
    return await this.clubRepository.findOneBy({ id });
  }

  @Mutation(() => Club)
  async createClub(@Arg('name') name: string): Promise<Club> {
    const club = this.clubRepository.create({ name });
    return await this.clubRepository.save(club);
  }

  @Mutation(() => Club, { nullable: true })
  async updateClub(
    @Arg('id') id: string,
    @Arg('name', { nullable: true }) name?: string
  ): Promise<Club | null> {
    const club = await this.clubRepository.findOneBy({ id });
    if (!club) return null;

    Object.assign(club, {
      name: name ?? club.name
    });

    return await this.clubRepository.save(club);
  }

  @Mutation(() => Boolean)
  async deleteClub(@Arg('id') id: string): Promise<boolean> {
    const result = await this.clubRepository.delete(id);
    return result.affected !== 0;
  }
}
