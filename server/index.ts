import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { aiRouter } from './routes/ai';
import { amapRouter } from './routes/amap';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/ai', aiRouter);
app.use('/api/amap', amapRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
