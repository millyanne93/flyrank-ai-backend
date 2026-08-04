import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Supabase client
const supabase = createClient(
      process.env.SUPABASE_URL!,
        process.env.SUPABASE_KEY!
);

// Health check
app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', service: 'auth-api' });
});

app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
            console.log(`✅ Connected to Supabase`);
});
