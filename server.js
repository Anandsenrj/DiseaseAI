const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

function extractSection(text, keywords) {
  const lines = text.split(/\n|\. /);
  const results = [];

  for (let line of lines) {
    const lower = line.toLowerCase();
    for (let key of keywords) {
      if (lower.includes(key)) {
        if (!results.includes(line.trim())) {
          results.push(line.trim());
        }
      }
    }
  }

  return results.slice(0, 8);
}

app.post("/api/extract", async (req, res) => {
  const { combinedText } = req.body;
  const text = (combinedText || "").toLowerCase();

  // Multiple synonyms to improve extraction
  const symptoms = extractSection(combinedText, [
    "symptom",
    "signs",
    "characterized by",
    "may include",
    "usually includes"
  ]);

  const treatments = extractSection(combinedText, [
    "treatment",
    "treat",
    "therapy",
    "managed",
    "management",
    "cure",
    "medication",
    "drug",
    "surgery",
    "procedure",
    " intervention"
  ]);

  const prevention = extractSection(combinedText, [
    "prevention",
    "prevent",
    "reduce the risk",
    "avoid",
    "protective",
    "control",
    "risk reduction"
  ]);

  res.json({
    symptoms,
    treatments,
    prevention,
    when_to_see_a_doctor: "Consult a doctor if symptoms worsen.",
    notes: "Enhanced rule-based extraction (no AI used)."
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on port", port));
