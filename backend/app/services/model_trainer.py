"""
model_trainer.py
================
Module này có nhiệm vụ: Huấn luyện mô hình ML và chọn ra mô hình tốt nhất.

Thuật toán sử dụng:
1. TF-IDF Vectorizer: Chuyển văn bản → vector số
2. Logistic Regression: Mô hình phân loại chính (được chọn làm final model)

Tại sao chọn Logistic Regression?
- Phù hợp với dữ liệu text dạng TF-IDF (sparse vector)
- Có thể giải thích được (interpretable) - quan trọng trong báo cáo học thuật
- Hội tụ nhanh ngay cả với dataset nhỏ (< 500 mẫu)
- Cho kết quả tốt ngang bằng hoặc hơn các mô hình phức tạp hơn với text ngắn

Luồng huấn luyện:
  CSV data
    → Chia train/test (80% train, 20% test)
    → TF-IDF Vectorizer (học từ vựng trên tập train)
    → Huấn luyện Logistic Regression trên tập train
    → Đánh giá F1-score trên tập test
    → Lưu model + vectorizer thành file .pkl
"""

import os
import logging

logger = logging.getLogger(__name__)

# Đường dẫn thư mục lưu model
SERVICES_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(SERVICES_DIR, "models")
CLASSIFIER_FILE = os.path.join(MODEL_DIR, "classifier.pkl")
VECTORIZER_FILE = os.path.join(MODEL_DIR, "vectorizer.pkl")


def build_tfidf_vectorizer():
    """
    Khởi tạo TF-IDF Vectorizer với cấu hình phù hợp cho tiếng Việt.

    TF-IDF là gì?
    - TF (Term Frequency): Từ xuất hiện bao nhiêu lần trong văn bản này
    - IDF (Inverse Document Frequency): Từ hiếm quan trọng hơn từ phổ biến
    - TF-IDF = TF × IDF → Trọng số của từ trong văn bản

    Các tham số cấu hình:
    - ngram_range=(1,2): Học cả từ đơn ("cafe") và cặp từ ("ca phe", "tra sua")
    - sublinear_tf=True: Dùng log(tf) thay vì tf → giảm ảnh hưởng của từ lặp nhiều
    - min_df=1: Giữ lại cả từ hiếm (dataset nhỏ cần tận dụng mọi thông tin)
    - max_features=10000: Giới hạn tối đa 10.000 từ để tránh quá nhiều chiều (curse of dimensionality)

    Kết quả trả về:
        TfidfVectorizer: Object chưa được fit (chưa học từ vựng)
    """
    from sklearn.feature_extraction.text import TfidfVectorizer

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),     # Học unigram + bigram
        sublinear_tf=True,      # Dùng log(TF) thay vì TF thô
        min_df=1,               # Giữ cả từ hiếm
        max_features=10000,     # Tối đa 10.000 features
        analyzer="word",        # Tách theo từ (không phải ký tự)
    )

    return vectorizer


def build_logistic_regression():
    """
    Khởi tạo mô hình Logistic Regression.

    Logistic Regression trong phân loại văn bản:
    - Đây là mô hình tuyến tính (linear model), phù hợp với TF-IDF (sparse)
    - C=1.0: Tham số regularization - kiểm soát mức độ phức tạp của model
             C lớn → fit chặt hơn (có thể overfit), C nhỏ → đơn giản hơn
    - max_iter=1000: Số vòng lặp tối đa để model hội tụ
    - solver='lbfgs': Thuật toán tối ưu hóa (phù hợp với multiclass)
    - random_state=42: Seed để kết quả tái hiện được (reproducible)

    Kết quả trả về:
        LogisticRegression: Model chưa được train
    """
    from sklearn.linear_model import LogisticRegression

    classifier = LogisticRegression(
        C=1.0,
        max_iter=1000,
        solver="lbfgs",
        multi_class="auto",
        random_state=42,
    )

    return classifier


def split_train_test(transaction_texts, category_labels):
    """
    Chia dữ liệu thành tập Train (80%) và tập Test (20%).

    Tại sao cần chia?
    - Tập Train: Dùng để dạy model (model "nhìn thấy" dữ liệu này)
    - Tập Test:  Dùng để kiểm tra (model KHÔNG được nhìn thấy trước)
    - Nếu dùng cùng 1 tập để train và test → kết quả sẽ bị "gian lận"

    stratify=category_labels:
    - Đảm bảo tỷ lệ mỗi danh mục giống nhau trong cả train lẫn test
    - Ví dụ: 30% Food, 20% Transport → cả train và test đều có tỷ lệ đó

    Kết quả trả về:
        tuple: (train_texts, test_texts, train_labels, test_labels)
    """
    from sklearn.model_selection import train_test_split

    train_texts, test_texts, train_labels, test_labels = train_test_split(
        transaction_texts,
        category_labels,
        test_size=0.2,          # 20% dùng để test
        random_state=42,        # Seed cố định để tái hiện được
        stratify=category_labels,  # Giữ tỷ lệ danh mục đều nhau
    )

    print("  [Split] Train: " + str(len(train_texts)) + " mẫu | Test: " + str(len(test_texts)) + " mẫu")
    return train_texts, test_texts, train_labels, test_labels


def train_and_evaluate(transaction_texts, category_labels):
    """
    Huấn luyện Logistic Regression và đánh giá trên tập test.

    Quy trình chi tiết:
    1. Chia dữ liệu train/test (80/20)
    2. Khởi tạo TF-IDF Vectorizer
    3. Fit vectorizer trên tập TRAIN (học từ vựng)
    4. Transform cả train lẫn test thành vector số
    5. Huấn luyện Logistic Regression trên tập train
    6. Dự đoán trên tập test
    7. Tính F1-score, Accuracy
    8. In Classification Report và Confusion Matrix
    9. Trả về model và vectorizer đã huấn luyện

    Tham số đầu vào:
        transaction_texts (list): Danh sách văn bản đã chuẩn hóa
        category_labels   (list): Danh sách nhãn tương ứng

    Kết quả trả về:
        tuple: (trained_classifier, fitted_vectorizer, test_f1_score)
               Trả về (None, None, 0.0) nếu có lỗi
    """
    from sklearn.metrics import f1_score, classification_report, confusion_matrix

    # Bước 1: Chia dữ liệu
    print("\n  [Bước 1/5] Chia dữ liệu train/test (80% train, 20% test)...")
    train_texts, test_texts, train_labels, test_labels = split_train_test(
        transaction_texts, category_labels
    )

    # Bước 2: Khởi tạo TF-IDF Vectorizer
    print("  [Bước 2/5] Khởi tạo TF-IDF Vectorizer...")
    vectorizer = build_tfidf_vectorizer()

    # Bước 3: Fit vectorizer CHỈ trên tập train (học từ vựng từ train)
    # Lý do không fit trên test: tránh "data leakage" (rò rỉ thông tin)
    print("  [Bước 3/5] Chuyển văn bản thành vector TF-IDF...")
    train_vectors = vectorizer.fit_transform(train_texts)
    test_vectors = vectorizer.transform(test_texts)  # Chỉ transform, không fit lại

    vocabulary_size = len(vectorizer.vocabulary_)
    print("  Kích thước từ điển TF-IDF: " + str(vocabulary_size) + " từ/cụm từ")

    # Bước 4: Khởi tạo và huấn luyện Logistic Regression
    print("  [Bước 4/5] Huấn luyện mô hình Logistic Regression...")
    classifier = build_logistic_regression()
    classifier.fit(train_vectors, train_labels)
    print("  Huấn luyện hoàn tất!")

    # Bước 5: Đánh giá trên tập test
    print("  [Bước 5/5] Đánh giá mô hình trên tập test...")
    predicted_labels = classifier.predict(test_vectors)

    # Tính F1-score (macro: tính trung bình đều nhau giữa các danh mục)
    test_f1_score = f1_score(test_labels, predicted_labels, average="macro", zero_division=0)

    # Tính Accuracy (tỷ lệ dự đoán đúng)
    correct_count = 0
    for i in range(len(test_labels)):
        if test_labels[i] == predicted_labels[i]:
            correct_count = correct_count + 1
    accuracy = correct_count / len(test_labels)

    # In kết quả đánh giá
    print("\n" + "=" * 60)
    print("  KẾT QUẢ ĐÁNH GIÁ MÔ HÌNH (Logistic Regression + TF-IDF)")
    print("=" * 60)
    print("  Accuracy  (Độ chính xác tổng): " + "{:.2%}".format(accuracy))
    print("  F1-score  (macro, cân bằng):   " + "{:.2%}".format(test_f1_score))

    # In Classification Report chi tiết theo từng danh mục
    unique_labels = sorted(set(category_labels))
    print("\n  Chi tiết từng danh mục:")
    print(classification_report(test_labels, predicted_labels, labels=unique_labels, zero_division=0))

    # In Confusion Matrix
    print_confusion_matrix(test_labels, predicted_labels, unique_labels)

    return classifier, vectorizer, test_f1_score


def save_trained_model(trained_classifier, fitted_vectorizer):
    """
    Lưu mô hình đã huấn luyện và vectorizer vào file .pkl bằng joblib.

    Tại sao lưu thành file?
    - Không cần train lại mỗi lần server khởi động (tiết kiệm thời gian)
    - Chỉ train 1 lần, dùng mãi mãi cho đến khi có dataset mới

    2 file được tạo ra:
    - classifier.pkl: Chứa mô hình Logistic Regression đã học
    - vectorizer.pkl: Chứa TF-IDF Vectorizer đã biết từ vựng

    Lưu ý: Phải lưu CÙNG vectorizer đã dùng khi train.
    Nếu tải vectorizer khác → vector sẽ không tương thích với model.

    Tham số đầu vào:
        trained_classifier  (LogisticRegression): Mô hình đã huấn luyện
        fitted_vectorizer   (TfidfVectorizer):    Vectorizer đã fit

    Kết quả trả về:
        bool: True nếu lưu thành công, False nếu có lỗi
    """
    import joblib

    # Tạo thư mục models nếu chưa tồn tại
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)

    try:
        # Lưu mô hình phân loại
        joblib.dump(trained_classifier, CLASSIFIER_FILE)
        print("  Đã lưu model:      " + CLASSIFIER_FILE)

        # Lưu vectorizer (bắt buộc phải lưu cùng model)
        joblib.dump(fitted_vectorizer, VECTORIZER_FILE)
        print("  Đã lưu vectorizer: " + VECTORIZER_FILE)

        print("\n  ✅ Lưu model thành công!")
        logger.info("Model đã được lưu tại thư mục: " + MODEL_DIR)
        return True

    except Exception as error:
        logger.error("Lỗi khi lưu model: " + str(error))
        print("  ❌ Lỗi khi lưu model: " + str(error))
        return False


def load_saved_model():
    """
    Tải mô hình và vectorizer từ file .pkl đã lưu trên ổ đĩa.

    Quy trình:
    1. Kiểm tra 2 file có tồn tại không (classifier.pkl và vectorizer.pkl)
    2. Nếu có → tải vào bộ nhớ bằng joblib.load()
    3. Nếu không → trả về None, None (sẽ dùng rule-based fallback)

    Kết quả trả về:
        tuple: (trained_classifier, fitted_vectorizer)
               Trả về (None, None) nếu file không tồn tại hoặc lỗi
    """
    import joblib

    # Bước 1: Kiểm tra cả 2 file có tồn tại không
    classifier_exists = os.path.exists(CLASSIFIER_FILE)
    vectorizer_exists = os.path.exists(VECTORIZER_FILE)

    if not classifier_exists or not vectorizer_exists:
        logger.info("Chưa có file model PKL - sẽ dùng rule-based fallback")
        return None, None

    # Bước 2: Tải model từ file
    try:
        trained_classifier = joblib.load(CLASSIFIER_FILE)
        fitted_vectorizer = joblib.load(VECTORIZER_FILE)

        logger.info("✅ Đã tải model ML từ file PKL thành công")
        return trained_classifier, fitted_vectorizer

    except Exception as error:
        logger.error("Lỗi khi tải model: " + str(error))
        return None, None


def print_confusion_matrix(true_labels, predicted_labels, unique_labels):
    """
    In ma trận nhầm lẫn (Confusion Matrix) ra màn hình dạng text.

    Confusion Matrix là gì?
    - Hàng: Nhãn thực tế (Ground Truth)
    - Cột: Nhãn dự đoán (Prediction)
    - Số trên đường chéo: Dự đoán ĐÚNG (càng cao càng tốt)
    - Số ngoài đường chéo: Dự đoán SAI (càng thấp càng tốt)

    Tham số đầu vào:
        true_labels      (list): Danh sách nhãn thực tế
        predicted_labels (list): Danh sách nhãn dự đoán
        unique_labels    (list): Danh sách tên danh mục
    """
    from sklearn.metrics import confusion_matrix

    confusion = confusion_matrix(true_labels, predicted_labels, labels=unique_labels)

    print("\n  CONFUSION MATRIX (Hàng = Thực tế, Cột = Dự đoán):")
    print("  " + "-" * 60)

    # In tiêu đề cột (tên danh mục)
    column_width = 8
    header_row = "  " + " " * 20
    for label in unique_labels:
        # Cắt ngắn tên nếu quá dài để vừa cột
        short_label = label[:column_width - 1]
        header_row = header_row + short_label.rjust(column_width)
    print(header_row)

    # In từng hàng của ma trận
    for row_index in range(len(unique_labels)):
        row_label = unique_labels[row_index]
        # Cắt ngắn tên hàng nếu quá dài
        short_row_label = row_label[:18]
        data_row = "  " + short_row_label.ljust(20)

        for col_index in range(len(unique_labels)):
            cell_value = confusion[row_index][col_index]
            data_row = data_row + str(cell_value).rjust(column_width)
        print(data_row)

    print("  " + "-" * 60)
