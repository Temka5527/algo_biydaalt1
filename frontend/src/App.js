import React, { useState, useEffect } from "react";
import logo from "./assets/images/logo.png";
import copyIcon from "./assets/images/copy.svg";
import deleteIcon from "./assets/images/delete.svg";
import pasteIcon from "./assets/images/paste.svg";
import "./index.css";
import HighlightWithinTextarea from "react-highlight-within-textarea";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";

const App = () => {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const characterCount = text.length;

  const checkSpelling = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("http://localhost:8000/check", {
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
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    showTemporaryToast("Текст хууллаа!");
  };

  const handleDelete = () => {
    setText("");
    showTemporaryToast("Текст устгалаа!");
  };

  const handlePaste = async () => {
    const clipboardText = await navigator.clipboard.readText();
    setText((prevText) => prevText + clipboardText);
    showTemporaryToast("Текст буулгалаа!");
  };

  const showTemporaryToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  const misspelledWords = React.useMemo(
    () => result?.misspelledWords || [],
    [result]
  );
  const highlightRegex =
    misspelledWords.length > 0
      ? new RegExp(`(${misspelledWords.join("|")})`, "gi")
      : null;

  useEffect(() => {
    if (!result || !result.suggestions || !misspelledWords.length) return;

    const container = document.querySelector(".rhta-display, .rhta-textarea");
    if (!container) return;

    const misspelledElements = container.querySelectorAll(".misspelled");

    misspelledElements.forEach((el) => {
      const word = el.textContent.trim();
      const suggestionData = result.suggestions[word];

      const tooltipContent =
        Array.isArray(suggestionData) && suggestionData.length
          ? suggestionData.join(", ")
          : "No suggestions available";

      tippy(el, {
        content: tooltipContent,
        arrow: true,
        theme: "light",
        placement: "top", // Adjust placement if needed
      });
    });
  }, [result, misspelledWords]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800 font-sans">
      <header className="bg-[#2E8885] shadow-xl py-4 px-8 md:px-16 flex justify-between items-center text-white">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="Logo" className="w-9 h-16 mr-2" />
          <h1 className="text-xl font-bold">
            Шинжлэх Ухаан Технологийн Их Сургууль
          </h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-4 md:p-10 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-8xl border-2 border-[#2E8885]">
          <div className="w-full mb-4">
            <HighlightWithinTextarea
              value={text}
              onChange={(val) => setText(val)}
              highlight={[
                {
                  highlight: highlightRegex || [],
                  className: "misspelled",
                },
              ]}
              containerStyle={{
                width: "100%",
                height: "300px",
                border: "1px solid #ccc",
                borderRadius: "0.5rem",
                padding: "1rem",
                fontSize: "16px",
                lineHeight: "1.5",
                boxSizing: "border-box",
                resize: "none",
                fontFamily: "inherit",
                overflowY: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
              style={{
                width: "100%",
                background: "transparent",
                fontSize: "16px",
                lineHeight: "1.5",
                fontFamily: "inherit",
                whiteSpace: "pre-wrap",
                overflowWrap: "break-word",
              }}
              highlightStyle={{
                backgroundColor: "#fde8e8",
                textDecoration: "underline",
              }}
              disabled={loading}
              placeholder="Энд дарж бичнэ үү..."
              aria-label="Текст оруулах талбар"
            />
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4 gap-4 w-full">
            <div>
              <p className="text-sm md:text-base">Үгийн тоо: {wordCount}</p>
              <p className="text-sm md:text-base">
                Тэмдэгтийн тоо: {characterCount}
              </p>
              {result && result.classificationResult && (
                <div className="mt-2">
                  <span className="text-sm md:text-base font-medium">
                    Ангилал: {result.classificationResult}
                  </span>
                </div>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleCopy}
                className="relative group inline-flex items-center justify-center bg-white text-[#2E8885] border-2 border-[#2E8885] p-3 rounded-lg shadow hover:bg-[#2E8885] hover:text-white transition-colors duration-300"
                disabled={loading}
                aria-label="Текст хуулах"
              >
                <img src={copyIcon} alt="" className="w-6 h-6" />
              </button>
              <button
                onClick={handleDelete}
                className="relative group inline-flex items-center justify-center bg-white text-[#2E8885] border-2 border-[#2E8885] p-3 rounded-lg shadow hover:bg-red-500 hover:text-white transition-colors duration-300"
                disabled={loading}
                aria-label="Текстийг устгах"
              >
                <img src={deleteIcon} alt="" className="w-6 h-6" />
              </button>
              <button
                onClick={handlePaste}
                className="relative group inline-flex items-center justify-center bg-white text-[#2E8885] border-2 border-[#2E8885] p-3 rounded-lg shadow hover:bg-[#2E8885] hover:text-white transition-colors duration-300"
                disabled={loading}
                aria-label="Текстийг буулгах"
              >
                <img src={pasteIcon} alt="" className="w-6 h-6" />
              </button>
            </div>
            <button
              onClick={checkSpelling}
              disabled={loading}
              className="relative inline-flex items-center justify-center bg-white text-[#2E8885] border-2 border-[#2E8885] px-6 py-3 rounded-full shadow hover:bg-[#2E8885] hover:text-white transition-colors duration-300"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l2-2-2-2v4a8 8 0 11-8 8z"
                    ></path>
                  </svg>
                  Уншиж байна...
                </span>
              ) : (
                "Алдааг шалгах"
              )}
            </button>
          </div>
        </div>
      </main>

      {showToast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black text-white text-sm px-4 py-2 rounded shadow-lg z-50">
          {toastMessage}
        </div>
      )}

      <footer className="bg-[#2E8885] shadow-xl py-8 px-8 md:px-60 flex flex-col justify-center items-center text-white text-center space-y-4">
        <div>
          <p className="font-semibold">Мөрөөдлийн багийн гишүүд:</p>
          <p>Төгөлдөр, Билгүүн, Тэмүүлэн, Баасанжамц, Жавхлантөгс</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
