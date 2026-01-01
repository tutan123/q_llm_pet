import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendToFunctionGemma } from '../functionGemmaService';
import { sendToCustomLLM } from '../customLLMService';
import { LLMSettings } from '../../types';

// Mock global fetch
global.fetch = vi.fn();

describe('Model Protocol Compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('FunctionGemma Protocol (SFT Regex Path)', () => {
    const gemmaSettings: LLMSettings = {
      provider: 'functiongemma',
      baseUrl: 'http://localhost:8000',
      apiKey: '',
      modelName: 'pet-model'
    };

    it('should correctly parse custom regex format from FunctionGemma', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: "I will jump for you! <start_function_call>call:animate_avatar{actions:['JUMP'], emotion:<escape>HAPPY<escape>}<end_function_call>"
          }
        }]
      };

      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const result = await sendToFunctionGemma([], "Jump happy", gemmaSettings);
      
      expect(result.text).toBe("I will jump for you!");
      expect(result.toolResult).toEqual({
        actions: ['JUMP'],
        emotion: 'HAPPY'
      });
    });

    it('should handle missing emotion in FunctionGemma response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: "<start_function_call>call:animate_avatar{actions:['WAVE']}<end_function_call>"
          }
        }]
      };

      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const result = await sendToFunctionGemma([], "Wave", gemmaSettings);
      
      expect(result.toolResult).toEqual({
        actions: ['WAVE']
      });
      // FunctionExecNode will default undefined emotion to NEUTRAL
    });
  });

  describe('OpenAI Protocol (Standard Tool Calls Path)', () => {
    const openaiSettings: LLMSettings = {
      provider: 'custom',
      baseUrl: 'https://api.moonshot.cn/v1',
      apiKey: 'sk-mock-key',
      modelName: 'kimi-k2-0905-preview'
    };

    it('should correctly parse standard tool_calls from OpenAI/Kimi', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: "Sure, I can do that.",
            tool_calls: [{
              function: {
                name: "animate_avatar",
                arguments: JSON.stringify({
                  actions: ["DANCE", "SPIN"],
                  emotion: "EXCITED"
                })
              }
            }]
          }
        }]
      };

      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const result = await sendToCustomLLM([], "Dance and spin excitedly", openaiSettings);
      
      expect(result.text).toBe("Sure, I can do that.");
      expect(result.toolResult).toEqual({
        actions: ["DANCE", "SPIN"],
        emotion: "EXCITED"
      });
    });

    it('should default emotion to NEUTRAL if not provided by OpenAI', async () => {
      const mockResponse = {
        choices: [{
          message: {
            tool_calls: [{
              function: {
                name: "animate_avatar",
                arguments: JSON.stringify({
                  actions: ["BOW"]
                })
              }
            }]
          }
        }]
      };

      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const result = await sendToCustomLLM([], "Bow", openaiSettings);
      
      expect(result.toolResult).toEqual({
        actions: ["BOW"],
        emotion: "NEUTRAL"
      });
    });

    it('should fallback to regex parsing if OpenAI model returns text instead of tool_calls', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: "I will dance for you! [Performing: DANCE, EXCITED]"
          }
        }]
      };

      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const result = await sendToCustomLLM([], "Dance", openaiSettings);
      
      expect(result.text).toBe("I will dance for you!");
      expect(result.toolResult).toEqual({
        actions: ["DANCE"],
        emotion: "EXCITED"
      });
    });

    it('should handle Gemma format in OpenAI response as fallback', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: "call:animate_avatar{actions:['JUMP'], emotion:'HAPPY'}"
          }
        }]
      };

      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const result = await sendToCustomLLM([], "Jump", openaiSettings);
      
      expect(result.toolResult).toEqual({
        actions: ["JUMP"],
        emotion: "HAPPY"
      });
    });
  });
});

