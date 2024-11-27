const fs = require("fs");
const nodehun = require("nodehun");
const csv = require("csv-parser");
const cliProgress = require("cli-progress");

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

const affix = fs.readFileSync("./mn_MN.aff");
const dictionary = fs.readFileSync("./mn_MN.dic");
const hunspell = new nodehun(affix, dictionary);

const cleanText = (text) => {
  return text.replace(/[^а-өүяА-ӨҮЯ\s]/g, "").toLowerCase();
};

const preprocessText = (text) => {
  const cleanedText = cleanText(text);
  const words = cleanedText.split(/\s+/);
  const filteredWords = words.filter((word) => !stopWords.has(word));

  const stemmedWords = filteredWords.map((word) => {
    if (hunspell.spellSync(word)) {
      return word;
    } else {
      const suggestions = hunspell.suggestSync(word);
      return suggestions.length > 0 ? suggestions[0] : word;
    }
  });

  return stemmedWords;
};

const results = [];
let rowCount = 0;

fs.createReadStream("small_news.csv")
  .pipe(csv())
  .on("data", () => rowCount++)
  .on("end", () => {
    const progressBar = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic
    );
    progressBar.start(rowCount, 0);

    let processedCount = 0;
    fs.createReadStream("small_news.csv")
      .pipe(csv())
      .on("data", (row) => {
        const preprocessedText = preprocessText(row.news);
        results.push({
          text: preprocessedText.join(" "),
          label: row.label,
        });
        processedCount++;
        progressBar.update(processedCount);
      })
      .on("end", () => {
        progressBar.stop();
        fs.writeFileSync(
          "processed_data.json",
          JSON.stringify(results, null, 2)
        );
        console.log("CSV file successfully processed");
      });
  });
