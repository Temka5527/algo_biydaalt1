const express = require("express");
const cors = require("cors");
const fs = require("fs");
const Nodehun = require("nodehun");

const app = express();
app.use(express.json());
app.use(cors());

const aff = "./mn_MN.aff";
const dic = "./mn_MN.dic";

const affBuffer = fs.readFileSync(aff);
const dicBuffer = fs.readFileSync(dic);

const dictionary = new Nodehun(affBuffer, dicBuffer);
function isEnglishWord(word) {
  return /^[a-zA-Z]+$/.test(word);
}

function preprocessText(text) {
  return text
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
async function checkParagraph(paragraph) {
  const cleanedText = preprocessText(paragraph);
  const words = cleanedText.split(/\s+/);

  const results = [];

  for (const word of words) {
    if (isEnglishWord(word)) {
      continue;
    }
    const isCorrect = await dictionary.spell(word);
    if (!isCorrect) {
      results.push({ word, isCorrect });
    }
  }

  return results;
}

app.post("/check", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  try {
    const misspelledWords = await checkParagraph(text);
    res.json({ text, misspelledWords });
  } catch (error) {
    res.status(500).json({
      error: "Error processing text",
      details: error.message,
    });
  }
});

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
