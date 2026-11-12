import type { StudyPack } from './types';

// MERN backend on Render. Defaults to the live URL when VITE_API_URL is unset.
const API_URL = import.meta.env.VITE_API_URL || 'https://vu-studymate-api.onrender.com';
export const configured = true;

const TOKEN_KEY = 'vu_token';
export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
function setToken(token: string) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* storage unavailable */ }
}
export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ }
}

async function api(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...((options.headers as Record<string, string>) || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export type AuthUser = { id: string; name: string; email: string };

export async function register(name: string, email: string, password: string): Promise<AuthUser> {
  const data = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
  setToken(data.token);
  return data.user as AuthUser;
}
export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  setToken(data.token);
  return data.user as AuthUser;
}
export async function getMe(): Promise<AuthUser | null> {
  if (!getToken()) return null;
  try {
    const data = await api('/api/auth/me');
    return data.user as AuthUser;
  } catch {
    clearToken();
    return null;
  }
}
export function signOut() { clearToken(); }

export async function generateStudyPack(source: string, course: string): Promise<StudyPack> {
  if (!getToken()) throw new Error('Sign in first to use real AI generation.');
  const data = await api('/api/generate', { method: 'POST', body: JSON.stringify({ source, course }) });
  return { ...data, mode: 'ai', createdAt: data.createdAt || new Date().toISOString() } as StudyPack;
}

export async function listStudyPacks(): Promise<StudyPack[]> {
  const data = await api('/api/study-packs');
  return (data.packs || []) as StudyPack[];
}
export async function deleteStudyPack(id: string): Promise<void> {
  await api(`/api/study-packs/${id}`, { method: 'DELETE' });
}

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  if (document.numPages > 40) throw new Error('Maximum 40 PDF pages in the pilot.');
  const pages: string[] = [];
  for (let n = 1; n <= document.numPages; n++) {
    const page = await document.getPage(n);
    const content = await page.getTextContent();
    pages.push(`[Page ${n}] ` + content.items.map(x => 'str' in x ? String(x.str) : '').join(' '));
  }
  const text = pages.join('\n\n');
  if (text.trim().length < 100) throw new Error('This PDF has little extractable text. Scanned PDFs need OCR, which is not supported yet.');
  return text;
}
