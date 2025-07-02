import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { seedDatabase } from './db/seed';
import { AppDataSource } from './db';

dotenv.config();

async function main() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection initialized');

    await seedDatabase(AppDataSource);

    await AppDataSource.destroy();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

main();
