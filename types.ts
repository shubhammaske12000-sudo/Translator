export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export interface TranslationResult {
  detectedLanguage: string;
  sourceText: string;
  translatedText: string;
}

export enum AppState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING', // Translating
  SPEAKING = 'SPEAKING', // TTS playing
  DUBBING = 'DUBBING', // Video processing
  ERROR = 'ERROR'
}

export interface GeminiError {
  message: string;
}