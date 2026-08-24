import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';

connectDatabase()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`Backend listening on http://localhost:${env.port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error.message);
    process.exit(1);
  });