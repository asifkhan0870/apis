require("dotenv").config();
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());

app.use(cors());

const resultsDir = path.join(__dirname, "results");
if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir);

async function queryAnthropic(userPrompt) {
  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-haiku-20240307",
        max_tokens: 400,

        system: `
  You are a factual local assistant.

Use ONLY the information provided or commonly verified public knowledge.
DO NOT invent addresses, timings, ratings, phone numbers, or landmarks.

If multiple locations exist:
- Clearly list each location separately.
- Do not merge them into one.

If data is uncertain:
- Say "appears to be", "based on available listings", or "commonly reported".

Transform the information into a clean, readable local guide summary.

Format EXACTLY like this:

Intro sentence (mention area and what was found).

Location:
<exact address or description as found>

Timings:
<exact hours as listed>

Pricing:
<average cost if available>

Contact:
<email / phone / website if listed>

Features:
- bullet points (ONLY from known data)

Rating:
<rating + review count if available>

Rules:
- Never assume 24-hour operation
- Never change malls or landmarks
- Never upgrade ratings
- Never fabricate phone numbers
- Accuracy > polish






`,

        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      },
      {
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      }
    );

    const text =
      response.data?.content
        ?.map((c) => c.text)
        .join("\n")
        .trim() || "";

    return {
      ok: true,
      provider: "anthropic",
      model: "claude-3-haiku",
      text,
    };
  } catch (err) {
    return {
      ok: false,
      provider: "anthropic",
      error: err.response?.data || err.message,
    };
  }
}

app.post("/query-anthropic", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  const result = await queryAnthropic(prompt);

  res.json({
    prompt,
    checkedAt: new Date().toISOString(),
    result,
  });
});

app.listen(4000, () => {
  console.log("Server is running at port 4000");
});
