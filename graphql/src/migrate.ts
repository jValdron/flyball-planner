import { config } from 'dotenv'
import { AppDataSource } from './db'

config();

async function migrate() {
  try {
    console.log('Starting database migration...');

    await AppDataSource.initialize();
    console.log('Database connection established');

    await AppDataSource.synchronize();
    console.log('Database schema synchronized successfully');

    await AppDataSource.destroy();
    console.log('Database migration completed successfully');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
