const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const nodehun = require("nodehun");
const { spawn } = require("child_process");

const app = express();
const port = 3000;

// Enable CORS globally
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Ensure JSON body parsing
app.set("view engine", "ejs");
app.use(express.static("public"));

// Load Hunspell dictionary
const affix = fs.readFileSync("./mn_MN.aff");
const dictionary = fs.readFileSync("./mn_MN.dic");
const hunspell = new nodehun(affix, dictionary);

// Stop words
const stopWords = new Set([
  "буюу",
  "энэ",
  "тэр",
  "бол",
  "өөр",
  "байна",
  "болох",
]);

// Utility Functions
const cleanText = (text) => text.replace(/[^а-өүяА-ӨҮЯ\s]/g, "");
const limitTextTo300Words = (text) => text.split(/\s+/).slice(0, 300).join(" ");
const removeStopWords = (words) => words.filter((word) => !stopWords.has(word));

const classifyText = (text) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python3", ["predict.py", text]);

    pythonProcess.stdout.on("data", (data) => resolve(data.toString().trim()));
    pythonProcess.stderr.on("data", (error) => reject(error.toString()));
  });
};

const checkSpellingWithSuggestions = (words) => {
  const misspelledWords = [];
  const suggestions = {};
  const analyzedWords = [];

  words.forEach((word) => {
    const isCorrect = hunspell.spellSync(word);
    if (!isCorrect) {
      const analysis = hunspell.analyzeSync(word);
      const rootWordLine = analysis[0] || word;
      const rootWord = rootWordLine.match(/^\w+/)?.[0] || word;

      misspelledWords.push(word);
      suggestions[word] = hunspell.suggestSync(word);
      analyzedWords.push({
        word,
        rootWord,
        suffixes: rootWordLine.match(/<.*?>/g) || [],
        isCorrect: false,
      });
    } else {
      analyzedWords.push({
        word,
        rootWord: word,
        suffixes: [],
        isCorrect: true,
      });
    }
  });

  return { misspelledWords, suggestions, analyzedWords };
};

const calculateWordFrequency = (words) => {
  return words.reduce((freq, word) => {
    freq[word] = (freq[word] || 0) + 1;
    return freq;
  }, {});
};

// Routes
app.get("/", (req, res) => {
  res.render("index", { results: null, text: "" });
});

app.post("/check", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required." });
    }

    const limitedText = limitTextTo300Words(text);
    const cleanedText = cleanText(limitedText);
    const words = cleanedText.split(/\s+/).map((word) => word.toLowerCase());
    const filteredWords = removeStopWords(words);

    const { misspelledWords, suggestions, analyzedWords } =
      checkSpellingWithSuggestions(filteredWords);

    const frequency = calculateWordFrequency(filteredWords);
    const mostFrequentWords = Object.keys(frequency)
      .sort((a, b) => frequency[b] - frequency[a])
      .slice(0, 10)
      .map((word) => ({ word, count: frequency[word] }));

    const nonMongolianWordsCount = words.filter(
      (word) => !/^[а-өүяА-ӨҮЯ]+$/.test(word)
    ).length;
    const contentType = await classifyText(cleanedText);

    res.json({
      misspelledWords,
      suggestions,
      rootWordCount: filteredWords.length,
      mostFrequentWords,
      nonMongolianWordsCount,
      contentType,
      analyzedWords,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: error.toString() });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
