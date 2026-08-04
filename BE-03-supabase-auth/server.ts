import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import openapi from './openapi.json';
import { verifyToken, AuthRequest } from './middleware.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Supabase client
const supabase = createClient(
      process.env.SUPABASE_URL!,
        process.env.SUPABASE_KEY!
);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));

// Health check
app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', service: 'auth-api' });
});

app.post('/auth/signup', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required'});
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

app.get('/public/info',(req: Request, res: Response) => {
  res.json({ message: 'Welcome stranger! This info is public.' });
});

app.get('/protected/profile', verifyToken, async(req: AuthRequest, res: Response) => {
  const user = req.user;
  return res.status(200).json({
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
    });
});
app.get('/protected/dashboard', verifyToken, async (req: AuthRequest, res: Response) => {
  const user = req.user;
  return res.json({
    message: `Welcome ${user.email}! This is your dashboard.`,
    user_id: user.id,
  });
});
app.post('/auth/logout', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    await supabase.auth.signOut();
    
    return res.status(204).send();
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Connected to Supabase`);
      console.log(`Swagger UI: http://localhost:${PORT}/docs`);
});
