import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import connectDatabase from './config/database.js';

const port = process.env.PORT || 5000;
await connectDatabase();
const server = app.listen(port, () => console.log(`API listening on ${port}`));

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Please free it and restart.`);
    process.exit(1);
  } else {
    throw err;
  }
});
