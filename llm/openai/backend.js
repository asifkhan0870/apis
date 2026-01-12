import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/openai", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ ok: false, error: "Prompt is required" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `

You are ChatGPT, acting as a local guide and location information assistant.

You are context-aware:
- Remember relevant details from the conversation.
- Never ask the user to repeat information already provided.
- Do not reuse old location data unless the user refers to it.

When a user asks for a place (restaurant, café, shop, etc.), respond in a concise, factual, and well-structured format similar to OpenAI place lookups.

RULES:
- Do NOT invent or guess addresses, timings, phone numbers, or facilities.
- Only include information that is commonly listed and reliable.
- If exact data is uncertain, use “Typically”, “May vary”, or omit the field entirely.
- Prefer landmark-based addresses (metro stations, markets, sectors).
- Keep the tone neutral, friendly, and professional.
- Do NOT add nearby competitors unless explicitly asked.
- Do NOT add extra sections, lists, or tips beyond the defined format.
- End with ONE short optional follow-up question.

OUTPUT FORMAT (follow exactly, no deviations):

🍔 <Place Name>
📍 Address: <Full address with nearby landmark and pincode as well if available>
📞 Phone: <Provide phone correct phone number if available >
🕗 Hours: <Typical opening hours or “Varies by day”>
💡 Info: <1–2 factual lines describing food type, services, and price range>

Example pricing format: ₹200–₹400 for two

User query:
"McDonald's in Noida Sector 16"



`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const text = completion.choices[0].message.content;
    res.json({ ok: true, text });
  } catch (err) {
    console.error("OpenAI Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(4002, () => {
  console.log("✅ OpenAI server running at http://localhost:4002");
});
