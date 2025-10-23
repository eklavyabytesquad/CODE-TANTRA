import { supabase } from './supabase';

// Simple hash function for demo (in production, use server-side bcrypt)
export async function hashPassword(password) {
  // For demo purposes - in production, hash on server side
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createUser({ email, password, name, role = 'student' }) {
  const hashed = await hashPassword(password);
  const { data, error } = await supabase
    .from('users')
    .insert([{ email, password: hashed, name, role }])
    .select('id,email,name,role')
    .single();

  if (error) throw error;
  return data;
}

export async function authenticateUser({ email, password }) {
  const hashed = await hashPassword(password);
  const { data, error } = await supabase
    .from('users')
    .select('id,email,password,name,role')
    .eq('email', email)
    .single();

  if (error || !data) throw new Error('Invalid credentials');
  if (data.password !== hashed) throw new Error('Invalid credentials');

  return { id: data.id, email: data.email, name: data.name, role: data.role };
}

export async function createSession(userId, ttlHours = 24) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();

  const { data, error } = await supabase
    .from('sessions')
    .insert([{ user_id: userId, token, expires_at: expiresAt }])
    .select('id,token,expires_at')
    .single();

  if (error) throw error;
  return data;
}

export async function getUserByToken(token) {
  const { data: session, error: sessionErr } = await supabase
    .from('sessions')
    .select('id,token,expires_at,user_id')
    .eq('token', token)
    .single();

  if (sessionErr || !session) return null;
  if (new Date(session.expires_at) < new Date()) return null;

  const { data: user } = await supabase
    .from('users')
    .select('id,email,name,role,created_at')
    .eq('id', session.user_id)
    .single();

  return user || null;
}

// Helper to generate random token
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
