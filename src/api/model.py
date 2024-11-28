import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

with open("processed_data.json", "r", encoding="utf-8") as file:
    data = json.load(file)


documents = [item['text'] for item in data]

categories = ["Урлаг соёл", "эрүүл мэнд", "хууль", "улс төр", "спорт", "технологи", "боловсрол", "байгал орчин"]
num_docs = len(documents)
labels = (categories * (num_docs // len(categories))) + categories[:num_docs % len(categories)]

vectorizer = TfidfVectorizer(max_features=1000, stop_words=None)
X = vectorizer.fit_transform(documents)

X_train, X_test, y_train, y_test = train_test_split(X, labels, test_size=0.2, random_state=42)

clf = RandomForestClassifier(n_estimators=50,max_depth=10, min_samples_split=5, min_samples_leaf=2, random_state=42)
clf.fit(X_train, y_train)

y_pred = clf.predict(X_test)
print(classification_report(y_test, y_pred,zero_division=1))

joblib.dump(clf, "classifier.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")
