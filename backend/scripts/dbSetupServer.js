import { execSync } from 'child_process';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

const run = (cmd) => {
  logger.info(`[DB-Setup] ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
};

const main = async () => {
  try {
    // 1) Ensure client is generated for runtime
    run('npx prisma generate');

    // 2) Apply migrations in production/server environments
    run('npx prisma migrate deploy');

    // 3) Seed only when database is empty (safe for repeated deploys)
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      logger.info('[DB-Setup] Empty database detected, running seed...');
      run('node prisma/seed.js');
    } else {
      logger.info(`[DB-Setup] Skip seed, existing users=${userCount}`);
    }

    logger.info('[DB-Setup] Completed successfully');
  } catch (error) {
    logger.error(`[DB-Setup] Failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

main();
