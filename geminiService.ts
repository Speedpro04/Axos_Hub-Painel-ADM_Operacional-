
import { GoogleGenAI, Type } from "@google/genai";

// Use process.env.API_KEY directly and initialize GoogleGenAI per-request to ensure consistency and correctness.
export const summarizeMedicalNotes = async (notes: string): Promise<string> => {
  if (!notes) return "Sem notas para resumir.";
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Resuma o seguinte prontuário médico de forma profissional e concisa em tópicos curtos: "${notes}"`,
      config: {
        systemInstruction: "Você é um assistente médico inteligente da Axos Hub. Forneça resumos executivos focados em diagnóstico, tratamento e próximos passos."
      }
    });
    // Access response.text directly (property, not a function)
    return response.text || "Não foi possível gerar o resumo.";
  } catch (error) {
    console.error("Gemini Summarization Error:", error);
    return "Erro ao processar resumo via IA.";
  }
};

export const analyzeSymptoms = async (symptoms: string): Promise<{ isUrgent: boolean; reasoning: string }> => {
  if (!symptoms) return { isUrgent: false, reasoning: "" };
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      // Use Pro model for medical triage which requires advanced reasoning
      model: 'gemini-3-pro-preview',
      contents: `Analise os seguintes sintomas e determine se o caso é de urgência (true/false) e o porquê: "${symptoms}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isUrgent: { 
              type: Type.BOOLEAN, 
              description: "Se o caso deve ser tratado como urgência" 
            },
            reasoning: { 
              type: Type.STRING, 
              description: "Breve explicação do motivo" 
            }
          },
          required: ["isUrgent", "reasoning"]
        },
        systemInstruction: "Você é um especialista em triagem médica da Axos Hub. Analise sintomas com precisão e rapidez para clínicas de alto padrão."
      }
    });
    // For application/json responseMimeType, the output is directly the JSON string
    const jsonStr = response.text || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Symptom Analysis Error:", error);
    return { isUrgent: false, reasoning: "Falha na análise técnica via IA." };
  }
};
