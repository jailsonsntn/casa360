
import { GoogleGenAI, Type } from "@google/genai";
import { Task, Transaction } from "../types";

// Proteção para evitar crash se process.env não estiver pronto
const getApiKey = () => (typeof process !== 'undefined' && process.env?.API_KEY) || '';

export const getHomeInsights = async (tasks: Task[], transactions: Transaction[]) => {
  const apiKey = getApiKey();
  if (!apiKey) return { spendingInsights: "Configuração pendente.", maintenanceSuggestions: "API Key não encontrada." };
  
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    You are an expert home management consultant. 
    Analyze the following home data and provide concise, actionable insights for the user.
    
    Current Tasks: ${JSON.stringify(tasks.filter(t => t.status === 'pending'))}
    Recent Transactions: ${JSON.stringify(transactions.slice(0, 10))}

    Please provide your output in JSON format with two fields:
    1. spendingInsights: A short analysis of recent spending and suggestions to save.
    2. maintenanceSuggestions: Suggestions for home maintenance based on current pending tasks or typical seasonal needs.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            spendingInsights: { type: Type.STRING },
            maintenanceSuggestions: { type: Type.STRING }
          },
          required: ["spendingInsights", "maintenanceSuggestions"]
        }
      },
    });

    const jsonStr = response.text?.trim() || '{}';
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      spendingInsights: "Análise temporariamente indisponível.",
      maintenanceSuggestions: "Dicas de manutenção não puderam ser geradas agora."
    };
  }
};

export interface WeatherData {
  temp: string;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'storm' | 'snow';
  description: string;
  advice: string;
}

export const getWeatherInfo = async (city: string, state: string): Promise<WeatherData | null> => {
  if (!city || !state) return null;
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Consulte o clima atual para a localização: ${city}, ${state}. 
  Retorne um JSON com:
  1. temp: a temperatura atual em Celsius (ex: "26°C").
  2. condition: mapeie para um destes: "sunny", "cloudy", "rainy", "storm", "snow".
  3. description: uma descrição curta (ex: "Céu Limpo").
  4. advice: um conselho doméstico curto baseado no clima (ex: "Ótimo dia para lavar roupas" ou "Leve o guarda-chuva").`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            temp: { type: Type.STRING },
            condition: { type: Type.STRING },
            description: { type: Type.STRING },
            advice: { type: Type.STRING }
          },
          required: ["temp", "condition", "description", "advice"]
        }
      },
    });

    const jsonStr = response.text?.trim() || '{}';
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Weather Gemini Error:", error);
    return null;
  }
};
