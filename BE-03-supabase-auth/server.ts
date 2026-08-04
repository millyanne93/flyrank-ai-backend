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

app.post('/auth/signup', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
      return res.status(400).json({ error: 'Email and paword are required'});
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) {
  return res.status(400).json({ error: error.message,});
  }
  res.status(201).json({ user: data.user });
});

app.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json({ error: 'Invalid login credentials' });
  }

  res.status(200).json({
    access_token: data.session?.access_token,
    refresh_token: data.session?.refresh_token,
    user: data.user,
  });
});

app.get('/public/info',(req:Request, res: Response) => {
  res.json({ message: 'Welcome stranger! This info is public.' });
});

app.get('/protected/profile', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }  

  res.status(200).json({ message: 'Token received!'});
});  

app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
            console.log(`✅ Connected to Supabase`);
});
