import { DataSource } from 'typeorm';
import { Club } from '../models/Club';
import { Owner } from '../models/Owner';
import { Dog, DogStatus } from '../models/Dog';

const ownersData = [
  { name: 'Andrea Donovan' },
  { name: 'Brit Walton' },
  { name: 'Christine NT' },
  { name: 'Gerry Teed' },
  { name: 'Jack Brown' },
  { name: 'Janice Aubé' },
  { name: 'Jason Valdron' },
  { name: 'Kelly Hogg' },
  { name: 'Karen Jacobson' },
  { name: 'Kendra DeWitt' },
  { name: 'Nicole Kerr' },
  { name: 'Patti Breaker' },
  { name: 'Sandra-Sam Foster' },
  { name: 'Stefani Chouinard' },
  { name: 'Victoria Perron' },
  { name: 'Whitney Yapp' },
  { name: 'Nadia Miller' },
  { name: 'Hilary Fegan' },
  { name: 'Emily Totton' },
  { name: 'Julia Khoury' },
  { name: 'Carrie MacAllister' },
];

const dogsData = [
  { name: 'Fennec', ownerName: 'Andrea Donovan' },
  { name: 'Rose', ownerName: 'Andrea Donovan' },
  { name: 'Atticus', ownerName: 'Brit Walton' },
  { name: 'Millie', ownerName: 'Brit Walton' },
  { name: 'Myst', ownerName: 'Christine NT' },
  { name: 'Prim', ownerName: 'Christine NT' },
  { name: 'Onyx', ownerName: 'Gerry Teed' },
  { name: 'Gracie', ownerName: 'Jack Brown' },
  { name: 'Lexi', ownerName: 'Janice Aubé' },
  { name: 'Timber', ownerName: 'Janice Aubé' },
  { name: 'Vala', ownerName: 'Jason Valdron' },
  { name: 'Belinda', ownerName: 'Karen Jacobson' },
  { name: 'Keen', ownerName: 'Kelly Hogg' },
  { name: 'Luna', ownerName: 'Kelly Hogg' },
  { name: 'Juno', ownerName: 'Kendra DeWitt' },
  { name: 'Kiwi', ownerName: 'Kendra DeWitt' },
  { name: 'Piper', ownerName: 'Nicole Kerr' },
  { name: 'Quinn', ownerName: 'Nicole Kerr' },
  { name: 'Ten', ownerName: 'Patti Breaker' },
  { name: 'Viv', ownerName: 'Patti Breaker' },
  { name: 'Zig', ownerName: 'Patti Breaker' },
  { name: 'Axle', ownerName: 'Sandra-Sam Foster' },
  { name: 'Rush', ownerName: 'Sandra-Sam Foster' },
  { name: 'Styx', ownerName: 'Sandra-Sam Foster' },
  { name: 'Even', ownerName: 'Stefani Chouinard' },
  { name: 'Prize', ownerName: 'Stefani Chouinard' },
  { name: 'Envy', ownerName: 'Victoria Perron' },
  { name: 'Logan', ownerName: 'Whitney Yapp' },
  { name: 'Lupin', ownerName: 'Whitney Yapp' },
  { name: 'Pippin', ownerName: 'Whitney Yapp' },
  { name: 'Press', ownerName: 'Nadia Miller' },
  { name: 'Bandit', ownerName: 'Hilary Fegan' },
  { name: 'Bean', ownerName: 'Emily Totton' },
  { name: 'Miso', ownerName: 'Julia Khoury' },
  { name: 'Scooter', ownerName: 'Carrie MacAllister' },
];

export async function seedDatabase(dataSource: DataSource) {
  // Check if data already exists
  const clubCount = await dataSource.getRepository(Club).count();
  if (clubCount > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  console.log('Seeding database...');

  // Create club
  const club = dataSource.getRepository(Club).create({
    name: 'On My Go!',
  });
  await dataSource.getRepository(Club).save(club);

  // Create owners
  const owners = ownersData.map(ownerData =>
    dataSource.getRepository(Owner).create({
      name: ownerData.name,
    })
  );
  await dataSource.getRepository(Owner).save(owners);

  // Create dogs
  const dogs = await Promise.all(dogsData.map(async dogData => {
    const owner = owners.find(o => o.name === dogData.ownerName);
    if (!owner) {
      throw new Error(`Owner not found for dog ${dogData.name}`);
    }

    return dataSource.getRepository(Dog).create({
      name: dogData.name,
      ownerId: owner.id,
      clubId: club.id,
      status: DogStatus.Active,
      trainingLevel: 1,
    });
  }));
  await dataSource.getRepository(Dog).save(dogs);

  console.log('Database seeding complete.');
}
