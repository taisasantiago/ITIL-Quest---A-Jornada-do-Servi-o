import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

const PORT = process.env.FRONT_PORT || 8080;
app.listen(PORT, () => {
  console.log(`Static frontend server on http://localhost:${PORT}`);
});
