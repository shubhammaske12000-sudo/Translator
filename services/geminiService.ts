import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TRANSLATION_MODEL, TTS_MODEL } from '../constants';
import { TranslationResult } from '../types';

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

/**
 * Analyzes audio, detects language, and translates it to the target language.
 */
export const translateAudio = async (
  audioBase64: string,
  targetLanguageName: string,
  mimeType: string = 'audio/webm'
): Promise<TranslationResult> => {
  try {
    const prompt = `
      You are an expert simultaneous translator.
      1. Listen to the provided audio carefully.
      2. Detect the language spoken automatically.
      3. Transcribe the audio exactly as spoken (sourceText).
      4. Translate the text into ${targetLanguageName} (translatedText).
      
      Return the result strictly in JSON format.
    `;

    const response = await ai.models.generateContent({
      model: TRANSLATION_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: { type: Type.STRING, description: "Name of the language detected in the audio" },
            sourceText: { type: Type.STRING, description: "Transcription of original audio" },
            translatedText: { type: Type.STRING, description: "Translation in target language" }
          },
          required: ["detectedLanguage", "sourceText", "translatedText"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from translation model");

    return JSON.parse(jsonText) as TranslationResult;

  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
};

/**
 * Transcribes and translates video content.
 */
export const translateVideo = async (
  videoBase64: string,
  mimeType: string,
  targetLanguageName: string
): Promise<string> => {
  try {
    const prompt = `
      Analyze the audio in this video. 
      1. Transcribe the spoken speech.
      2. Translate the speech into ${targetLanguageName}.
      3. Return ONLY the translated text as a single coherent string suitable for text-to-speech generation. Do not include timestamps or speaker labels.
    `;

    const response = await ai.models.generateContent({
      model: TRANSLATION_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: videoBase64
            }
          },
          { text: prompt }
        ]
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Video translation error:", error);
    throw error;
  }
};

/**
 * Converts text to speech using Gemini TTS.
 */
export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: {
        parts: [{ text }]
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' } // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
          }
        }
      }
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      throw new Error("No audio data returned from TTS model");
    }
    
    return audioData;

  } catch (error) {
    console.error("TTS error:", error);
    throw error;
  }
};