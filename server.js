// server.js — Advanced NLP Medical Extractor (NO AI)
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));


// ===============================================================
//   MEDICAL NLP DICTIONARY
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
    "diagnosis", "diagnosed by", "identified using", "examination", "test", "screening"
  ],
  complications: [
    "complication", "complications", "may lead to", "can result in"
  ],
  treatments: [
    "treatment", "treatments", "therapy", "managed with",
    "surgery", "procedure", "drug", "medication"
  ],
  prevention: [
    "prevention", "prevent", "avoid", "reduce risk", "protective measures"
  ]
};


// ===============================================================
//  HELPERS: NLP Sentence Extraction
// ===============================================================
function extractSection(text, keywords) {
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

  return Array.from(new Set(results)).slice(0, 8); // unique + limit
}

function extractBullets(text) {
  return text.split(/[\n•\-•]/g)
    .map(x => x.trim())
    .filter(x => x.length > 5)
    .slice(0, 8);
}


// ===============================================================
//  API ENDPOINT — EXTRACT FULL MEDICAL SECTIONS
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

    // Build final structured output
    const output = {};

    for (const section in MEDICAL_SECTIONS) {
      const base = extractSection(clean, MEDICAL_SECTIONS[section]);

      // Merge bullet points related to that category
      const relatedBullets = bullets.filter(b =>
        MEDICAL_SECTIONS[section].some(k => b.toLowerCase().includes(k))
      );

      output[section] = Array.from(new Set([...base, ...relatedBullets])).slice(0, 10);
    }

    return res.json({
      ...output,
      when_to_see_a_doctor: "See a doctor if symptoms worsen or persist.",
      notes: "Extracted using advanced NLP (no AI)."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "NLP processing failed." });
  }
});


// ===============================================================
//  START SERVER
// ===============================================================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Advanced Medical NLP Server running at http://localhost:${PORT}`);
});
