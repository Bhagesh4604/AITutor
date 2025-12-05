import { Message, AIResponseSchema, Sentiment, SupportedLanguage, StudyResource, QuizQuestion } from "../types";

const API_URL = 'http://localhost:5000/ai';

export const getSocraticResponse = async (
  history: Message[],
  currentMessage: string,
  language: SupportedLanguage = SupportedLanguage.ENGLISH,
  currentAttachment?: { mimeType: string; data: string }
): Promise<AIResponseSchema> => {
  try {
    const response = await fetch(`${API_URL}/socratic-chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            history,
            currentMessage,
            language,
            attachment: currentAttachment,
        }),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback for demo stability
    return {
      tutor_response: language === SupportedLanguage.ENGLISH 
        ? "I'm having trouble connecting to my knowledge base right now. Can you try asking that again?"
        : "System is experiencing high traffic. Please try again in English or wait a moment.", // Simple fallback
      pedagogical_reasoning: "System error fallback triggered.",
      detected_sentiment: Sentiment.NEUTRAL,
      suggested_action: 'NONE'
    };
  }
};

export const generateChatTitle = async (message: string): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/generate-title`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.title || "New Chat";
  } catch (e) {
    return "New Conversation";
  }
};

export const getSpeechForText = async (text: string, voiceName: string = 'Kore'): Promise<Uint8Array | null> => {
    try {
        const response = await fetch(`${API_URL}/text-to-speech`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, voiceName }),
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const audioBlob = await response.blob();
        return new Uint8Array(await audioBlob.arrayBuffer());
    } catch (e) {
        console.error("TTS Error", e);
        return null;
    }
};

export interface ResearchResult {
  summary: string;
  resources: StudyResource[];
}

export const searchStudyResources = async (query: string): Promise<ResearchResult> => {
    try {
        const response = await fetch(`${API_URL}/search-resources`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error("Research Error:", error);
        return { 
            summary: "Sorry, I couldn't connect to the research database at the moment.", 
            resources: [] 
        };
    }
};

export const generateQuizQuestions = async (topic: string, difficulty: 'Easy' | 'Medium' | 'Hard', moduleId: string): Promise<QuizQuestion[]> => {
    try {
        const response = await fetch(`${API_URL}/generate-quiz`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ topic, difficulty, moduleId }),
        });
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error("Quiz Gen Error", error);
        return [];
    }
}

export const transcribeAudio = async (audioBase64: string, mimeType: string = 'audio/webm'): Promise<string> => {
    try {
        const response = await fetch(`${API_URL}/transcribe-audio`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ audioBase64, mimeType }),
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data.text || "No transcription available.";
    } catch (error) {
        console.error("Transcription error:", error);
        throw error;
    }
};