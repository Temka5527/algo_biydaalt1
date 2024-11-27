import React, { useState } from "react";

const App = () => {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);

  const checkSpelling = async () => {
    try {
      const response = await fetch("http://localhost:3000/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error checking spelling:", error);
    }
  };

  return (
    <div>
      <h1>F.CS301 Бие даалт 1</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder=""
        rows={10}
        cols={100}
        style={{ justifyContent: "center" }}
      ></textarea>
      <br />
      <button onClick={checkSpelling}>Check</button>

      {result && (
        <div>
          <p>Анхны текст:</p>
          <p>{result.text}</p>
          <p>Буруу бичсэн үгүүд:</p>
          {result.misspelledWords.length > 0 ? (
            <ul>
              {result.misspelledWords.map((item, index) => (
                <li key={index}>
                  Word: <strong>{item.word}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>Бүх үг зөв байна.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
