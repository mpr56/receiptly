import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

function getGroqClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY ?? "placeholder" });
}

const SYSTEM_PROMPT = `You are a receipt parser. Analyse the receipt image and return ONLY valid JSON, no markdown, no backticks, no explanation.

Return this exact structure:
{
  "storeName": "string, business name only in title case, no address or ABN",
  "date": "string, YYYY-MM-DD format, or empty string if not found",
  "time": "string, HH:MM in 24hr format, or empty string if not found",
  "totalAmount": number,
  "paymentMethod": "card" | "cash" | "digital",
  "items": [
    {
      "name": "string, clean item name, no asterisks or special chars",
      "quantity": number,
      "unitPrice": number
    }
  ],
  "confidence": {
    "storeName": number,
    "date": number,
    "total": number,
    "items": number
  }
}

Rules:
- storeName: business name only. Fix OCR noise (e.g. "ALEX & C0" → "Alex & Co", "Adid4s" → "Adidas")
- totalAmount: use TOTAL or AMOUNT PAID line, after discounts and surcharges, not subtotal
- items: purchasable line items only. Exclude surcharges, GST lines, service charges, subtotals, payment lines
- paymentMethod: "card" for eftpos/visa/mastercard/tap/zeller, "digital" for Apple Pay/Google Pay/PayPal, "cash" for cash
- quantities: use QTY column if present, default to 1
- unitPrice: if qty > 1, divide line total by quantity. Round to 2 decimal places
- Remove asterisks (*) from all item names
- confidence scores: 0.9+ clearly readable, 0.6–0.8 partially readable, 0.3–0.5 inferred, 0 not found`;

export async function POST(req: NextRequest) {
  try {
    const { imageDataUrl } = await req.json();

    if (!imageDataUrl) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }

    // Strip data URL prefix → base64 + mime type
    const base64Match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }
    const mimeType = base64Match[1] as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
    const base64Data = base64Match[2];

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      temperature: 0.1,
      max_tokens: 1500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
              },
            },
            {
              type: "text",
              text: "Parse this receipt and return the JSON.",
            },
          ],
        },
      ],
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Scan API error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to scan receipt: ${message}` },
      { status: 500 }
    );
  }
}
