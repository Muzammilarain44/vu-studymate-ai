import { describe, expect, it } from 'vitest';
import { demoPack, sampleLecture } from './demo';
describe('study sample',()=>{
  it('has grounded demo quotes',()=>{for(const c of demoPack.concepts)expect(sampleLecture).toContain(c.sourceQuote);for(const q of demoPack.questions)expect(sampleLecture).toContain(q.sourceQuote)});
  it('has four options and valid answers',()=>{for(const q of demoPack.questions){expect(q.options).toHaveLength(4);expect(q.correctIndex).toBeGreaterThanOrEqual(0);expect(q.correctIndex).toBeLessThan(4)}});
});