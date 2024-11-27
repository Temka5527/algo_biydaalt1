import sys
import joblib

clf = joblib.load("classifier.pkl")
vectorizer = joblib.load("vectorizer.pkl")

text = sys.argv[1]
X = vectorizer.transform([text])
prediction = clf.predict(X)

print(prediction[0])
