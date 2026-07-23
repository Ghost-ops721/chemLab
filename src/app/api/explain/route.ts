import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { getFallbackExplanation } from "@/domains/chemistry/data/explanations";

export const maxDuration = 30;

interface ExplainBody {
  discoveryId: string;
  label?: string;
  explanationKey?: string;
  effects?: { kind: string; value?: string; intensity?: string }[];
  reactants?: string[];
  products?: { id: string; name: string }[];
  ok: boolean;
}

export async function POST(req: Request) {
  const body = (await req.json()) as ExplainBody;

  if (!body?.discoveryId) {
    return new Response("Missing discoveryId", { status: 400 });
  }

  const fallback = getFallbackExplanation(body.explanationKey);

  if (!process.env.GROQ_API_KEY) {
    return new Response(fallback, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

  const system = `You are a friendly high-school chemistry lab tutor for Chem Lab.
You MUST stay faithful to the structured reaction data provided.
Never invent different products, equations, or reaction types.
If ok is false, explain only the hazard / why the mix was blocked.
Keep the answer to 2-4 short sentences, plain language, no markdown headings.`;

  const prompt = JSON.stringify({
    equation: body.label,
    explanationKey: body.explanationKey,
    effects: body.effects,
    reactants: body.reactants,
    products: body.products,
    ok: body.ok,
  });

  try {
    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      system,
      prompt: `Explain this lab result to a student:\n${prompt}`,
      temperature: 0.4,
    });

    return result.toTextStreamResponse();
  } catch {
    return new Response(fallback, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
