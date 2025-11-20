const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// API route NOT using OpenAI
app.post("/api/extract", async (req, res) => {
  const { title, summary, combinedText } = req.body;

  // simple extraction logic
  const symptoms = [];
  const treatments = [];
  const prevention = [];

  const text = (combinedText || "").toLowerCase();

  // very basic rule-based extraction (still works)
  const lines = text.split(/\n|\./);

  for (const line of lines) {
    if (line.includes("symptom")) symptoms.push(line.trim());
    if (line.includes("treat")) treatments.push(line.trim());
    if (line.includes("prevent")) prevention.push(line.trim());
  }

  res.json({
    symptoms: symptoms.slice(0, 6),
    treatments: treatments.slice(0, 6),
    prevention: prevention.slice(0, 6),
    when_to_see_a_doctor: "Consult a doctor if symptoms worsen.",
    notes: "Extracted using rule-based engine (no AI)."
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on port", port));
