import 'reflect-metadata';
import { AppDataSource } from './data-source';

async function run() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    const migrations = await AppDataSource.runMigrations();
    console.log(`Executed migrations:`, migrations.map((m) => m.name));
    await AppDataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Migration run failed:', err);
    process.exit(1);
  }
}

run();
