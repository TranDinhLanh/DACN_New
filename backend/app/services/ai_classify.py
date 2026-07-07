"""
CategoryClassifier - Production-grade ML module for Vietnamese transaction classification.

Pipeline:
  CSV  →  Preprocessing  →  TF-IDF  →  Model Selection  →  Best Model  →  Predict

Author: AI Engineer
Design: SOLID principles - Single Responsibility, Open/Closed, Dependency Inversion
"""

import os
import re
import csv
import logging
import unicodedata
from typing import Optional, Dict, Any, List, Tuple

logger = logging.getLogger(__name__)

# ─── Paths ─────────────────────────────────────────────────────────────────────
_SERVICES_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR      = os.path.join(_SERVICES_DIR, "models")
CLASSIFIER_PATH = os.path.join(MODEL_DIR, "classifier.pkl")
VECTORIZER_PATH = os.path.join(MODEL_DIR, "vectorizer.pkl")

# ─── Target categories ─────────────────────────────────────────────────────────
CATEGORIES = [
    "Food & Beverage",
    "Transportation",
    "Shopping",
    "Entertainment",
    "Bills & Utilities",
    "Other",
]


# ══════════════════════════════════════════════════════════════════════════════
# 1. TEXT PREPROCESSOR  (Single Responsibility)
# ══════════════════════════════════════════════════════════════════════════════
class TextPreprocessor:
    """
    Chuẩn hóa văn bản đầu vào trước khi vector hóa.

    Lý do thiết kế tách riêng:
    - Dễ thay thế hoặc mở rộng (thêm stemming, spell-check) mà không đụng model.
    - Đảm bảo train và predict dùng chung một pipeline chuẩn hóa.
    """

    # Từ dừng Việt: giới từ, liên từ không mang nghĩa phân loại
    _STOPWORDS: set = {
        "va", "cua", "cho", "de", "voi", "tren", "tai", "o",
        "di", "den", "trong", "ngoai", "tu", "ve", "theo",
        "mot", "cac", "nhung", "la", "co", "da", "se", "duoc",
        "thi", "ma", "vi", "nen", "nhung", "hay", "hoac",
    }

    @staticmethod
    def _remove_accents(text: str) -> str:
        """Chuyển tiếng Việt có dấu → không dấu (giúp TF-IDF nhận diện token nhất quán)."""
        text = unicodedata.normalize("NFD", text)
        text = "".join(c for c in text if unicodedata.category(c) != "Mn")
        return text.replace("đ", "d").replace("Đ", "D")

    @classmethod
    def clean(cls, text: str) -> str:
        """
        Pipeline chuẩn hóa:
        1. lowercase
        2. bỏ dấu tiếng Việt
        3. loại ký tự đặc biệt (giữ chữ-số-khoảng trắng)
        4. chuẩn hóa khoảng trắng
        5. lọc stopwords
        """
        if not isinstance(text, str):
            return ""
        text = text.lower().strip()
        text = cls._remove_accents(text)
        text = re.sub(r"[^a-z0-9\s]", " ", text)      # chỉ giữ chữ và số
        text = re.sub(r"\s+", " ", text).strip()        # chuẩn hóa khoảng trắng
        tokens = [t for t in text.split() if t not in cls._STOPWORDS and len(t) > 1]
        return " ".join(tokens)

    @classmethod
    def combine(cls, merchant: str, description: str) -> str:
        """
        Kết hợp merchant_name + description thành một văn bản duy nhất.

        Lý do: Merchant name thường chứa thương hiệu, description chứa sản phẩm.
        Kết hợp 2 nguồn cho TF-IDF nhiều thông tin hơn so với dùng riêng lẻ.
        Lặp lại merchant 2 lần để tăng trọng số thương hiệu (boosting).
        """
        m = cls.clean(merchant)
        d = cls.clean(description)
        # Boost merchant: lặp 2 lần → TF cao hơn → weight cao hơn
        parts = [m, m, d] if m else [d]
        return " ".join(p for p in parts if p)


# ══════════════════════════════════════════════════════════════════════════════
# 2. DATASET LOADER  (Single Responsibility)
# ══════════════════════════════════════════════════════════════════════════════
class DatasetLoader:
    """
    Đọc và làm sạch file CSV training data.

    Hỗ trợ 2 cấu trúc CSV:
    - Cột: merchant_name, description, category   (mới, đầy đủ)
    - Cột: description, category                  (cũ, tối giản)
    """

    @staticmethod
    def load(csv_path: str) -> Tuple[List[str], List[str]]:
        """
        Trả về (texts, labels) đã được làm sạch và loại trùng.

        Xử lý dữ liệu thiếu:
        - merchant_name = "" nếu cột không tồn tại
        - description   = "" nếu cell rỗng
        - Bỏ hàng nếu category rỗng
        """
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Không tìm thấy file CSV: {csv_path}")

        texts: List[str] = []
        labels: List[str] = []
        seen: set = set()

        with open(csv_path, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            fieldnames = [c.strip().lower() for c in (reader.fieldnames or [])]

            for row in reader:
                # Chuẩn hóa key
                row = {k.strip().lower(): v.strip() for k, v in row.items() if k}

                merchant = row.get("merchant_name", "") or ""
                desc     = row.get("description", "") or ""
                category = row.get("category", "").strip()

                if not category:
                    continue  # bỏ hàng không có nhãn

                text = TextPreprocessor.combine(merchant, desc)
                if not text:
                    continue  # bỏ hàng rỗng sau chuẩn hóa

                # Loại trùng: cùng (text, category) → bỏ
                key = (text, category)
                if key in seen:
                    continue
                seen.add(key)

                texts.append(text)
                labels.append(category)

        logger.info(f"[Dataset] Tải {len(texts)} mẫu từ {csv_path}")
        return texts, labels


# ══════════════════════════════════════════════════════════════════════════════
# 3. MODEL FACTORY  (Open/Closed — thêm model mới không sửa class cũ)
# ══════════════════════════════════════════════════════════════════════════════
def _build_models() -> Dict[str, Any]:
    """
    Khởi tạo các mô hình cần so sánh.

    Lý do chọn từng mô hình:
    - LogisticRegression : baseline mạnh cho text, hội tụ nhanh, giải thích được.
    - LinearSVC          : thường tốt nhất cho TF-IDF text, margin tối ưu, nhanh.
    - MultinomialNB      : tốt với bag-of-words/TF-IDF, phù hợp dataset nhỏ.
    - RandomForest       : ensemble, ít overfit, nhưng chậm hơn với feature sparse.

    Lý do KHÔNG dùng KNN: phức tạp O(n) lúc predict với sparse vector.
    Lý do KHÔNG dùng SVM kernel RBF: quá chậm với text feature.
    """
    from sklearn.linear_model import LogisticRegression
    from sklearn.svm import LinearSVC
    from sklearn.naive_bayes import MultinomialNB
    from sklearn.ensemble import RandomForestClassifier

    return {
        "LogisticRegression": LogisticRegression(
            max_iter=1000,
            C=1.0,
            solver="lbfgs",
            multi_class="auto",
            random_state=42,
        ),
        "LinearSVM": LinearSVC(
            C=1.0,
            dual="auto",
            max_iter=2000,
            random_state=42,
        ),
        "MultinomialNB": MultinomialNB(
            alpha=0.1,        # Laplace smoothing nhỏ vì vocab tương đối đặc trưng
        ),
        "RandomForest": RandomForestClassifier(
            n_estimators=200,
            max_depth=None,
            random_state=42,
            n_jobs=-1,
        ),
    }


# ══════════════════════════════════════════════════════════════════════════════
# 4. CATEGORY CLASSIFIER  (main class, SOLID compliant)
# ══════════════════════════════════════════════════════════════════════════════
class CategoryClassifier:
    """
    Production ML Classifier cho phân loại danh mục giao dịch.

    Public API:
        train(csv_path)       → huấn luyện, chọn model tốt nhất, lưu pkl
        predict(text)         → trả về tên category
        predict_proba(text)   → trả về dict {category: probability}
        evaluate(X, y)        → in báo cáo đầy đủ
        save_model()          → lưu pkl
        load_model()          → tải pkl
        classify(text)        → compat alias cho predict()

    Fallback:
        Nếu chưa có model pkl → dùng RULES (rule-based regex).
    """

    # ── Rule-based fallback (dùng khi chưa train) ──────────────────────────
    RULES: Dict[str, List[str]] = {
        "Food & Beverage": [
            r"coffee", r"cafe", r"ca phe", r"tra sua", r"tea", r"tra", r"sua",
            r"gongcha", r"phuc long", r"starbucks", r"highlands", r"bun", r"pho",
            r"com", r"banh", r"kem", r"pizza", r"burger", r"ga", r"thit", r"lau",
            r"nuong", r"hai san", r"mi", r"chao", r"an sang", r"an trua", r"an toi",
        ],
        "Transportation": [
            r"grab", r"taxi", r"gojek", r"be car", r"be bike", r"bus",
            r"xang", r"dau", r"xe om", r"may bay", r"tau hoa", r"xe khach",
            r"vietjet", r"vietnam airlines", r"phuong trang", r"hoa mai",
        ],
        "Shopping": [
            r"shopee", r"lazada", r"tiki", r"winmart", r"coopmart", r"lotte",
            r"bach hoa", r"circle k", r"ministop", r"7-eleven", r"gs25",
            r"zara", r"uniqlo", r"h&m", r"adidas", r"nike", r"aeon", r"emart",
            r"my pham", r"tap hoa", r"guardian", r"watsons",
        ],
        "Entertainment": [
            r"cgv", r"lotte cinema", r"galaxy", r"rap chieu phim",
            r"netflix", r"spotify", r"steam", r"garena", r"playstation",
            r"bar", r"pub", r"karaoke", r"ca nhac", r"trien lam",
            r"dam sen", r"vinwonders",
        ],
        "Bills & Utilities": [
            r"evn", r"dien luc", r"cap nuoc", r"viettel", r"mobifone",
            r"vinaphone", r"fpt", r"vnpt", r"thue nha", r"phi quan ly",
            r"cap quang", r"internet", r"wifi", r"hoc phi", r"bao hiem",
        ],
    }

    def __init__(self) -> None:
        self._model: Optional[Any] = None
        self._vectorizer: Optional[Any] = None
        self._model_name: str = ""
        self._best_score: float = 0.0
        self._preprocessor = TextPreprocessor()

    # ── Preprocessing helper ───────────────────────────────────────────────
    def _prepare_input(self, merchant: str = "", description: str = "") -> str:
        return TextPreprocessor.combine(merchant, description)

    # ── 4.1 TRAIN ─────────────────────────────────────────────────────────
    def train(self, csv_path: str, save_dir: Optional[str] = None) -> bool:
        """
        Huấn luyện đầy đủ:
        1. Load & preprocess CSV
        2. Train/test split 80/20 (stratified)
        3. TF-IDF vectorization
        4. Train 4 mô hình + Cross Validation 5-fold
        5. Chọn mô hình tốt nhất theo WEIGHTED SCORE = 0.4×CV_F1 + 0.6×Test_F1
           - CV_F1:   đo khả năng tổng quát hóa (generalization)
           - Test_F1: đo hiệu quả thực trên tập dữ liệu chưa thấy
           - Với dataset nhỏ (<500 mẫu), Test_F1 được ưu tiên hơn (hệ số 0.6)
             vì CV có thể bị nhiễu do variance cao giữa các fold.
        6. In Confusion Matrix + Classification Report
        7. Lưu pkl

        Returns:
            True nếu thành công, False nếu lỗi.
        """
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
            from sklearn.metrics import (
                classification_report, confusion_matrix, f1_score
            )
            from sklearn.pipeline import Pipeline
            import numpy as np
        except ImportError as e:
            logger.error(f"[Train] Thiếu thư viện: {e}. Chạy: pip install scikit-learn")
            return False

        # ── Bước 1: Load data ──────────────────────────────────────────────
        try:
            texts, labels = DatasetLoader.load(csv_path)
        except Exception as e:
            logger.error(f"[Train] Lỗi đọc CSV: {e}")
            return False

        if len(texts) < 10:
            logger.error(f"[Train] Dataset quá nhỏ ({len(texts)} mẫu). Cần ít nhất 10 mẫu.")
            return False

        print(f"\n{'='*60}")
        print(f"  TRAINING CLASSIFIER — {len(texts)} mẫu, {len(set(labels))} lớp")
        print(f"{'='*60}")
        _print_class_distribution(labels)

        # ── Bước 2: Train/Test split 80/20 ────────────────────────────────
        X_train, X_test, y_train, y_test = train_test_split(
            texts, labels,
            test_size=0.2,
            random_state=42,
            stratify=labels,   # giữ tỷ lệ lớp trong cả 2 tập
        )
        print(f"\n  Train: {len(X_train)} | Test: {len(X_test)}")

        # ── Bước 3: TF-IDF Vectorizer ─────────────────────────────────────
        # ngram_range=(1,2): unigram + bigram → bắt được cụm từ như "ca phe", "tra sua"
        # sublinear_tf=True: log(tf) thay vì tf thô → giảm ảnh hưởng từ xuất hiện nhiều
        # min_df=1: giữ cả từ hiếm (dataset nhỏ cần mọi thông tin)
        # max_features=10000: giới hạn từ điển để tránh curse of dimensionality
        vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=1,
            max_features=10_000,
            analyzer="word",
        )
        X_train_vec = vectorizer.fit_transform(X_train)
        X_test_vec  = vectorizer.transform(X_test)

        print(f"\n  TF-IDF vocab size: {len(vectorizer.vocabulary_):,} features")

        # ── Bước 4: Train & Cross-Validate từng mô hình ───────────────────
        models = _build_models()
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        results: Dict[str, Dict] = {}

        print(f"\n{'─'*65}")
        print(f"  {'Model':<22} {'CV F1':>10}  {'Test Acc':>10}  {'Test F1':>10}  {'Score':>8}")
        print(f"  {'':22} {'(40%)':>10}  {'':>10}  {'(60%)':>10}  {'':>8}")
        print(f"{'─'*65}")

        best_model_name = ""
        best_f1 = -1.0
        best_model_obj = None

        for name, model in models.items():
            try:
                # Cross-validation trên tập train
                cv_scores = cross_val_score(
                    model, X_train_vec, y_train,
                    cv=cv, scoring="f1_macro", n_jobs=-1,
                )
                cv_f1 = float(np.mean(cv_scores))

                # Fit trên toàn train, evaluate trên test
                model.fit(X_train_vec, y_train)
                y_pred = model.predict(X_test_vec)

                acc  = float(np.mean(np.array(y_pred) == np.array(y_test)))
                f1   = float(f1_score(y_test, y_pred, average="macro", zero_division=0))

                results[name] = {
                    "model": model,
                    "cv_f1": cv_f1,
                    "test_acc": acc,
                    "test_f1": f1,
                    "y_pred": y_pred,
                }

                # WEIGHTED SCORE: ưu tiên Test_F1 hơn khi dataset nhỏ
                # Lý do: dataset < 500 mẫu → CV variance cao → không nên tin tuyệt đối vào CV
                # Cân bằng: Test_F1 phản ánh hiệu quả thực tế trên tập held-out chưa thấy
                weighted_score = 0.4 * cv_f1 + 0.6 * f1
                results[name]["weighted_score"] = weighted_score

                print(f"  {name:<22} {cv_f1:>10.4f}  {acc:>10.4f}  {f1:>10.4f}  {weighted_score:>8.4f}")

                if weighted_score > best_f1:
                    best_f1 = weighted_score
                    best_model_name = name
                    best_model_obj = model

            except Exception as e:
                print(f"  {name:<22} LOI: {e}")

        print(f"{'─'*65}")

        best_result   = results[best_model_name]
        best_weighted = best_result["weighted_score"]
        best_cv_f1    = best_result["cv_f1"]
        best_test_f1  = best_result["test_f1"]

        print(f"\n  Tieu chi chon: Weighted Score = 0.4 x CV_F1 + 0.6 x Test_F1")
        print(f"  Model tot nhat: [{best_model_name}]")
        print(f"    CV F1-macro  = {best_cv_f1:.4f}")
        print(f"    Test F1-macro= {best_test_f1:.4f}")
        print(f"    Weighted     = {best_weighted:.4f}  <-- tieu chi chon")

        # Dataset size advisory (dùng khi bảo vệ đồ án)
        n_total = len(texts)
        if n_total < 500:
            print(f"\n  [Dataset Advisory] Hien co {n_total} mau (< 500).")
            print(f"  Day la phien ban prototype. Mo hinh se duoc toi uu khi")
            print(f"  bo sung du lieu len 1000-2000 mau co nhan.")
            print(f"  He thong duoc thiet ke de train lai khi them CSV moi.")

        # ── Bước 5: Báo cáo model tốt nhất ───────────────────────────────
        y_pred_best   = best_result["y_pred"]
        unique_labels = sorted(set(labels))

        print(f"\n{'='*60}")
        print(f"  CLASSIFICATION REPORT — {best_model_name}")
        print(f"{'='*60}")
        print(classification_report(
            y_test, y_pred_best,
            labels=unique_labels,
            zero_division=0,
        ))

        # Confusion Matrix
        cm = confusion_matrix(y_test, y_pred_best, labels=unique_labels)
        _print_confusion_matrix(cm, unique_labels)

        # ── Bước 6: Lưu model ─────────────────────────────────────────────
        self._model      = best_model_obj
        self._vectorizer = vectorizer
        self._model_name = best_model_name
        self._best_score = best_weighted

        return self.save_model(save_dir)

    # ── 4.2 PREDICT ───────────────────────────────────────────────────────
    def predict(self, merchant: str = "", description: str = "") -> str:
        """
        Phân loại một giao dịch.

        Priority:
          1. ML model (nếu đã load)
          2. Rule-based regex fallback
        """
        text = self._prepare_input(merchant, description)

        if self._model is not None and self._vectorizer is not None:
            try:
                vec = self._vectorizer.transform([text])
                return str(self._model.predict(vec)[0])
            except Exception as e:
                logger.warning(f"[Predict] ML lỗi: {e}. Dùng rules.")

        return self._rule_based(text)

    # ── 4.3 PREDICT PROBA ─────────────────────────────────────────────────
    def predict_proba(self, merchant: str = "", description: str = "") -> Dict[str, float]:
        """
        Trả về xác suất cho từng danh mục.
        Chỉ hoạt động với model có predict_proba (LogisticRegression, NB, RF).
        LinearSVC dùng decision_function thay thế (giá trị không chuẩn xác suất).
        """
        text = self._prepare_input(merchant, description)

        if self._model is None or self._vectorizer is None:
            # fallback: trả 1.0 cho category rule-based
            cat = self._rule_based(text)
            return {c: (1.0 if c == cat else 0.0) for c in CATEGORIES}

        vec = self._vectorizer.transform([text])
        try:
            if hasattr(self._model, "predict_proba"):
                probs = self._model.predict_proba(vec)[0]
                classes = self._model.classes_
                return {str(c): float(p) for c, p in zip(classes, probs)}
            elif hasattr(self._model, "decision_function"):
                # LinearSVC: softmax trên decision scores
                import numpy as np
                scores = self._model.decision_function(vec)[0]
                exp_s  = np.exp(scores - scores.max())
                probs  = exp_s / exp_s.sum()
                classes = self._model.classes_
                return {str(c): float(p) for c, p in zip(classes, probs)}
        except Exception as e:
            logger.warning(f"[PredictProba] {e}")

        # Fallback
        cat = self.predict(merchant, description)
        return {c: (1.0 if c == cat else 0.0) for c in CATEGORIES}

    # ── 4.4 EVALUATE ──────────────────────────────────────────────────────
    def evaluate(self, texts: List[str], labels: List[str]) -> Dict[str, float]:
        """
        Đánh giá model trên một tập dữ liệu bất kỳ.
        Trả về dict các metric chính.
        """
        from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

        if self._model is None or self._vectorizer is None:
            logger.warning("[Evaluate] Chưa có model.")
            return {}

        X_vec  = self._vectorizer.transform(texts)
        y_pred = self._model.predict(X_vec)

        metrics = {
            "accuracy":  float(accuracy_score(labels, y_pred)),
            "f1_macro":  float(f1_score(labels, y_pred, average="macro",  zero_division=0)),
            "precision": float(precision_score(labels, y_pred, average="macro", zero_division=0)),
            "recall":    float(recall_score(labels, y_pred, average="macro",    zero_division=0)),
        }

        print(f"\n  Evaluate — Acc: {metrics['accuracy']:.4f}  "
              f"F1: {metrics['f1_macro']:.4f}  "
              f"P: {metrics['precision']:.4f}  "
              f"R: {metrics['recall']:.4f}")
        return metrics

    # ── 4.5 SAVE MODEL ────────────────────────────────────────────────────
    def save_model(self, save_dir: Optional[str] = None) -> bool:
        """Lưu classifier và vectorizer thành 2 file pkl riêng biệt."""
        try:
            import joblib
            dir_ = save_dir or MODEL_DIR
            os.makedirs(dir_, exist_ok=True)

            joblib.dump(self._model,      os.path.join(dir_, "classifier.pkl"))
            joblib.dump(self._vectorizer, os.path.join(dir_, "vectorizer.pkl"))

            print(f"\n  ✅ Model đã lưu → {dir_}/")
            logger.info(f"[Save] Model {self._model_name} lưu tại {dir_}/")
            return True
        except Exception as e:
            logger.error(f"[Save] Lỗi lưu model: {e}")
            return False

    # ── 4.6 LOAD MODEL ────────────────────────────────────────────────────
    def load_model(self) -> bool:
        """Tải pkl từ disk vào bộ nhớ. Trả về True nếu thành công."""
        if not (os.path.exists(CLASSIFIER_PATH) and os.path.exists(VECTORIZER_PATH)):
            logger.info("[Load] Chưa có file pkl — sẽ dùng Rule-based.")
            return False
        try:
            import joblib
            self._model      = joblib.load(CLASSIFIER_PATH)
            self._vectorizer = joblib.load(VECTORIZER_PATH)
            logger.info("[Load] ✅ Model ML loaded thành công.")
            return True
        except Exception as e:
            logger.error(f"[Load] Lỗi tải model: {e}")
            self._model = None
            self._vectorizer = None
            return False

    # ── 4.7 RULE-BASED FALLBACK ───────────────────────────────────────────
    def _rule_based(self, text: str) -> str:
        """Phân loại bằng regex khi chưa có model hoặc model lỗi."""
        for category, patterns in self.RULES.items():
            for pattern in patterns:
                if re.search(pattern, text):
                    logger.debug(f"[Rules] '{text}' → '{category}' (pattern: {pattern})")
                    return category
        return "Other"

    # ── Compat alias (legacy interface) ───────────────────────────────────
    @classmethod
    def classify(cls, description: str) -> str:
        """
        Backward-compatible static method.
        Dùng singleton instance để gọi predict().
        """
        return _singleton.predict(description=description)

    @classmethod
    def train_model(cls, csv_path: str, save_dir: Optional[str] = None) -> bool:
        """Backward-compatible static method."""
        return _singleton.train(csv_path, save_dir)


# ══════════════════════════════════════════════════════════════════════════════
# 5. HELPERS
# ══════════════════════════════════════════════════════════════════════════════
def _print_class_distribution(labels: List[str]) -> None:
    from collections import Counter
    counter = Counter(labels)
    total = len(labels)
    print("\n  Phân phối lớp:")
    for cat, count in sorted(counter.items()):
        bar = "█" * int(count / total * 30)
        print(f"    {cat:<25} {count:>4}  {bar}")


def _print_confusion_matrix(cm, labels: List[str]) -> None:
    print(f"\n{'─'*60}")
    print("  CONFUSION MATRIX")
    print(f"{'─'*60}")
    col_w = 8
    header = "".join(f"{l[:col_w-1]:>{col_w}}" for l in labels)
    print(f"  {'':>18}{header}")
    for i, row_label in enumerate(labels):
        row = "".join(f"{cm[i][j]:>{col_w}}" for j in range(len(labels)))
        print(f"  {row_label[:18]:<18}{row}")
    print(f"{'─'*60}")


# ══════════════════════════════════════════════════════════════════════════════
# 6. SINGLETON — load model khi import
# ══════════════════════════════════════════════════════════════════════════════
_singleton = CategoryClassifier()
_singleton.load_model()   # silent — không lỗi nếu chưa có pkl
