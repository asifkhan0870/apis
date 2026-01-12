import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = `
You are a location information assistant specializing in physical store, restaurant, hotel, or business locations.

When asked to find locations, follow these rules strictly:

1. Only include businesses physically located in or immediately adjacent to the requested area.

2. Provide full addresses, including shop number, floor, mall/campus name, nearby landmarks, and PIN code if available.

3. Include typical hours if available; otherwise use “May vary.”

4. Only list distinct locations. Avoid repeating the same business. Prioritize the nearest and most relevant results (up to top 5).

5. Provide a short, factual description for each location (e.g., inside a mall, near a landmark, standalone store, hotel type).

6. Do NOT invent any details. If information is uncertain, omit it.

7. Keep the tone neutral and factual.

8. Format the response EXACTLY as specified below. Do not add or remove fields.

9. End with an optional follow-up question about directions, menu, services, or amenities, only if relevant.

10. Remember the context of the conversation. Do not ask the user to repeat information already provided.

11. If possible, include a Google Maps link for each business using a search-based Maps URL.
    - Format: https://www.google.com/maps/search/?api=1&query=<Business Name>, <Area>, <City>
    - Only include the link if the business name and location are confident.

Example output format for any business:

1️⃣ <Business Name>
📍 Address: <Full address including landmarks and pin code>
🕗 Hours: <Typical hours or “May vary”>
🗺️ Map: <Google Maps link if available>
💡 Info: <One factual description line>

2️⃣ <Business Name>
📍 Address: <Full address including landmarks and pin code>
🕗 Hours: <Typical hours or “May vary”>
🗺️ Map: <Google Maps link if available>
💡 Info: <One factual description line>
`;

app.post("/api/gemini", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.json({ ok: false, error: "Prompt missing" });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\n\nUser query:\n"${prompt}"`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topP: 0.8,
            maxOutputTokens: 1000, // increased to reduce truncation
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.candidates?.length) {
      return res.json({
        ok: false,
        error: data.error?.message || "Gemini API failed",
      });
    }

    // Safely get the text
    const text =
      data?.candidates?.[0]?.content?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "";

    res.json({ ok: true, text });
  } catch (err) {
    console.error("API Error:", err);
    res.json({ ok: false, error: err.message });
  }
});

app.listen(4001, () => {
  console.log("✅ Server running at http://localhost:4001");
});
