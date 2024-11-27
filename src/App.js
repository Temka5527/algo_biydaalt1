import React, { useState } from "react";
import logo from "./assets/images/logo.png";
import copyIcon from "./assets/images/copy.svg";
import deleteIcon from "./assets/images/delete.svg";
import pasteIcon from "./assets/images/paste.svg";
import "./index.css";

const App = () => {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const characterCount = text.length;

  const checkSpelling = async () => {
    try {
      const response = await fetch("http://localhost:3000/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response from server:", data);
      setResult(data);
    } catch (error) {
      console.error("Error checking spelling:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header*/}
      <header className="bg-[#2E8885] shadow-xl py-4 px-16 flex justify-between items-center text-[#ffffff]">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="Logo" className="w-9 h-16 mr-2" />
          <h1 className="text-lg font-bold">
            Шинжлэх Ухаан Технологийн Их Сургууль
          </h1>
        </div>
      </header>

      <main className="flex-1 bg-white flex flex-col items-center p-10 space-y-4">
        <div className="flex-[0.2] bg-[#F2F7FA] rounded-2xl p-6 shadow-xl w-full border-2  border-[#2E8885]">
          {/* Text box */}
          <textarea
            placeholder="Энд дарж бичнэ үү..."
            className="w-full h-80 border border-gray-200 p-4 rounded-md focus:outline-none focus:ring-2 focus:ring-[#808080]"
            value={text}
            onChange={(e) => setText(e.target.value)}
          ></textarea>
          <div className="flex justify-between items-center mt-4 gap-4 w-full">
            <div>
              <span>Үгийн тоо: {wordCount}</span>
              <br />
              <span>Тэмдэгтийн тоо: {characterCount} / 800</span>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigator.clipboard.writeText(text)}
                className="bg-white text-[#5E81AC] border-2 border-[#2E8885] p-4 rounded-lg shadow-xl transition-transform duration-300 hover:scale-105 relative group"
              >
                <img src={copyIcon} alt="Copy Icon" className="w-6 h-6" />
                <span className="absolute bottom-full mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  тескстийг хуулах
                </span>
              </button>
              <button
                onClick={() => setText("")}
                className="bg-white text-[#5E81AC] border-2 border-[#2E8885] p-4 rounded-lg shadow-xl transition-transform duration-300 hover:scale-105 relative group"
              >
                <img src={deleteIcon} alt="Delete Icon" className="w-6 h-6" />
                <span className="absolute bottom-full mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  Текстийг устгах
                </span>
              </button>
              <button
                onClick={async () => {
                  const clipboardText = await navigator.clipboard.readText();
                  setText((prevText) => prevText + clipboardText);
                }}
                className="bg-white text-[#5E81AC] border-2 border-[#2E8885] p-4 rounded-lg shadow-xl transition-transform duration-300 hover:scale-105 relative group"
              >
                <img src={pasteIcon} alt="Paste Icon" className="w-6 h-6" />
                <span className="absolute bottom-full mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  текстийг буулгах
                </span>
              </button>
            </div>
            <button
              onClick={checkSpelling}
              className="bg-white text-[#2E8885] border-2 border-[#2E8885] px-6 py-3 rounded-full shadow-xl hover:shadow-2xl transition-transform duration-300 hover:scale-105"
            >
              Алдааг шалгах
            </button>
          </div>
        </div>

        {/* Алдаатай үгний жагсаалтын хэсэг */}
        <div className="flex-[0.8] bg-[#F2F7FA] rounded-2xl p-6 shadow-xl w-full border-2 border-[#2E8885] overflow-auto max-h-[500px]">
          <h2 className="text-lg font-bold mb-4">Алдаатай үгсийн жагсаалт</h2>
          {result ? (
            result.misspelledWords && result.misspelledWords.length > 0 ? (
              <ul className="space-y-2">
                {result.misspelledWords.map((word, index) => (
                  <li key={index}>
                    Word: <strong>{word}</strong>
                    {result.suggestions[word]?.length > 0 && (
                      <span>
                        {" "}
                        - Possible suggestions:{" "}
                        {result.suggestions[word].join(", ")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Бүх үг зөв байна.</p>
            )
          ) : (
            <p>Үр дүн байхгүй байна. Та текст оруулна уу.</p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#2E8885] shadow-xl py-8 px-60 flex justify-between items-center text-[#ffffff]">
        <div className="text-center">
          <p>Мөрөөдлийн багийн гишүүд:</p>
          <p>Төгөлдөр, Билгүүн, Тэмүүлэн, Баасанжамц, Жавхлантөгс</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
