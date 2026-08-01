// Local-only API server so `npm run dev:api` can exercise the same /api
// handlers Vercel runs in production, without needing `vercel dev` / auth.
// Express's req/res shape (query, body, status().json()) matches what the
// handlers expect from @vercel/node, so no adapter layer is needed beyond
// mapping the :id route param onto req.query.id.
import express from 'express';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import leadsHandler from './api/leads/index.js';
import leadHandler from './api/leads/[id].js';
import importHandler from './api/leads/import.js';

const app = express();
app.use(express.json());

app.all('/api/leads/import', (req, res) => importHandler(req as any, res as any));
app.all('/api/leads/:id', (req, res) => {
  (req.query as Record<string, string>).id = req.params.id;
  leadHandler(req as any, res as any);
});
app.all('/api/leads', (req, res) => leadsHandler(req as any, res as any));

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () => {
  console.log(`API dev server listening on http://localhost:${port}`);
});
