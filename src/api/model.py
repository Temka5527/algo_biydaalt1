import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
import joblib

file_path = 'stemmed_news_mongolian.csv'
df = pd.read_csv(file_path)

print("Dataset preview:")
print(df.head())

text_column = 'stemmed_text'
label_column = ' label'

X_train, X_test, y_train, y_test = train_test_split(
    df[text_column],
    df[label_column],
    test_size=0.2, 
    stratify=df[label_column],
    random_state=42
)

vectorizer = TfidfVectorizer(max_features=1000)
X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)

clf = LogisticRegression(random_state=42)
clf.fit(X_train_tfidf, y_train)

y_pred = clf.predict(X_test_tfidf)
print("Classification Report:")
print(classification_report(y_test, y_pred))
print("Accuracy:", accuracy_score(y_test, y_pred))

vectorizer_path = 'vectorizer.pkl'
clf_path = 'classifier.pkl'
joblib.dump(vectorizer, vectorizer_path)
joblib.dump(clf, clf_path)

print(f"Vectorizer saved to: {vectorizer_path}")
print(f"Classifier saved to: {clf_path}")
