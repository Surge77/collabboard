import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildAnalyzePrompt, buildGeneratePrompt, getGeminiModel } from '@/lib/ai';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('buildGeneratePrompt', () => {
  it('embeds the user request', () => {
    expect(buildGeneratePrompt('a login flow')).toContain('a login flow');
  });
});

describe('buildAnalyzePrompt', () => {
  it('handles an empty board', () => {
    expect(buildAnalyzePrompt([])).toMatch(/empty/i);
  });

  it('lists shape types when present', () => {
    const prompt = buildAnalyzePrompt([{ type: 'rectangle', text: 'Start' }]);
    expect(prompt).toContain('rectangle');
    expect(prompt).toContain('Start');
  });
});

describe('getGeminiModel', () => {
  it('returns null when the API key is missing', () => {
    vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', '');
    expect(getGeminiModel()).toBeNull();
  });

  it('returns a model when the API key is present', () => {
    vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'test-key');
    expect(getGeminiModel()).not.toBeNull();
  });
});
