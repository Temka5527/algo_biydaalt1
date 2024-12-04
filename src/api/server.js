const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const nodehun = require("nodehun");
const { spawn } = require("child_process");

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.use(express.static("public"));

const affix = fs.readFileSync("./mn_MN.aff");
const dictionary = fs.readFileSync("./mn_MN.dic");
const hunspell = new nodehun(affix, dictionary);

const CACHE_FILE = "./cache.json";

const loadCache = () => {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, "utf-8");
      return new Map(JSON.parse(data));
    }
  } catch (error) {
    console.error("Error loading cache:", error);
  }
  return new Map();
};

const saveCache = () => {
  try {
    const data = JSON.stringify(Array.from(cache.entries()));
    fs.writeFileSync(CACHE_FILE, data, "utf-8");
  } catch (error) {
    console.error("Error saving cache:", error);
  }
};

const cache = loadCache();

process.on("exit", saveCache);
process.on("SIGINT", () => {
  saveCache();
  process.exit();
});
process.on("SIGTERM", () => {
  saveCache();
  process.exit();
});

const stopWords = new Set([
  "буюу",
  "энэ",
  "тэр",
  "бол",
  "өөр",
  "байна",
  "болох",
]);

const cleanText = (text) => text.replace(/[^а-өүяА-ӨҮЯ\s]+/g, "");
const limitTextTo300Words = (text) => text.split(/\s+/).slice(0, 300).join(" ");
const removeStopWords = (words) => words.filter((word) => !stopWords.has(word));

const calculateWordFrequency = (words) =>
  words.reduce((freq, word) => {
    freq[word] = (freq[word] || 0) + 1;
    return freq;
  }, {});

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

app.post("/check", async (req, res) => {
  const startTime = Date.now();
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required." });
    }

    const cachedResponse = cache.get(text);
    if (cachedResponse) {
      console.log(`Request processing time: ${Date.now() - startTime}ms`);
      return res.json(cachedResponse);
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

    const response = {
      misspelledWords,
      suggestions,
      rootWordCount: filteredWords.length,
      mostFrequentWords,
      nonMongolianWordsCount,
      contentType,
      analyzedWords,
    };

    cache.set(text, response);
    console.log(`Request processing time: ${Date.now() - startTime}ms`);
    res.json(response);
  } catch (error) {
    console.error("Error processing request:", error);
    console.log(`Request processing time: ${Date.now() - startTime}ms`);
    res.status(500).json({ error: error.toString() });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
