import asyncio
import os
import re
from collections import Counter
from itertools import islice
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import hunspell
import joblib
import time
from fastapi.responses import JSONResponse


word_pattern = re.compile(r"\w+")


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


def batch(iterable, n):
    it = iter(iterable)
    while True:
        chunk = list(islice(it, n))
        if not chunk:
            break
        yield chunk


async def batch_spell_check(words, batch_size=70):
    misspelled = []
    suggestions = {}

    for word_batch in batch(words, batch_size):
        for w in word_batch:
            if not h.spell(w):
                misspelled.append(w)
                suggestions[w] = h.suggest(w)
    return misspelled, suggestions


async def classify_text(text):
    X = vectorizer.transform([text])
    return classifier.predict(X)[0]


@app.post("/check")
async def check_spelling(payload: TextPayload):
    start_time = time.time()
    text = payload.text
    words = [word for word in word_pattern.findall(text) if len(word) > 2]
    counter = Counter(words)
    most_frequent = counter.most_common(5)
    most_frequent_words = [{"word": w, "count": c} for w, c in most_frequent]

    task_start_time = time.time()
    misspelled_task = asyncio.create_task(batch_spell_check(words))
    classification_task = asyncio.create_task(classify_text(text))

    misspelled, suggestions = await misspelled_task
    misspelled_time = time.time() - task_start_time

    classification_start_time = time.time()
    prediction = await classification_task
    classification_time = time.time() - classification_start_time

    end_time = time.time()
    total_execution_time = end_time - start_time

    response = {
        "misspelledWords": misspelled,
        "suggestions": suggestions,
        "mostFrequentWords": most_frequent_words,
        "classificationResult": prediction,
        "executionTimeSeconds": total_execution_time,
        "timing": {
            "spellCheckTime": misspelled_time,
            "classificationTime": classification_time,
        },
    }

    return JSONResponse(content=response)
