// Deploy with: supabase functions deploy study-generate
// Set GEMINI_API_KEY using `supabase secrets set GEMINI_API_KEY=...`.
// Supabase Auth is required. NEVER expose GEMINI_API_KEY to the browser.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...headers,'Content-Type':'application/json'}});
const MAX=15000;
Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers});
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  const apiKey=Deno.env.get('GEMINI_API_KEY');const supabaseUrl=Deno.env.get('SUPABASE_URL');const anonKey=Deno.env.get('SUPABASE_ANON_KEY');
  if(!apiKey||!supabaseUrl||!anonKey)return json({error:'AI backend is not fully configured'},503);
  const auth=req.headers.get('authorization');
  if(!auth?.startsWith('Bearer '))return json({error:'Sign in required'},401);
  const client=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:auth}}});
  const {data:{user},error:userError}=await client.auth.getUser(auth.slice(7));
  if(userError||!user)return json({error:'Invalid session'},401);
  let body:unknown;try{body=await req.json()}catch{return json({error:'Invalid JSON'},400)}
  if(!body||typeof body!=='object')return json({error:'Invalid request'},400);
  const {source,course}=body as Record<string,unknown>;
  if(typeof source!=='string'||source.trim().length<100||source.length>MAX||typeof course!=='string'||course.length>25)return json({error:'Lecture text must be 100–15,000 characters and course under 25 characters'},400);
  // Atomic per-user daily quota; requires migration 001_ai_usage.sql.
  const {data:allowed,error:quotaErr}=await client.rpc('claim_ai_generation');
  if(quotaErr)return json({error:'Usage protection not configured. Apply Supabase SQL migration.'},503);
  if(!allowed)return json({error:'Daily free pilot limit reached (3 generations). Try tomorrow.'},429);
  const prompt=`You are an accurate study assistant for Pakistani Virtual University students. Use ONLY the lecture source below. If not in source, do not invent it. Explain concepts clearly in simple English; no claims of guaranteed exam questions. Return ONLY strict JSON with keys: title (string), summary (string, 80-180 words), takeaways (array of 3-6 strings), concepts (array of 3-6 objects {title,explanation,importance,sourceQuote}), questions (array of exactly 5 objects {question,options:[four non-duplicate options],correctIndex:0-3,explanation,sourceQuote}). Every sourceQuote must be a verbatim contiguous substring of the lecture (under 150 characters); provide concise explanations. Course: ${course}
LECTURE:
${source}`;
  try{
    const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',temperature:0.25,maxOutputTokens:3500}})});
    if(!response.ok){const err=await response.text();console.error('AI API failed',response.status,err.slice(0,300));return json({error:response.status===429?'AI free-tier limit reached. Try again later.':'AI provider error. Please retry later.'},502)}
    const payload=await response.json();const result=JSON.parse(payload.candidates?.[0]?.content?.parts?.[0]?.text??'null');
    if(!result||typeof result.summary!=='string'||!Array.isArray(result.takeaways)||!Array.isArray(result.concepts)||!Array.isArray(result.questions)||result.questions.length<1)return json({error:'Invalid AI response, please retry.'},502);
    const cleanQuote=(q:unknown)=>typeof q==='string'&&source.includes(q)?q:'Source quote unavailable — verify against lecture';
    const concepts=result.concepts.slice(0,6).map((c:Record<string,unknown>)=>({title:String(c.title??''),explanation:String(c.explanation??''),importance:String(c.importance??''),sourceQuote:cleanQuote(c.sourceQuote)}));
    const questions=result.questions.slice(0,5).filter((q:Record<string,unknown>)=>Array.isArray(q.options)&&q.options.length===4&&Number.isInteger(q.correctIndex)&&Number(q.correctIndex)>=0&&Number(q.correctIndex)<=3).map((q:Record<string,unknown>)=>({question:String(q.question??''),options:q.options,correctIndex:q.correctIndex,explanation:String(q.explanation??''),sourceQuote:cleanQuote(q.sourceQuote)}));
    if(!questions.length)return json({error:'AI returned invalid quiz data'},502);
    return json({title:String(result.title??course+' study notes'),summary:result.summary,takeaways:result.takeaways.slice(0,6).map(String),concepts,questions});
  }catch(e){console.error('Generation error',e);return json({error:'Could not generate study materials. Please retry.'},502)}
});
