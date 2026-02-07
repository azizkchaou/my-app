"use server";

import { buildLoanProfileText } from "@/lib/loans/profile";
import { embedText } from "@/lib/loans/embeddings";
import { ensureLoanVectorStore, findSimilarLoans } from "@/lib/loans/vector-store";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function getLoanReadiness(payload) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY in environment.");
    }

    await ensureLoanVectorStore();

    const profileText = buildLoanProfileText(payload);
    const embedding = await embedText(profileText);
    const similarCases = await findSimilarLoans(embedding, 3);

    const reasoningPrompt = `
You are a financial readiness assistant. This is NOT a loan approval decision.

User profile:
${profileText}

Similar historical cases (evidence):
${similarCases
  .map(
    (item, index) =>
      `Case ${index + 1}: ${buildLoanProfileText(item.data)} (similarity ${item.similarity.toFixed(3)})`
  )
  .join("\n")}

Instructions:
- Compare the user profile with the similar cases.
- Explain similarities and differences.
- Identify affordability strengths and risks.
- Provide a qualitative readiness level: High readiness, Moderate readiness, or Low readiness.
- Provide positive signals, risk signals, and actionable suggestions.
- No numeric scores. No approval guarantees.
- Use respectful, non-judgmental language.

Respond ONLY in valid JSON:
{
  "readinessLevel": "High readiness" | "Moderate readiness" | "Low readiness",
  "summary": "string",
  "positives": ["string"],
  "risks": ["string"],
  "suggestions": ["string"]
}
`;

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: reasoningPrompt }],
        temperature: 0.2,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const result = await response.json();
    const text = result.choices[0]?.message?.content || "";
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    let explanation = null;
    try {
      explanation = JSON.parse(cleanedText);
    } catch (error) {
      throw new Error("Invalid reasoning response format");
    }

    return {
      success: true,
      data: {
        profileText,
        similarCases,
        explanation,
      },
    };
  } catch (error) {
    console.error("Error generating loan readiness:", error);
    throw error;
  }
}
