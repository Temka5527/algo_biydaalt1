from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import hunspell
import os
from collections import Counter
import re
import joblib


class TextPayload(BaseModel):
    text: str


app = FastAPI()

origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

hunspell_path = "./dict"
aff_path = os.path.join(hunspell_path, "mn_MN.aff")
dic_path = os.path.join(hunspell_path, "mn_MN.dic")
h = hunspell.HunSpell(dic_path, aff_path)

model_path = "./model"
vector_path = os.path.join(model_path, "vectorizer.pkl")
classifier_path = os.path.join(model_path, "classifier.pkl")
vectorizer = joblib.load(vector_path)
classifier = joblib.load(classifier_path)


@app.post("/check")
async def check_spelling(payload: TextPayload):
    text = payload.text
    words = re.findall(r"\w+", text)
    misspelled = []
    suggestions = {}

    for w in words:
        if not h.spell(w):
            misspelled.append(w)
            suggestions[w] = h.suggest(w)

    contentType = "Текст"
    counter = Counter(words)
    most_frequent = counter.most_common(5)
    most_frequent_words = [{"word": w, "count": c} for w, c in most_frequent]

    X = vectorizer.transform([text])
    prediction = classifier.predict(X)[0]

    response = {
        "misspelledWords": misspelled,
        "suggestions": suggestions,
        "contentType": contentType,
        "mostFrequentWords": most_frequent_words,
        "classificationResult": prediction,
    }

    return response
