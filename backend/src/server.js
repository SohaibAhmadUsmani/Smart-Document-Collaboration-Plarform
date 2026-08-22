import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';

async function startServer() {
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port}`);
  });
}

startServer();
