import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface GenerationParams {
  modelImage?: string; // base64
  clothingImage?: string; // base64
  accessoryImage?: string; // base64
  productImage?: string; // base64
  aspectRatio: string;
  style: string;
  prompt: string;
}

export async function generateFashionAd(params: GenerationParams): Promise<string[]> {
  const { modelImage, clothingImage, accessoryImage, productImage, aspectRatio, style, prompt } = params;

  const stylePrompts: Record<string, string> = {
    "Default": "A professional fashion advertisement photo.",
    "In-store": "A high-end fashion store interior background, professional lighting.",
    "Product Concept": "A creative product concept shoot with artistic lighting and abstract background.",
    "Packshot": "A clean, studio packshot with white background and sharp focus.",
    "Selfie": "A high-quality mirror selfie style fashion photo, natural lighting.",
  };

  const basePrompt = stylePrompts[style] || stylePrompts["Default"];
  
  // Only generate one high-quality variation to conserve quota
  const fullPrompt = `${stylePrompts[style] || stylePrompts["Default"]} ${prompt}. Maintain the identity of the model and the details of the clothing and accessories provided in the reference images. High resolution, professional fashion photography, 8k, highly detailed, cinematic lighting, editorial style aesthetic.`;

  const results: string[] = [];
  const contents: any[] = [];

  if (modelImage) {
    contents.push({
      inlineData: {
        mimeType: "image/png",
        data: modelImage.split(",")[1] || modelImage,
      },
    });
  }

  if (clothingImage) {
    contents.push({
      inlineData: {
        mimeType: "image/png",
        data: clothingImage.split(",")[1] || clothingImage,
      },
    });
  }

  if (accessoryImage) {
    contents.push({
      inlineData: {
        mimeType: "image/png",
        data: accessoryImage.split(",")[1] || accessoryImage,
      },
    });
  }

  if (productImage) {
    contents.push({
      inlineData: {
        mimeType: "image/png",
        data: productImage.split(",")[1] || productImage,
      },
    });
  }

  contents.push({ text: fullPrompt });

  const executeWithRetry = async (parts: any[], retries = 2, delay = 1000): Promise<any> => {
    try {
      return await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
          },
        },
      });
    } catch (error: any) {
      const isQuotaError = error?.message?.includes("quota") || error?.status === 429;
      if (isQuotaError && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return executeWithRetry(parts, retries - 1, delay * 2);
      }
      throw error;
    }
  };

  try {
    const response = await executeWithRetry(contents);

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          results.push(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    }
  } catch (error: any) {
    if (error?.message?.includes("quota") || error?.status === 429) {
      throw new Error("QUOTA_EXCEEDED");
    }
    throw error;
  }

  if (results.length === 0) throw new Error("No images generated");
  return results;
}
