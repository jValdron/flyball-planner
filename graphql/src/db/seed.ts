import { DataSource } from 'typeorm'

import { Club } from '../models/Club'
import { Handler } from '../models/Handler'
import { Dog, DogStatus, TrainingLevel } from '../models/Dog'
import { Location } from '../models/Location'
import { User } from '../models/User'
import { AuthService } from '../services/AuthService'

const ownersData = [
  { givenName: 'Amanda', surname: 'Baker' },
  { givenName: 'Amanda', surname: 'Keddy' },
  { givenName: 'Andrea', surname: 'Donovan' },
  { givenName: 'Brit', surname: 'Walton' },
  { givenName: 'Carrie', surname: 'MacAllister' },
  { givenName: 'Christine', surname: 'NT' },
  { givenName: 'Crystal', surname: 'Carson' },
  { givenName: 'Emily', surname: 'Totton' },
  { givenName: 'Gerry', surname: 'Teed' },
  { givenName: 'Hilary', surname: 'Fegan' },
  { givenName: 'Jack', surname: 'Brown' },
  { givenName: 'Janice', surname: 'Aubé' },
  { givenName: 'Jason', surname: 'Valdron' },
  { givenName: 'Julia', surname: 'Khoury' },
  { givenName: 'Karen', surname: 'Jacobson' },
  { givenName: 'Kelly', surname: 'Hogg' },
  { givenName: 'Kendra', surname: 'DeWitt' },
  { givenName: 'Nadia', surname: 'Miller' },
  { givenName: 'Nicole', surname: 'Kerr' },
  { givenName: 'Patti', surname: 'Breaker' },
  { givenName: 'Raphaëlle', surname: 'Lavigne' },
  { givenName: 'Sam', surname: 'Foster' },
  { givenName: 'Shelby', surname: 'Hallihan' },
  { givenName: 'Stefani', surname: 'Chouinard' },
  { givenName: 'Victoria', surname: 'Perron' },
  { givenName: 'Whitney', surname: 'Yapp' },
];

const dogsData = [
  { name: 'Hazard', ownerName: 'Amanda Baker', status: 'active', crn: null, trainingLevel: TrainingLevel.Intermediate },
  { name: 'Hellion', ownerName: 'Amanda Baker', status: 'active', crn: null, trainingLevel: TrainingLevel.Intermediate },
  { name: 'Mace', ownerName: 'Amanda Baker', status: 'active', crn: null, trainingLevel: TrainingLevel.Beginner },
  { name: 'Trauma', ownerName: 'Amanda Baker', status: 'active', crn: null, trainingLevel: TrainingLevel.Beginner },
  { name: 'Lox', ownerName: 'Amanda Keddy', status: 'active', crn: '250687', trainingLevel: TrainingLevel.Advanced },
  { name: 'Fennec', ownerName: 'Andrea Donovan', status: 'active', crn: '160613', trainingLevel: TrainingLevel.Solid },
  { name: 'Rose', ownerName: 'Andrea Donovan', status: 'active', crn: '230335', trainingLevel: TrainingLevel.Advanced },
  { name: 'Oz', ownerName: 'Andrea Donovan', status: 'active', crn: null, trainingLevel: TrainingLevel.Intermediate },
  { name: 'Atticus', ownerName: 'Brit Walton', status: 'active', crn: '230351', trainingLevel: TrainingLevel.Solid },
  { name: 'Millie', ownerName: 'Brit Walton', status: 'active', crn: '240310', trainingLevel: TrainingLevel.Solid },
  { name: 'Scooter', ownerName: 'Carrie MacAllister', status: 'active', crn: '250455', trainingLevel: TrainingLevel.Solid },
  { name: 'Myst', ownerName: 'Christine NT', status: 'active', crn: '250384', trainingLevel: TrainingLevel.Solid },
  { name: 'Maeve', ownerName: 'Crystal Carson', status: 'active', crn: null, trainingLevel: TrainingLevel.Beginner },
  { name: 'Sherman', ownerName: 'Crystal Carson', status: 'active', crn: '240750', trainingLevel: TrainingLevel.Solid },
  { name: 'Onyx', ownerName: 'Gerry Teed', status: 'active', crn: '190316', trainingLevel: TrainingLevel.Solid },
  { name: 'Cheddar', ownerName: 'Hilary Fegan', status: 'active', crn: null, trainingLevel: TrainingLevel.Novice },
  { name: 'Rogue', ownerName: 'Hilary Fegan', status: 'active', crn: null, trainingLevel: TrainingLevel.Beginner },
  { name: 'Gracie', ownerName: 'Jack Brown', status: 'active', crn: '190795', trainingLevel: TrainingLevel.Solid },
  { name: 'Vala', ownerName: 'Jason Valdron', status: 'active', crn: '220653', trainingLevel: TrainingLevel.Solid },
  { name: 'Miso', ownerName: 'Julia Khoury', status: 'inactive', crn: null, trainingLevel: TrainingLevel.Advanced },
  { name: 'Jupi', ownerName: 'Julia Khoury', status: 'active', crn: null, trainingLevel: TrainingLevel.Beginner },
  { name: 'Belinda', ownerName: 'Karen Jacobson', status: 'active', crn: '180330', trainingLevel: TrainingLevel.Solid },
  { name: 'Keen', ownerName: 'Kelly Hogg', status: 'active', crn: '190801', trainingLevel: TrainingLevel.Solid },
  { name: 'Juno', ownerName: 'Kendra DeWitt', status: 'active', crn: '220261', trainingLevel: TrainingLevel.Solid },
  { name: 'Kiwi', ownerName: 'Kendra DeWitt', status: 'active', crn: '230339', trainingLevel: TrainingLevel.Solid },
  { name: 'Gem', ownerName: 'Nadia Miller', status: 'active', crn: null, trainingLevel: TrainingLevel.Beginner },
  { name: 'Press', ownerName: 'Nadia Miller', status: 'active', crn: '170672', trainingLevel: TrainingLevel.Solid },
  { name: 'Piper', ownerName: 'Nicole Kerr', status: 'active', crn: '180614', trainingLevel: TrainingLevel.Solid },
  { name: 'Quinn', ownerName: 'Nicole Kerr', status: 'active', crn: '230345', trainingLevel: TrainingLevel.Solid },
  { name: 'Zig', ownerName: 'Patti Breaker', status: 'active', crn: '190595', trainingLevel: TrainingLevel.Solid },
  { name: 'Ten', ownerName: 'Patti Breaker', status: 'active', crn: null, trainingLevel: TrainingLevel.Beginner },
  { name: 'Viv', ownerName: 'Patti Breaker', status: 'active', crn: '170210', trainingLevel: TrainingLevel.Solid },
  { name: 'Axle', ownerName: 'Sam Foster', status: 'active', crn: '160545', trainingLevel: TrainingLevel.Solid },
  { name: 'Jimmy', ownerName: 'Sam Foster', status: 'active', crn: null, trainingLevel: TrainingLevel.Beginner },
  { name: 'Rush', ownerName: 'Sam Foster', status: 'active', crn: '190559', trainingLevel: TrainingLevel.Solid },
  { name: 'Styx', ownerName: 'Sam Foster', status: 'active', crn: '190773', trainingLevel: TrainingLevel.Solid },
  { name: 'Boat', ownerName: 'Shelby Hallihan', status: 'active', crn: null, trainingLevel: TrainingLevel.Novice },
  { name: 'Midge', ownerName: 'Shelby Hallihan', status: 'active', crn: null, trainingLevel: TrainingLevel.Novice },
  { name: 'Sloan', ownerName: 'Shelby Hallihan', status: 'active', crn: '240755', trainingLevel: TrainingLevel.Solid },
  { name: 'Even', ownerName: 'Stefani Chouinard', status: 'active', crn: '190829', trainingLevel: TrainingLevel.Solid },
  { name: 'Prize', ownerName: 'Stefani Chouinard', status: 'active', crn: '180529', trainingLevel: TrainingLevel.Solid },
  { name: 'Logan', ownerName: 'Whitney Yapp', status: 'active', crn: '220285', trainingLevel: TrainingLevel.Solid },
  { name: 'Lupin', ownerName: 'Whitney Yapp', status: 'active', crn: '230712', trainingLevel: TrainingLevel.Advanced },
  { name: 'Pippin', ownerName: 'Whitney Yapp', status: 'active', crn: null, trainingLevel: TrainingLevel.Beginner },
  { name: 'Oakley', ownerName: 'Raphaëlle Lavigne', status: 'active', crn: '250658', trainingLevel: TrainingLevel.Beginner },
  // Dogs from original list that are no longer active
  { name: 'Prim', ownerName: 'Christine NT', status: 'inactive', crn: null, trainingLevel: TrainingLevel.Beginner },
  { name: 'Lexi', ownerName: 'Janice Aubé', status: 'inactive', crn: null, trainingLevel: TrainingLevel.Beginner },
  { name: 'Sly', ownerName: 'Janice Aubé', status: 'inactive', crn: null, trainingLevel: TrainingLevel.Beginner },
  { name: 'Timber', ownerName: 'Janice Aubé', status: 'inactive', crn: '230702', trainingLevel: TrainingLevel.Advanced },
  { name: 'Luna', ownerName: 'Kelly Hogg', status: 'inactive', crn: null, trainingLevel: TrainingLevel.Beginner },
  { name: 'Envy', ownerName: 'Victoria Perron', status: 'inactive', crn: null, trainingLevel: TrainingLevel.Beginner },
  { name: 'Bandit', ownerName: 'Hilary Fegan', status: 'inactive', crn: null, trainingLevel: TrainingLevel.Beginner },
  { name: 'Bean', ownerName: 'Emily Totton', status: 'inactive', crn: null, trainingLevel: TrainingLevel.Beginner },
];

export async function seedDatabase(dataSource: DataSource) {
  // Check if data already exists
  const clubCount = await dataSource.getRepository(Club).count();
  if (clubCount > 0) {
    console.log('Database already seeded, updating dog statuses...');

    // Get existing club
    const club = await dataSource.getRepository(Club).findOne({ where: {} });
    if (!club) {
      throw new Error('No club found in database');
    }

    // Get all existing dogs
    const existingDogs = await dataSource.getRepository(Dog).find({ where: { clubId: club.id } });

    // Get the list of active dog names from our new data
    const activeDogNames = dogsData.map(dog => dog.name);

    // Update dog statuses
    for (const dog of existingDogs) {
      if (activeDogNames.includes(dog.name)) {
        dog.status = DogStatus.Active;
      } else {
        dog.status = DogStatus.Inactive;
      }
      await dataSource.getRepository(Dog).save(dog);
    }

    console.log('Dog statuses updated.');
    return;
  }

  console.log('Seeding database...');

  // Create club
  const club = dataSource.getRepository(Club).create({
    name: 'On My Go!',
    nafaClubNumber: '1002',
    defaultPracticeTime: '10:00',
    idealSetsPerDog: 2,
  });
  await dataSource.getRepository(Club).save(club);

  // Create users
  const userRepository = dataSource.getRepository(User);

  // Create user 'jvaldron'
  const existingUser = await userRepository.findOne({ where: { username: 'jvaldron' } });
  if (!existingUser) {
    const hashedPassword = await AuthService.hashPassword('password');
    const user = userRepository.create({
      username: 'jvaldron',
      email: 'jason@valdron.ca',
      firstName: 'Jason',
      lastName: 'Valdron',
      password: hashedPassword,
      clubs: [club],
    });
    await userRepository.save(user);
  }

  // Create test user
  const existingTestUser = await userRepository.findOne({ where: { username: 'test' } });
  if (!existingTestUser) {
    const hashedTestPassword = await AuthService.hashPassword('password');
    const testUser = userRepository.create({
      username: 'test',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: hashedTestPassword,
      clubs: [club],
    });
    await userRepository.save(testUser);
  }

  // Create locations
  const locations = [
    { name: 'Main Room', clubId: club.id, isDefault: true, isDoubleLane: true },
    { name: 'Puppy Room', clubId: club.id, isDefault: false, isDoubleLane: false },
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
    const owner = owners.find(o => `${o.givenName} ${o.surname}` === dogData.ownerName);

    if (!owner) {
      throw new Error(`Owner not found for dog ${dogData.name} with owner ${dogData.ownerName}`);
    }

    return dataSource.getRepository(Dog).create({
      name: dogData.name,
      ownerId: owner.id,
      clubId: club.id,
      status: dogData.status === 'active' ? DogStatus.Active : DogStatus.Inactive,
      trainingLevel: dogData.trainingLevel,
      crn: dogData.crn,
    });
  }));
  await dataSource.getRepository(Dog).save(dogs);

  console.log('Database seeding complete.');
}
