### Backend Flask API — disesuaikan dengan AnalisisPage.tsx
### Port: 8000 | Response format: data.results | Confidence: 0.0-1.0

import torch
import pickle
import torch.nn.functional as F
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    AutoModelForTokenClassification
)

# ============================================================
# CONFIG
# ============================================================
MODEL_BASE   = "./models/kfold_tuned"
SEG_MODEL    = "./clause_model/final"
MAX_LEN      = 64
PORT         = 8000

CONJUNCTIONS = {
    "tapi", "namun", "padahal", "sedangkan", "karena",
    "jadi", "sehingga", "dan", "bahkan"
}

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Device: {device}")

# ============================================================
# Load Models
# ============================================================
print("Loading models...")

seg_tokenizer = AutoTokenizer.from_pretrained(SEG_MODEL)
seg_model     = AutoModelForTokenClassification.from_pretrained(SEG_MODEL).to(device)
seg_model.eval()

model_aspect     = AutoModelForSequenceClassification.from_pretrained(f"{MODEL_BASE}/aspect").to(device)
tokenizer_aspect = AutoTokenizer.from_pretrained(f"{MODEL_BASE}/tokenizer_aspect")
with open(f"{MODEL_BASE}/aspect_encoder.pkl", "rb") as f:
    aspect_encoder = pickle.load(f)

model_sentiment     = AutoModelForSequenceClassification.from_pretrained(f"{MODEL_BASE}/sentiment").to(device)
tokenizer_sentiment = AutoTokenizer.from_pretrained(f"{MODEL_BASE}/tokenizer_sentiment")
with open(f"{MODEL_BASE}/sentiment_encoder.pkl", "rb") as f:
    sentiment_encoder = pickle.load(f)

model_aspect.eval()
model_sentiment.eval()

print(f"✅ All models loaded on {device}")
print(f"   Aspect classes   : {aspect_encoder.classes_}")
print(f"   Sentiment classes: {sentiment_encoder.classes_}")

# ============================================================
# Clause Segmentation
# ============================================================
def segment_sentence(sentence):
    tokens = sentence.split()
    if not tokens:
        return [sentence]

    inputs = seg_tokenizer(
        tokens, is_split_into_words=True,
        return_tensors="pt", truncation=True, padding=True
    ).to(device)

    with torch.no_grad():
        outputs = seg_model(**inputs)

    predictions  = torch.argmax(outputs.logits, dim=2)[0].tolist()
    word_ids     = inputs.word_ids()
    clauses, current = [], []
    prev_word_id = None

    for token_idx, word_id in enumerate(word_ids):
        if word_id is None or word_id == prev_word_id:
            continue
        prev_word_id = word_id
        token = tokens[word_id]
        label = predictions[token_idx]
        if label == 0:  # B-CLAUSE
            if current:
                clauses.append(" ".join(current))
                current = []
            current.append(token)
        else:
            current.append(token)
    if current:
        clauses.append(" ".join(current))

    # Gabungkan kata penghubung ke klausa berikutnya
    merged, pending = [], ""
    for clause in clauses:
        if clause.strip().lower() in CONJUNCTIONS:
            pending = clause + " "
        else:
            merged.append((pending + clause).strip())
            pending = ""

    return merged if merged else [sentence]

# ============================================================
# Predict Single Clause
# ============================================================
def predict_clause(text):
    inp_a = tokenizer_aspect(
        text, truncation=True, padding="max_length",
        max_length=MAX_LEN, return_tensors="pt"
    )
    inp_s = tokenizer_sentiment(
        text, truncation=True, padding="max_length",
        max_length=MAX_LEN, return_tensors="pt"
    )
    inp_a = {k: v.to(device) for k, v in inp_a.items()}
    inp_s = {k: v.to(device) for k, v in inp_s.items()}

    with torch.no_grad():
        logits_a = model_aspect(**inp_a).logits
        logits_s = model_sentiment(**inp_s).logits

    probs_a = F.softmax(logits_a, dim=1)[0]
    probs_s = F.softmax(logits_s, dim=1)[0]
    idx_a   = torch.argmax(probs_a).item()
    idx_s   = torch.argmax(probs_s).item()

    return {
        "aspect":               aspect_encoder.inverse_transform([idx_a])[0],
        "aspect_confidence":    round(probs_a[idx_a].item(), 4),   # ← 0.0-1.0 untuk frontend
        "sentiment":            sentiment_encoder.inverse_transform([idx_s])[0],
        "sentiment_confidence": round(probs_s[idx_s].item(), 4),   # ← 0.0-1.0 untuk frontend
    }

# ============================================================
# Flask App
# ============================================================
app = Flask(__name__)
CORS(app)  # izinkan request dari frontend Next.js

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "status": "ok",
        "message": "ABSA API berjalan",
        "endpoints": {
            "POST /predict": "Analisis aspect & sentiment dari teks"
        }
    })

@app.route("/predict", methods=["POST"])
def api_predict():
    data = request.json
    if not data or "text" not in data:
        return jsonify({"error": "Field 'text' tidak ditemukan"}), 400

    text = data["text"].strip()
    if not text:
        return jsonify({"error": "Teks tidak boleh kosong"}), 400

    clauses = segment_sentence(text)
    results = []
    for clause in clauses:
        pred = predict_clause(clause)
        results.append({
            "clause":               clause,        # ← sesuai interface frontend (clause bukan klausa)
            "aspect":               pred["aspect"],
            "aspect_confidence":    pred["aspect_confidence"],
            "sentiment":            pred["sentiment"],
            "sentiment_confidence": pred["sentiment_confidence"],
        })

    return jsonify({
        "input":   text,
        "results": results   # ← data.results (pakai 's') sesuai frontend
    })

# ============================================================
if __name__ == "__main__":
    print(f"\n🚀 API berjalan di http://localhost:{PORT}")
    print(f"   Endpoint: POST http://localhost:{PORT}/predict")
    print(f"   Body    : {{\"text\": \"komentar pelanggan\"}}\n")
    app.run(debug=False, host="0.0.0.0", port=PORT)
