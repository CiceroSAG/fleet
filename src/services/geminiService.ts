import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function transcribeAndProfessionalize(text: string, language: 'en' | 'fr' = 'en') {
  if (!process.env.GEMINI_API_KEY) return text;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `As a professional fleet maintenance manager, rewrite the following field service action description to be technical, clear, and professional. Keep it in ${language === 'en' ? 'English' : 'French'}.
    
    Description: "${text}"`,
  });

  return response.text?.trim() || text;
}

export async function predictEquipmentFailure(historicalData: any[]) {
  if (!process.env.GEMINI_API_KEY) return "AI Forecasting unavailable without API Key.";

  const prompt = `Analyze this equipment maintenance history and predict possible failures in the next 7 days. Focus on critical components like engine, hydraulics, and transmission.
  
  Data: ${JSON.stringify(historicalData.slice(0, 20))}
  
  Provide a concise, high-priority summary with estimated probability.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text?.trim() || "Unable to generate prediction.";
}

export async function generatePMPlan(equipment: any, currentHours: number) {
  if (!process.env.GEMINI_API_KEY) return null;

  const prompt = `Develop a maintenance plan for a ${equipment.manufacturer} ${equipment.model} currenty at ${currentHours} hours.
  Recommend next 3 service intervals and critical checks. Return in JSON format: { plan: [ { hours: number, tasks: string[] } ] }`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return null;
  }
}

export async function getMaintenanceForecast(data: any) {
  if (!process.env.GEMINI_API_KEY) return { summary: "AI Forecasting Unavailable", probability: 0 };

  const prompt = `Based on the following maintenance and operational data, provide a 7-day failure risk assessment.
  Data: ${JSON.stringify(data)}
  Return a brief summary and a risk percentage. JSON: { summary: string, probability: number }`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  try {
    return JSON.parse(response.text || '{"summary": "No data", "probability": 0}');
  } catch (e) {
    return { summary: "Prediction error", probability: 0 };
  }
}
