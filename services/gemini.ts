
import { GoogleGenAI } from "@google/genai";

// Always initialize GoogleGenAI with a fresh instance inside functions to ensure correct API key usage
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

/**
 * Fetches pharmacological summary for a medicine.
 */
export const getMedicineInsights = async (medicineName: string) => {
  const ai = getAIClient();
  if (!ai) return "AI Key not configured. Please ensure you are running in a supported environment.";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Provide a concise pharmacological summary for ${medicineName}. Include: 
      1. Clinical Uses
      2. Common Side Effects
      3. Key Contraindications
      4. Standard Dosage Range
      5. Important Interactions`,
      config: {
        systemInstruction: "You are a professional medical pharmacology expert. Provide professional and accurate medical summaries. Remind the user that this is for informational purposes only and they should consult a doctor for official advice.",
        temperature: 0.2,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to fetch insights at this time. Please check your connection.";
  }
};

/**
 * Handles chat queries for the Pharmacy Assistant.
 */
export const getPharmacyAssistantResponse = async (query: string, inventoryContext: string) => {
  const ai = getAIClient();
  if (!ai) return "AI Assistant is currently offline (Key missing).";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: query,
      config: {
        systemInstruction: `You are a professional Pharmacy Assistant AI. Your goal is to help staff with drug information and stock status.
        Here is the current relevant inventory context: ${inventoryContext}. 
        Be professional, accurate, and concise. Highlight any stock warnings if mentioned.`,
        temperature: 0.4,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble thinking right now. Please try asking again.";
  }
};
