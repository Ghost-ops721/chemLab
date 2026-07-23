import { createGroq } from "@ai-sdk/groq";
import { generateText, Output } from "ai";
import { z } from "zod";
import { equationFromRaw } from "@/domains/chemistry/knowledge/tokenize";
import {
  enforceRateLimit,
  requireFirebaseUser,
} from "@/lib/server/requireAuth";
import { logLlmUsage } from "@/lib/server/analytics";
import { enforceOrgQuota } from "@/lib/server/orgs/orgHelpers";

export const maxDuration = 60;

/** ~4MB decoded binary ≈ 5.5M base64 chars */
const MAX_BASE64_CHARS = 5_500_000;

const OcrSchema = z.object({
  equations: z.array(
    z.object({
      raw: z.string(),
      confidence: z.number().nullable(),
      notes: z.string().nullable(),
    }),
  ),
  formulas: z.array(z.string()),
  handwrittenNotes: z.string().nullable(),
});

export type OcrResult = {
  equations: {
    id: string;
    raw: string;
    confidence: number | null;
    notes: string | null;
    tokens: ReturnType<typeof equationFromRaw>["tokens"];
  }[];
  formulas: string[];
  handwrittenNotes: string | null;
  source: "groq-vision" | "fallback";
};

const DEMO_EQUATIONS = [
  "HCl + NaOH → NaCl + H2O",
  "AgNO3 + NaCl → AgCl + NaNO3",
  "Zn + 2HCl → ZnCl2 + H2",
  "CH4 + 2O2 → CO2 + 2H2O",
];

function buildResult(
  equations: { raw: string; confidence: number | null; notes: string | null }[],
  formulas: string[],
  handwrittenNotes: string | null,
  source: OcrResult["source"],
): OcrResult {
  return {
    equations: equations
      .filter((e) => e.raw.trim())
      .map((e, i) => {
        const eq = equationFromRaw(e.raw.trim(), `ocr-${i}`);
        return {
          id: eq.id,
          raw: eq.raw,
          confidence: e.confidence,
          notes: e.notes,
          tokens: eq.tokens,
        };
      }),
    formulas,
    handwrittenNotes,
    source,
  };
}

function fallbackDemo(reason: string): OcrResult {
  return buildResult(
    DEMO_EQUATIONS.map((raw) => ({
      raw,
      confidence: 0.55,
      notes: reason,
    })),
    ["HCl", "NaOH", "AgNO3", "NaCl", "Zn", "CH4"],
    reason,
    "fallback",
  );
}

export async function POST(req: Request) {
  const auth = await requireFirebaseUser(req);
  if ("response" in auth) return auth.response;

  const limited = enforceRateLimit(req, auth.uid, "ocr");
  if (limited) return limited.response;

  const orgQuota = await enforceOrgQuota(auth.uid, "ocr");
  if (orgQuota) return orgQuota;

  let body: {
    imageBase64?: string;
    mediaType?: string;
    demo?: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.demo) {
    return Response.json(
      fallbackDemo("Demo mode — sample equations for exploring the board."),
    );
  }

  if (!body.imageBase64) {
    return Response.json({ error: "Missing imageBase64" }, { status: 400 });
  }

  const rawB64 = body.imageBase64.includes(",")
    ? body.imageBase64.split(",")[1]!
    : body.imageBase64;

  if (rawB64.length > MAX_BASE64_CHARS) {
    return Response.json(
      { error: "Image too large — use a smaller photo (under ~4MB)." },
      { status: 413 },
    );
  }

  const mediaType = body.mediaType?.startsWith("image/")
    ? body.mediaType
    : "image/jpeg";
  const dataUrl = body.imageBase64.startsWith("data:")
    ? body.imageBase64
    : `data:${mediaType};base64,${body.imageBase64}`;

  if (!process.env.GROQ_API_KEY) {
    return Response.json(
      fallbackDemo(
        "Sample equations (OCR offline — GROQ_API_KEY not set on server).",
      ),
    );
  }

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
  const started = Date.now();
  const OCR_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

  try {
    const { output, usage } = await generateText({
      model: groq(OCR_MODEL),
      temperature: 0.1,
      output: Output.object({
        schema: OcrSchema,
        name: "ChemistryOcr",
        description: "OCR of chemistry formulas and equations from an image",
      }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a chemistry OCR specialist. Read ALL chemical formulas and reaction equations in this image (handwritten or printed).

Rules:
- Normalize formulas to ASCII chem notation: H2O, NaOH, Ca(OH)2, SO4^2-, Pb(NO3)2
- Use → for reaction arrows (not = or ->)
- Use + between species
- Include stoichiometric coefficients when visible (e.g. 2HCl)
- Prefer complete equations over fragments when both appear
- List every distinct formula found in "formulas"
- confidence is 0-1 for each equation; null if unsure
- Do NOT invent chemistry that is not visible. Only extract what you see.
- If the image has no chemistry, return empty arrays.`,
            },
            {
              type: "file",
              mediaType: "image",
              data: dataUrl,
            },
          ],
        },
      ],
    });

    logLlmUsage({
      uid: auth.uid,
      route: "ocr",
      model: OCR_MODEL,
      promptTokens: usage?.inputTokens,
      completionTokens: usage?.outputTokens,
      totalTokens: usage?.totalTokens,
      ms: Date.now() - started,
      ok: Boolean(output),
    });

    if (!output) {
      return Response.json(
        fallbackDemo("Vision returned empty — try a clearer photo."),
      );
    }

    return Response.json(
      buildResult(
        output.equations.map((e) => ({
          raw: e.raw,
          confidence: e.confidence,
          notes: e.notes,
        })),
        output.formulas,
        output.handwrittenNotes,
        "groq-vision",
      ),
    );
  } catch (err) {
    console.error("[ocr]", err);
    logLlmUsage({
      uid: auth.uid,
      route: "ocr",
      model: OCR_MODEL,
      ms: Date.now() - started,
      ok: false,
    });
    return Response.json(
      fallbackDemo(
        "OCR request failed — sample equations loaded so you can still explore.",
      ),
    );
  }
}
