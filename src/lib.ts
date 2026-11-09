import { createClient } from '@supabase/supabase-js';
import type { StudyPack } from './types';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const configured=Boolean(url && key);
export const supabase=configured?createClient(url,key):null;
export async function generateStudyPack(source:string,course:string):Promise<StudyPack>{
  if(!supabase) throw new Error('AI is not configured. Set up Supabase to enable real generation.');
  const {data:{session}}=await supabase.auth.getSession();
  if(!session) throw new Error('Sign in first to use real AI generation.');
  const {data,error}=await supabase.functions.invoke('study-generate',{body:{source,course}});
  if(error)throw new Error(error.message || 'Unable to generate study materials.');
  if(data?.error)throw new Error(data.error);
  return {...data,mode:'ai',createdAt:new Date().toISOString()} as StudyPack;
}
export async function extractPdfText(file:File):Promise<string>{
  const pdfjs=await import('pdfjs-dist');
  const worker=await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc=worker.default;
  const document=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
  if(document.numPages>40)throw new Error('Maximum 40 PDF pages in the pilot.');
  const pages:string[]=[];
  for(let n=1;n<=document.numPages;n++){
    const page=await document.getPage(n);
    const content=await page.getTextContent();
    pages.push(`[Page ${n}] `+content.items.map(x=>'str' in x?String(x.str):'').join(' '));
  }
  const text=pages.join('\n\n');
  if(text.trim().length<100)throw new Error('This PDF has little extractable text. Scanned PDFs need OCR, which is not supported yet.');
  return text;
}
