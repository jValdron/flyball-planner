import { Resolver, Query, Mutation, Arg, ID, UseMiddleware, Ctx, InputType, Field } from 'type-graphql';
import { DogNote } from '../models/DogNote';
import { SetDogNote } from '../models/SetDogNote';
import { AppDataSource } from '../db';
import { AuthContext, isAuth, hasClubAccess, createClubFilter } from '../middleware/auth';

@InputType()
export class CreateDogNoteInput {
  @Field()
  content: string;

  @Field(() => ID)
  dogId: string;

  @Field(() => ID)
  clubId: string;
}

@InputType()
export class CreateSetDogNoteInput {
  @Field()
  content: string;

  @Field(() => ID)
  setDogId: string;

  @Field(() => [ID])
  dogIds: string[];
}

@Resolver(DogNote)
export class DogNoteResolver {
  private dogNoteRepository = AppDataSource.getRepository(DogNote);
  private setDogNoteRepository = AppDataSource.getRepository(SetDogNote);

  @Query(() => [DogNote])
  @UseMiddleware(isAuth)
  async dogNotes(@Arg('dogId', () => ID) dogId: string, @Ctx() { user }: AuthContext): Promise<DogNote[]> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) return [];

    return await this.dogNoteRepository.find({
      where: {
        dogId,
        dog: clubFilter
      },
      relations: ['dog', 'setDogNotes', 'setDogNotes.setDog', 'setDogNotes.setDog.set']
    });
  }

  @Mutation(() => DogNote)
  @UseMiddleware(isAuth, hasClubAccess)
  async createDogNote(
    @Arg('input') input: CreateDogNoteInput
  ): Promise<DogNote> {
    const dogNote = this.dogNoteRepository.create({
      content: input.content,
      dogId: input.dogId
    });

    return await this.dogNoteRepository.save(dogNote);
  }

  @Mutation(() => DogNote)
  @UseMiddleware(isAuth, hasClubAccess)
  async createSetDogNote(
    @Arg('input') input: CreateSetDogNoteInput
  ): Promise<DogNote> {
    // Create the main dog note
    const dogNote = this.dogNoteRepository.create({
      content: input.content,
      dogId: input.dogIds[0] // Use the first dog as the primary dog
    });

    const savedDogNote = await this.dogNoteRepository.save(dogNote);

    // Create SetDogNote entries for each dog in the set
    const setDogNotes = input.dogIds.map(dogId =>
      this.setDogNoteRepository.create({
        setDogId: input.setDogId,
        dogNoteId: savedDogNote.id
      })
    );

    await this.setDogNoteRepository.save(setDogNotes);

    return savedDogNote;
  }

  @Mutation(() => DogNote, { nullable: true })
  @UseMiddleware(isAuth)
  async updateDogNote(
    @Arg('id', () => ID) id: string,
    @Arg('content') content: string,
    @Ctx() { user }: AuthContext
  ): Promise<DogNote | null> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) return null;

    const dogNote = await this.dogNoteRepository.findOne({
      where: {
        id,
        dog: clubFilter
      }
    });

    if (!dogNote) return null;

    dogNote.content = content;
    return await this.dogNoteRepository.save(dogNote);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteDogNote(@Arg('id', () => ID) id: string, @Ctx() { user }: AuthContext): Promise<boolean> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) return false;

    const dogNote = await this.dogNoteRepository.findOne({
      where: {
        id,
        dog: clubFilter
      }
    });

    if (!dogNote) return false;

    const result = await this.dogNoteRepository.delete(id);
    return result.affected !== 0;
  }
}
