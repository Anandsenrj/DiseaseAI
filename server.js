// server.js — NLP Enhanced Version (No OpenAI)
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));


// ======================================================================
// SMART NLP MEDICAL EXTRACTOR (NO OPENAI)
// ======================================================================

// Medical keyword dictionary with weights
const NLP_KEYWORDS = {
  symptoms: {
    weight: 3,
    list: [
      "symptom", "symptoms", "signs", "indicators",
      "patients may experience", "characterized by",
      "may include", "commonly include"
    ]
  },
  treatments: {
    weight: 3,
    list: [
      "treatment", "treatments", "therapy", "therapies",
      "managed by", "management", "procedure",
      "cure", "medication", "surgery", "drugs"
    ]
  },
  prevention: {
    weight: 3,
    list: [
      "prevention", "prevent", "avoid", "reduce risk",
      "protective measures", "risk reduction", "control"
    ]
  }
};


// Extract sentences with keyword scoring
function scoreSentences(text, keywordSet) {
  const sentences = text.split(/[\.\n]/g);
  const scored = [];

  for (let sentence of sentences) {
    let score = 0;
    let s = sentence.toLowerCase();

    for (let key of keywordSet.list) {
      if (s.includes(key)) score += keywordSet.weight;
    }

    if (score > 0 && sentence.trim().length > 5) {
      scored.push({ sentence: sentence.trim(), score });
    }
  }

  // Sort by relevance score
  scored.sort((a, b) => b.score - a.score);

  // Return only sentences
  return scored.map(s => s.sentence).slice(0, 6);
}


// Bullet extractor (Wikipedia often uses •, -, etc.)
function extractBullets(text) {
  return text
    .split(/[\n•\-]/g)
    .map(s => s.trim())
    .filter(s => s.length > 5)
    .slice(0, 6);
}


// ======================================================================
// API: Extract medical info from Wikipedia text
// ======================================================================
app.post("/api/extract", async (req, res) => {
  try {
    const { combinedText } = req.body;

    // Clean HTML tags
    const cleaned = (combinedText || "")
      .replace(/<\/?[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) {
      return res.json({
        symptoms: [],
        treatments: [],
        prevention: [],
        notes: "No text found"
      });
    }

    // NLP Scoring
    const symptoms = scoreSentences(cleaned, NLP_KEYWORDS.symptoms);
    const treatments = scoreSentences(cleaned, NLP_KEYWORDS.treatments);
    const prevention = scoreSentences(cleaned, NLP_KEYWORDS.prevention);

    // Combine with bullet extraction (extra accuracy)
    const bullets = extractBullets(cleaned);

    function merge(a, b) {
      const set = new Set([...a, ...b]);
      return [...set].slice(0, 10);
    }

    res.json({
      symptoms: merge(symptoms, bullets.filter(x => x.toLowerCase().includes("vision") || x.toLowerCase().includes("pain"))),
      treatments: merge(treatments, bullets.filter(x => x.toLowerCase().includes("surgery") || x.toLowerCase().includes("therapy"))),
      prevention: merge(prevention, bullets.filter(x => x.toLowerCase().includes("avoid") || x.toLowerCase().includes("prevent"))),
      when_to_see_a_doctor: "If symptoms worsen or do not improve within 48 hours.",
      notes: "Extracted using NLP keyword scoring (NO AI used)."
    });

  } catch (err) {
    console.error("NLP Extraction Error:", err);
    res.status(500).json({
      error: "Extraction failed",
      details: err.toString()
    });
  }
});


// ======================================================================
// START SERVER
// ======================================================================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 NLP Medical Server running at http://localhost:${PORT}`);
});
