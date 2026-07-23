import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { getFallbackExplanation } from "@/domains/chemistry/data/explanations";
import {
  enforceRateLimit,
  requireFirebaseUser,
} from "@/lib/server/requireAuth";
import { logLlmUsage } from "@/lib/server/analytics";
import { enforceOrgQuota } from "@/lib/server/orgs/orgHelpers";

export const maxDuration = 30;

const MODEL = "llama-3.3-70b-versatile";

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
  const auth = await requireFirebaseUser(req);
  if ("response" in auth) return auth.response;

  const limited = enforceRateLimit(req, auth.uid, "explain");
  if (limited) return limited.response;

  const orgQuota = await enforceOrgQuota(auth.uid, "explain");
  if (orgQuota) return orgQuota;

  let body: ExplainBody;
  try {
    body = (await req.json()) as ExplainBody;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!body?.discoveryId) {
    return new Response("Missing discoveryId", { status: 400 });
  }

  const fallback = getFallbackExplanation(body.explanationKey);

  if (!process.env.GROQ_API_KEY) {
    return new Response(fallback, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Explain-Source": "fallback",
      },
    });
  }

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
  const started = Date.now();

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
      model: groq(MODEL),
      system,
      prompt: `Explain this lab result to a student:\n${prompt}`,
      temperature: 0.4,
      onFinish: ({ usage }) => {
        logLlmUsage({
          uid: auth.uid,
          route: "explain",
          model: MODEL,
          promptTokens: usage?.inputTokens,
          completionTokens: usage?.outputTokens,
          totalTokens: usage?.totalTokens,
          ms: Date.now() - started,
          ok: true,
        });
      },
    });

    return result.toTextStreamResponse();
  } catch {
    logLlmUsage({
      uid: auth.uid,
      route: "explain",
      model: MODEL,
      ms: Date.now() - started,
      ok: false,
    });
    return new Response(fallback, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Explain-Source": "fallback",
      },
    });
  }
}
