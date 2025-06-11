import { Resolver, Query, Mutation, Arg } from 'type-graphql';
import { Owner } from '../models/Owner';
import { AppDataSource } from '../db';

@Resolver(Owner)
export class OwnerResolver {
  private ownerRepository = AppDataSource.getRepository(Owner);

  @Query(() => [Owner])
  async owners(): Promise<Owner[]> {
    return await this.ownerRepository.find();
  }

  @Query(() => Owner, { nullable: true })
  async owner(@Arg('id') id: string): Promise<Owner | null> {
    return await this.ownerRepository.findOneBy({ id });
  }

  @Mutation(() => Owner)
  async createOwner(@Arg('name') name: string): Promise<Owner> {
    const owner = this.ownerRepository.create({ name });
    return await this.ownerRepository.save(owner);
  }

  @Mutation(() => Owner, { nullable: true })
  async updateOwner(
    @Arg('id') id: string,
    @Arg('name', { nullable: true }) name?: string
  ): Promise<Owner | null> {
    const owner = await this.ownerRepository.findOneBy({ id });
    if (!owner) return null;

    Object.assign(owner, {
      name: name ?? owner.name
    });

    return await this.ownerRepository.save(owner);
  }

  @Mutation(() => Boolean)
  async deleteOwner(@Arg('id') id: string): Promise<boolean> {
    const result = await this.ownerRepository.delete(id);
    return result.affected !== 0;
  }
}
