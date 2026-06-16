import os
import re
import csv
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class CategoryClassifier:
    """
    Classifies a financial transaction description/merchant name into categories:
    - Food & Beverage
    - Transportation
    - Bills & Utilities
    - Shopping
    - Entertainment
    - Other
    """
    
    # Simple rule-based mapping for fallback
    RULES = {
        "Food & Beverage": [
            r"coffee", r"tra sua", r"gongcha", r"phuc long", r"starbucks", r"com tam", 
            r"an sang", r"an toi", r"kfc", r"lotteria", r"highlands", r"bun bo", r"pho", r"food",
            r"cafe", r"cà phê", r"phở", r"bún", r"cơm", r"restaurant", r"nhà hàng", r"quán", 
            r"pizza", r"burger", r"jollibee", r"tea", r"trà", r"lẩu", r"nướng"
        ],
        "Transportation": [
            r"grab", r"taxi", r"do xang", r"xang dau", r"bus", r"xe om", r"beamin", 
            r"flight", r"ve may bay", r"ve tau", r"train", r"metro", r"xe", r"vận chuyển", 
            r"transport", r"petro"
        ],
        "Bills & Utilities": [
            r"hoa don", r"dien nuoc", r"internet", r"wifi", r"dien thoai", r"nap card", 
            r"mobifone", r"viettel", r"vinaphone", r"thue nha", r"apartment", r"bill",
            r"điện", r"nước", r"cáp quang", r"chung cư", r"rác"
        ],
        "Shopping": [
            r"shopee", r"lazada", r"tiki", r"quan ao", r"giay dep", r"sieu thi", 
            r"winmart", r"coopmart", r"shopping", r"mall", r"mua sam", r"fashion",
            r"mart", r"market", r"circle k", r"gs25", r"mini stop", r"7-eleven", r"shop", r"store",
            r"bách hóa xanh", r"lottemart", r"zara", r"uniqlo", r"nike", r"adidas"
        ],
        "Entertainment": [
            r"cgv", r"lotte cin", r"rap chieu phim", r"movie", r"netflix", r"spotify", 
            r"game", r"steam", r"playstation", r"bar", r"pub", r"karaoke", r"rạp",
            r"cinema", r"galaxy", r"nhạc", r"đầm sen", r"vinwonders", r"triển lãm"
        ]
    }

    # Model file path configuration
    MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
    CLASSIFIER_PATH = os.path.join(MODEL_DIR, "classifier.pkl")
    VECTORIZER_PATH = os.path.join(MODEL_DIR, "vectorizer.pkl")

    _model = None
    _vectorizer = None

    @classmethod
    def load_model(cls) -> bool:
        """
        Loads the trained classifier and vectorizer models if they exist.
        """
        if os.path.exists(cls.CLASSIFIER_PATH) and os.path.exists(cls.VECTORIZER_PATH):
            try:
                import joblib
                cls._model = joblib.load(cls.CLASSIFIER_PATH)
                cls._vectorizer = joblib.load(cls.VECTORIZER_PATH)
                logger.info("✅ ML Category Classification Model loaded successfully!")
                return True
            except Exception as e:
                logger.error(f"⚠️ Error loading ML model: {e}. Falling back to Rule-Based Classifier.")
                cls._model = None
                cls._vectorizer = None
        return False

    @classmethod
    def classify(cls, description: str) -> str:
        """
        Classifies a transaction description.
        Attempts to use ML model first; if not loaded/fails, falls back to Rules.
        """
        if not description:
            return "Other"

        desc_lower = description.lower().strip()

        # 1. Try ML Model first
        if cls._model is None or cls._vectorizer is None:
            # Try loading it on the fly if not done yet
            cls.load_model()

        if cls._model is not None and cls._vectorizer is not None:
            try:
                X_vec = cls._vectorizer.transform([desc_lower])
                pred = cls._model.predict(X_vec)[0]
                logger.info(f"[ML] Classified '{description}' -> '{pred}'")
                return pred
            except Exception as e:
                logger.warning(f"[ML] Classification error: {e}. Using rule fallback.")

        # 2. Rule-based fallback
        for category, patterns in cls.RULES.items():
            for pattern in patterns:
                if re.search(pattern, desc_lower):
                    logger.info(f"[Rules] Classified '{description}' -> '{category}'")
                    return category
                    
        return "Other"

    @classmethod
    def train_model(cls, csv_path: str, save_dir: Optional[str] = None) -> bool:
        """
        Trains a text classifier (TfidfVectorizer + LogisticRegression) using a CSV dataset
        without requiring pandas.
        """
        if save_dir is None:
            save_dir = cls.MODEL_DIR

        os.makedirs(save_dir, exist_ok=True)
        
        descriptions = []
        categories = []

        # Read dataset using Python built-in csv reader
        try:
            with open(csv_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    desc = row.get("description")
                    cat = row.get("category")
                    if desc and cat:
                        descriptions.append(desc.lower().strip())
                        categories.append(cat.strip())
        except Exception as e:
            logger.error(f"❌ Error reading dataset file: {e}")
            return False

        if not descriptions:
            logger.error("❌ Dataset is empty or could not be parsed.")
            return bool(False)

        logger.info(f"Starting training on {len(descriptions)} samples...")

        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.linear_model import LogisticRegression
            import joblib

            # Vectorize description text
            vectorizer = TfidfVectorizer(ngram_range=(1, 2))
            X = vectorizer.fit_transform(descriptions)
            y = categories

            # Train Logistic Regression model
            model = LogisticRegression(max_iter=1000, C=1.0)
            model.fit(X, y)

            # Save models to pickle files
            joblib.dump(model, os.path.join(save_dir, "classifier.pkl"))
            joblib.dump(vectorizer, os.path.join(save_dir, "vectorizer.pkl"))
            logger.info(f"✅ Training complete! Models saved to: {save_dir}")

            # Reload into current runtime
            cls._model = model
            cls._vectorizer = vectorizer
            return True

        except Exception as e:
            logger.error(f"❌ Error training ML model: {e}")
            import traceback
            traceback.print_exc()
            return False

# Trigger initial model load
CategoryClassifier.load_model()
