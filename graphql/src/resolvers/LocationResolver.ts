import { Resolver, Query, Mutation, Arg } from 'type-graphql';
import { Location } from '../models/Location';
import { AppDataSource } from '../db';
import { ID } from 'type-graphql';
import { PubSubService, SubscriptionEvents } from '../services/PubSubService';

@Resolver(Location)
export class LocationResolver {
  private locationRepository = AppDataSource.getRepository(Location);

  private async unsetDefaultLocationAndPublish(clubId: string): Promise<void> {
    const currentDefault = await this.locationRepository.findOne({
      where: { clubId, isDefault: true }
    });

    if (currentDefault) {
      const updateResult = await this.locationRepository.update(
        { id: currentDefault.id },
        { isDefault: false }
      );

      if (updateResult.affected && updateResult.affected > 0) {
        const updatedLocation = { ...currentDefault, isDefault: false };
        await PubSubService.publishLocationEvent(SubscriptionEvents.LOCATION_UPDATED, updatedLocation);
      }
    }
  }

  @Query(() => [Location])
  async locations(): Promise<Location[]> {
    return await this.locationRepository.find();
  }

  @Query(() => Location, { nullable: true })
  async location(@Arg('id') id: string): Promise<Location | null> {
    return await this.locationRepository.findOneBy({ id });
  }

  @Query(() => [Location])
  async locationsByClub(@Arg('clubId', () => ID) clubId: string): Promise<Location[]> {
    return await this.locationRepository.find({
      where: { clubId }
    });
  }

  @Mutation(() => Location)
  async createLocation(
    @Arg('name') name: string,
    @Arg('clubId', () => ID) clubId: string,
    @Arg('isDefault', { nullable: true }) isDefault?: boolean,
    @Arg('isDoubleLane', { nullable: true }) isDoubleLane?: boolean
  ): Promise<Location> {
    // If this is being set as default, unset any existing default for this club
    if (isDefault) {
      await this.unsetDefaultLocationAndPublish(clubId);
    }

    const location = this.locationRepository.create({
      name,
      clubId,
      isDefault: isDefault ?? false,
      isDoubleLane: isDoubleLane ?? true
    });
    const savedLocation = await this.locationRepository.save(location);

    await PubSubService.publishLocationEvent(SubscriptionEvents.LOCATION_CREATED, savedLocation);

    return savedLocation;
  }

  @Mutation(() => Location, { nullable: true })
  async updateLocation(
    @Arg('id') id: string,
    @Arg('name', { nullable: true }) name?: string,
    @Arg('isDefault', { nullable: true }) isDefault?: boolean,
    @Arg('isDoubleLane', { nullable: true }) isDoubleLane?: boolean
  ): Promise<Location | null> {
    const location = await this.locationRepository.findOneBy({ id });
    if (!location) return null;

    if (isDefault) {
      await this.unsetDefaultLocationAndPublish(location.clubId);
    }

    Object.assign(location, {
      name: name ?? location.name,
      isDefault: isDefault ?? location.isDefault,
      isDoubleLane: isDoubleLane ?? location.isDoubleLane
    });

    const updatedLocation = await this.locationRepository.save(location);

    await PubSubService.publishLocationEvent(SubscriptionEvents.LOCATION_UPDATED, updatedLocation);

    return updatedLocation;
  }

  @Mutation(() => Boolean)
  async deleteLocation(@Arg('id') id: string): Promise<boolean> {
    const location = await this.locationRepository.findOneBy({ id });
    if (!location) return false;

    if (location.isDefault) {
      throw new Error('Cannot delete the default location for a club');
    }

    const result = await this.locationRepository.delete(id);
    const deleted = result.affected !== 0;

    if (deleted) {
      await PubSubService.publishLocationEvent(SubscriptionEvents.LOCATION_DELETED, location);
    }

    return deleted;
  }
}
