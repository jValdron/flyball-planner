import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { seedDatabase } from './db/seed';
import { Club } from './models/Club';
import { Owner } from './models/Owner';
import { Dog } from './models/Dog';
import { Practice } from './models/Practice';
import { Set } from './models/Set';
import { SetDog } from './models/SetDog';
import { PracticeAttendance } from './models/PracticeAttendance';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'flyball_practice_planner',
  ssl: process.env.DB_SSLMODE !== 'disable',
  entities: [Club, Owner, Dog, Practice, Set, SetDog, PracticeAttendance],
  synchronize: true,
});

async function main() {
  try {
    await dataSource.initialize();
    console.log('Database connection initialized');

    await seedDatabase(dataSource);

    await dataSource.destroy();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

main();
