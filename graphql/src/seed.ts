import 'reflect-metadata'
import * as dotenv from 'dotenv'

import { AppDataSource } from './db'
import { seedDatabase } from './db/seed'

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
