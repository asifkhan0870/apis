require("dotenv").config();
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

// Ensure results dir exists
const resultsDir = path.join(__dirname, "results");
if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir);

// Helper: call OpenAI (Chat Completion)

// async function callOpenAI(prompt) {
//   const url = "https://api.openai.com/v1/chat/completions";
//   const body = {
//     model: "gpt-4o", // replace with model you have access to
//     messages: [{ role: "user", content: prompt }],
//     max_tokens: 512,
//     temperature: 0.2,
//   };
//   const headers = {
//     Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//     "Content-Type": "application/json",
//   };

//   const resp = await axios.post(url, body, { headers });
//   // adapt to the provider response structure
//   const text =
//     resp.data.choices?.[0]?.message?.content ?? resp.data.choices?.[0]?.text;
//   return {
//     provider: "openai",
//     model: body.model,
//     text,
//     raw: resp.data,
//   };
// }

// Helper: call Cohere (text generation)

async function queryCohere(prompt) {
  try {
    const response = await axios.post(
      "https://api.cohere.ai/v1/chat",
      {
        model: "command",
        message: prompt,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const text = response.data?.message?.content?.[0]?.text || "";

    return {
      ok: true,
      provider: "cohere-chat",
      model: "command",
      text,
    };
  } catch (err) {
    return {
      ok: false,
      provider: "cohere-chat",
      error: err.response?.data || err.message,
    };
  }
}

//(Optional) Helper: call Anthropic - check current endpoint/model names in their docs

// async function callAnthropic(prompt) {
//   const url = "https://api.anthropic.com/v1/complete"; // verify with Anthropic docs
//   const body = {
//     model: "claude-2", // replace with available model
//     prompt,
//     max_tokens: 512,
//     temperature: 0.2,
//   };
//   const headers = {
//     Authorization: `Bearer ${process.env.ANTHROPIC_API_KEY}`,
//     "Content-Type": "application/json",
//   };

//   const resp = await axios.post(url, body, { headers });
//   // adapt per Anthropic response format
//   const text = resp.data?.completion ?? resp.data?.output;
//   return {
//     provider: "anthropic",
//     model: body.model,
//     text,
//     raw: resp.data,
//   };
// }

app.post("/query-llms", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  try {
    const result = await queryCohere(prompt);

    const output = {
      prompt,
      checkedAt: new Date().toISOString(),
      results: [result],
      combinedSummary: result.ok ? result.text : "",
    };

    const filePath = path.join(resultsDir, `llm-results-${Date.now()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2));

    return res.json(output);
  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
});

app.listen(4000, () =>
  console.log("LLM aggregator running on http://localhost:4000")
);
