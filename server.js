const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
require("dotenv").config();

const { OpenAI } = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// ---------- AI Extraction API ----------
app.post("/api/extract", async (req, res) => {
  const { title, summary, combinedText } = req.body;

  try {
    const prompt = `
Extract medical information from this text:

TITLE: ${title}
SUMMARY: ${summary}

FULL TEXT:
${combinedText}

Return JSON with:
{
  "symptoms": [...],
  "treatments": [...],
  "prevention": [...],
  "when_to_see_a_doctor": "..."
}
`;

    const ai = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Return ONLY valid JSON." },
        { role: "user", content: prompt }
      ],
      max_tokens: 500
    });

    // parse JSON safely
    const text = ai.choices?.[0]?.message?.content || "{}";
    const json = JSON.parse(text);

    res.json(json);
  } catch (err) {
    console.log("AI error:", err);
    res.json({
      symptoms: [],
      treatments: [],
      prevention: [],
      when_to_see_a_doctor: "Consult a doctor if symptoms worsen."
    });
  }
});

// ---------- Start Server ----------
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on port", port);
});
