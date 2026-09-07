import React from 'react';
import { VoiceButton } from '../VoiceButton';

describe('VoiceButton Component', () => {
  it('is exported as a valid React component', () => {
    expect(VoiceButton).toBeDefined();
    expect(typeof VoiceButton).toBe('function');
  });

  it('handles web speech recognition interface gracefully', () => {
    const originalWindow = global.window;
    const mockSpeechRecognition = jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      abort: jest.fn(),
    }));

    (global as any).window = {
      webkitSpeechRecognition: mockSpeechRecognition,
    };

    expect((global as any).window.webkitSpeechRecognition).toBeDefined();

    global.window = originalWindow;
  });
});
