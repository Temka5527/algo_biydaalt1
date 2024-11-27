const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const nodehun = require("nodehun");
const cors = require("cors");
const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());
app.set("view engine", "ejs");
app.use(express.static("public"));

const affix = fs.readFileSync("./mn_MN.aff");
const dictionary = fs.readFileSync("./mn_MN.dic");
const hunspell = new nodehun(affix, dictionary);

const stopWords = new Set([
  "буюу",
  "энэ",
  "тэр",
  "бол",
  "өөр",
  "байна",
  "болох",
  "гэх мэт",
  "гэж",
  "мөн",
  "р",
  "нд",
  "л",
  "ч",
  "нийг",
  "ныг",
  "наас",
  "ыг",
  "ийн",
  "ын",
  "ний",
]);

const cleanText = (text) => text.replace(/[^а-өүяА-ӨҮЯ\s]/g, "");

const limitTextTo300Words = (text) => {
  const words = text.split(/\s+/);
  return words.slice(0, 300).join(" ");
};

const removeStopWords = (words) => {
  return words.filter((word) => !stopWords.has(word));
};

const checkSpellingWithSuggestions = (words) => {
  const misspelledWords = [];
  const suggestions = {};
  const analyzedWords = [];

  words.forEach((word) => {
    const isCorrect = hunspell.spellSync(word);

    if (!isCorrect) {
      const analysis = hunspell.analyzeSync(word);
      if (analysis.length > 0) {
        const rootWordLine = analysis[0];
        const rootMatch = rootWordLine.match(/^\w+/);
        const rootWord = rootMatch ? rootMatch[0] : word;

        const isRootCorrect = hunspell.spellSync(rootWord);
        if (!isRootCorrect) {
          misspelledWords.push(word);
          suggestions[word] = hunspell.suggestSync(word);
        }

        const suffixes = rootWordLine.match(/<.*?>/g) || [];
        analyzedWords.push({
          word,
          rootWord,
          suffixes,
          isCorrect: isRootCorrect,
        });
      } else {
        misspelledWords.push(word);
        suggestions[word] = hunspell.suggestSync(word);
        analyzedWords.push({
          word,
          rootWord: word,
          suffixes: [],
          isCorrect: false,
        });
      }
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
  const frequency = {};
  words.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  return frequency;
};

const categorizeContent = (text) => {
  const contentCategories = {
    economic: ["зах", "банк", "үнэт", "худалдаа", "экономи"],
    sports: ["хөл", "тэмцээн", "баг", "спорт", "тоглогч", "тулаан"],
    news: ["төр", "улс", "шийдвэр", "мэдээ", "соёл"],
  };

  let contentType = "Unknown";
  for (const [category, keywords] of Object.entries(contentCategories)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      contentType =
        category.charAt(0).toUpperCase() + category.slice(1) + " News";
      break;
    }
  }
  return contentType;
};

app.get("/", (req, res) => {
  res.render("index", { results: null, text: "" });
});

app.post("/check", (req, res) => {
  try {
    const text = req.body.text;
    if (!text) {
      return res.status(400).json({ error: "Text is required." });
    }

    const limitedText = limitTextTo300Words(text);
    const cleanedText = cleanText(limitedText);
    const words = cleanedText.split(/\s+/).map((word) => word.toLowerCase());
    const filteredWords = removeStopWords(words);

    const { misspelledWords, suggestions, analyzedWords } =
      checkSpellingWithSuggestions(filteredWords);

    console.log("Misspelled Words:", misspelledWords); // Log to check the output
    console.log("Suggestions:", suggestions);

    const frequency = calculateWordFrequency(filteredWords);
    const mostFrequentWords = Object.keys(frequency)
      .sort((a, b) => frequency[b] - frequency[a])
      .slice(0, 10)
      .map((word) => ({ word, count: frequency[word] }));

    const nonMongolianWordsCount = filteredWords.filter((word) =>
      /^[a-zA-Z]+$/.test(word)
    ).length;

    const contentType = categorizeContent(cleanedText);

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
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
