import dotenv from 'dotenv';
import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

function validateEnvironment() {
  const requiredVariables = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_ORIGIN'];
  const missingVariables = requiredVariables.filter((variable) => !process.env[variable]);

  if (missingVariables.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVariables.join(', ')}`);
  }
}

async function start() {
  validateEnvironment();
  await connectDatabase();

  const app = createApp();

  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start backend server:', error);
  process.exit(1);
});