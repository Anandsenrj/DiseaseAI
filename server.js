// server.js — Advanced NLP Extractor (Render Ready, No OpenAI)
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Serve frontend (Render uses "public" folder)
app.use(express.static(path.join(__dirname, "public")));


// ===============================================================
//   MEDICAL NLP DICTIONARY FOR MULTI-SECTION EXTRACTION
// ===============================================================
const MEDICAL_SECTIONS = {
  symptoms: [
    "symptom", "symptoms", "signs include", "patients may experience",
    "characterized by", "may include"
  ],
  causes: [
    "cause", "causes", "caused by", "results from", "due to"
  ],
  risk_factors: [
    "risk factor", "risk factors", "increases risk", "higher risk", "associated with"
  ],
  diagnosis: [
    "diagnosis", "diagnosed by", "identified using", "examination",
    "test", "screening", "evaluation"
  ],
  complications: [
    "complication", "complications", "may lead to", "can result in",
    "long-term effects"
  ],
  treatments: [
    "treatment", "treatments", "therapy", "managed with", "surgery",
    "procedure", "drug", "medication", "management"
  ],
  prevention: [
    "prevention", "prevent", "avoid", "reduce risk",
    "protective measures", "risk reduction"
  ]
};


// ===============================================================
//  HELPERS — NLP Sentence Extraction
// ===============================================================
function extractSentences(text, keywords) {
  const sentences = text.split(/[\.\n]/g);
  const results = [];

  for (let s of sentences) {
    const lower = s.toLowerCase();
    for (let key of keywords) {
      if (lower.includes(key) && s.trim().length > 6) {
        results.push(s.trim());
        break;
      }
    }
  }

  return Array.from(new Set(results)).slice(0, 8);
}

function extractBullets(text) {
  return text.split(/[\n•\-]/g)
    .map(x => x.trim())
    .filter(x => x.length > 5)
    .slice(0, 8);
}


// ===============================================================
//  API: EXTRACT FULL MEDICAL SECTIONS
// ===============================================================
app.post("/api/extract", async (req, res) => {
  try {
    const { combinedText } = req.body;

    if (!combinedText) {
      return res.json({ error: "No text received." });
    }

    const clean = combinedText
      .replace(/<\/?[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const bullets = extractBullets(clean);
    const output = {};

    for (const section in MEDICAL_SECTIONS) {
      const main = extractSentences(clean, MEDICAL_SECTIONS[section]);

      const relatedBullets = bullets.filter(b =>
        MEDICAL_SECTIONS[section].some(k =>
          b.toLowerCase().includes(k)
        )
      );

      output[section] =
        Array.from(new Set([...main, ...relatedBullets])).slice(0, 10);
    }

    return res.json({
      ...output,
      when_to_see_a_doctor:
        "Seek medical attention if symptoms worsen or persist.",
      notes: "Extracted using advanced NLP (no AI required)."
    });

  } catch (err) {
    console.error("NLP Extraction Error:", err);
    res.status(500).json({ error: "NLP processing failed." });
  }
});


// ===============================================================
//  START SERVER (Render Port)
// ===============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
