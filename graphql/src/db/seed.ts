import { DataSource } from 'typeorm';
import { Club } from '../models/Club';
import { Handler } from '../models/Handler';
import { Dog, DogStatus } from '../models/Dog';
import { Location } from '../models/Location';

const ownersData = [
  { givenName: 'Andrea', surname: 'Donovan' },
  { givenName: 'Brit', surname: 'Walton' },
  { givenName: 'Christine', surname: 'NT' },
  { givenName: 'Gerry', surname: 'Teed' },
  { givenName: 'Jack', surname: 'Brown' },
  { givenName: 'Janice', surname: 'Aubé' },
  { givenName: 'Jason', surname: 'Valdron' },
  { givenName: 'Kelly', surname: 'Hogg' },
  { givenName: 'Karen', surname: 'Jacobson' },
  { givenName: 'Kendra', surname: 'DeWitt' },
  { givenName: 'Nicole', surname: 'Kerr' },
  { givenName: 'Patti', surname: 'Breaker' },
  { givenName: 'Sandra-Sam', surname: 'Foster' },
  { givenName: 'Stefani', surname: 'Chouinard' },
  { givenName: 'Victoria', surname: 'Perron' },
  { givenName: 'Whitney', surname: 'Yapp' },
  { givenName: 'Nadia', surname: 'Miller' },
  { givenName: 'Hilary', surname: 'Fegan' },
  { givenName: 'Emily', surname: 'Totton' },
  { givenName: 'Julia', surname: 'Khoury' },
  { givenName: 'Carrie', surname: 'MacAllister' },
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
    nafaClubNumber: '1002',
    defaultPracticeTime: '10:00',
  });
  await dataSource.getRepository(Club).save(club);

  // Create locations
  const locations = [
    { name: 'Main Room', clubId: club.id, isDefault: true },
    { name: 'Puppy Room', clubId: club.id, isDefault: false },
  ];
  await dataSource.getRepository(Location).save(locations);

  // Create owners
  const owners = ownersData.map(ownerData =>
    dataSource.getRepository(Handler).create({
      givenName: ownerData.givenName,
      surname: ownerData.surname,
      clubId: club.id,
    })
  );
  await dataSource.getRepository(Handler).save(owners);

  // Create dogs
  const dogs = await Promise.all(dogsData.map(async dogData => {
    const owner = owners.find(o => o.givenName === dogData.ownerName.split(' ')[0] && o.surname === dogData.ownerName.split(' ')[1]);
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
