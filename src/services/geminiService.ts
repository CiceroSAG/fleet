import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getMaintenanceForecast(fleetData: any) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Analyze the following fleet maintenance and fuel data to predict potential failures or upcoming maintenance needs for specific equipment.
        
        Fleet Data:
        ${JSON.stringify(fleetData)}
        
        Provide a JSON response with the following structure:
        {
          "recommendations": [
            {
              "equipment_id": "string",
              "asset_tag": "string",
              "prediction": "string (short prediction of what might fail)",
              "reasoning": "string (why, based on data trends)",
              "urgency": "low" | "medium" | "high" | "critical",
              "recommended_action": "string"
            }
          ]
        }
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  equipment_id: { type: Type.STRING },
                  asset_tag: { type: Type.STRING },
                  prediction: { type: Type.STRING },
                  reasoning: { type: Type.STRING },
                  urgency: { type: Type.STRING },
                  recommended_action: { type: Type.STRING }
                },
                required: ["equipment_id", "asset_tag", "prediction", "reasoning", "urgency", "recommended_action"]
              }
            }
          },
          required: ["recommendations"]
        }
      }
    });

    return JSON.parse(response.text || '{"recommendations": []}');
  } catch (error) {
    console.error("Gemini Forecasting Error:", error);
    return { recommendations: [] };
  }
}

export async function getRootCauseAnalysis(incidentData: any) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Analyze this incident and fleet history to identify the root cause and suggest preventive measures.
        
        Incident: ${JSON.stringify(incidentData)}
        
        Return JSON structure:
        {
          "root_cause": "string",
          "contributing_factors": ["string"],
          "preventive_actions": ["string"],
          "severity_analysis": "string"
        }
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            root_cause: { type: Type.STRING },
            contributing_factors: { type: Type.ARRAY, items: { type: Type.STRING } },
            preventive_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
            severity_analysis: { type: Type.STRING }
          },
          required: ["root_cause", "contributing_factors", "preventive_actions"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Root Cause Error:", error);
    return null;
  }
}

export async function detectTelematicsAnomalies(telemetryData: any) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Analyze these telematics logs for anomalies in driver behavior or machine performance.
        Data: ${JSON.stringify(telemetryData)}
        
        Return JSON structure:
        {
          "anomalies": [
            {
              "type": "behavior" | "performance",
              "description": "string",
              "confidence": number (0-1),
              "impact_score": number (1-10)
            }
          ]
        }
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            anomalies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  description: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  impact_score: { type: Type.NUMBER }
                },
                required: ["type", "description", "confidence", "impact_score"]
              }
            }
          },
          required: ["anomalies"]
        }
      }
    });
    return JSON.parse(response.text || '{"anomalies": []}');
  } catch (error) {
    console.error("Gemini Anomaly Error:", error);
    return { anomalies: [] };
  }
}
