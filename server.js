// server.js — FAST VERSION (No OpenAI)
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
//  WIKIPEDIA-ONLY DISEASE EXTRACTOR (NO OPENAI REQUIRED)
// ======================================================================
app.post("/api/extract", async (req, res) => {
  try {
    const { title, summary, combinedText } = req.body;

    const text = (combinedText || "").replace(/<\/?[^>]+>/g, "").toLowerCase();

    // Extraction helper
    function extract(keyword) {
      const patterns = [
        `${keyword}`,
        `${keyword}s`,
        `${keyword} include`,
        `${keyword} includes`,
        `${keyword} may include`,
        `${keyword} are`,
        `${keyword} is`
      ];

      for (let p of patterns) {
        let idx = text.indexOf(p);
        if (idx !== -1) {
          let chunk = text.substring(idx, idx + 400);

          let items = chunk
            .split(/[.,;•\-]/)
            .map((x) => x.trim())
            .filter((x) => x.length > 3 && !x.includes(keyword));

          return items.slice(0, 10);
        }
      }
      return [];
    }

    const symptoms = extract("symptom");
    const treatments = extract("treatment");
    const prevention = extract("prevention");

    // fallback defaults
    const fallbackSymptoms = symptoms.length ? symptoms : ["fever", "pain", "fatigue"];
    const fallbackTreatments = treatments.length ? treatments : ["rest", "hydration", "medical care"];
    const fallbackPrevention = prevention.length ? prevention : ["avoid risk factors", "maintain hygiene"];

    return res.json({
      symptoms: fallbackSymptoms,
      treatments: fallbackTreatments,
      prevention: fallbackPrevention,
      when_to_see_a_doctor: "If symptoms worsen or do not improve in 48 hours.",
      notes: "Extracted using Wikipedia-only analysis (no AI used)."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Extraction failed", details: err.toString() });
  }
});


// ======================================================================
//  START SERVER
// ======================================================================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 FAST Local Server running at http://localhost:${PORT}`);
});
