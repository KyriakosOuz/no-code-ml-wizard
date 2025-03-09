from fastapi import FastAPI, UploadFile, File, Form, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import joblib
import json
import matplotlib.pyplot as plt
import seaborn as sns
import io
from io import StringIO, BytesIO
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder, MinMaxScaler
from sklearn.impute import KNNImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from xgboost import XGBClassifier
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from pydantic import BaseModel
import uvicorn

app = FastAPI()

# Allow Lovable frontend to access the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://preview--no-code-ml-wizard.lovable.app"],  # Update with your Lovable frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DatasetOverviewResponse(BaseModel):
    num_rows: int
    num_columns: int
    column_details: list

@app.post("/upload-dataset/", response_model=DatasetOverviewResponse)
async def upload_dataset(file: UploadFile = File(...)):
    try:
        print(f"📂 Received file: {file.filename}")

        # Read CSV into DataFrame
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))

        if df.empty:
            raise ValueError("❌ Dataset is empty after loading.")

        print(f"✅ Dataset loaded successfully: {df.shape}")

        # Detect column types
        column_details = []
        for col in df.columns:
            col_type = "categorical" if df[col].dtype == "object" else "numeric"
            missing_count = int(df[col].isnull().sum())  # Convert numpy.int64 → int
            missing_percent = round((missing_count / len(df)) * 100, 2)

            if col_type == "numeric":
                stats = {
                    "min": float(df[col].min()) if not df[col].isnull().all() else None,
                    "max": float(df[col].max()) if not df[col].isnull().all() else None,
                    "mean": round(float(df[col].mean()), 2) if not df[col].isnull().all() else None,
                    "std_dev": round(float(df[col].std()), 2) if not df[col].isnull().all() else None,
                    "median": float(df[col].median()) if not df[col].isnull().all() else None,
                }
            else:
                stats = {
                    "unique_values": int(df[col].nunique()),  # Convert numpy.int64 → int
                    "most_common": df[col].mode()[0] if not df[col].mode().empty else "N/A",
                }

            column_details.append({
                "name": col,
                "type": col_type,
                "missing_values": missing_count,
                "missing_percent": missing_percent,
                "stats": stats
            })

        return {
            "num_rows": int(len(df)),  # Convert numpy.int64 → int
            "num_columns": int(len(df.columns)),  # Convert numpy.int64 → int
            "column_details": column_details
        }

    except Exception as e:
        print(f"🚨 ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Dataset upload failed: {str(e)}")


@app.post("/automl/")
async def automl_pipeline(
    file: UploadFile = File(...),
    target_column: str = Form(...),
    missing_value_strategy: str = Form("median"),
    scaling_strategy: str = Form("standard"),
):
    try:
        # Load dataset
        contents = await file.read()
        df = pd.read_csv(StringIO(contents.decode("utf-8")))

        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataset.")

        print(f"Data loaded: {df.shape}")

        # Detect categorical and numerical columns
        categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
        numerical_cols = df.select_dtypes(include=["int64", "float64"]).columns.tolist()

        # Handle missing values
        if missing_value_strategy == "median":
            df.fillna(df.median(numeric_only=True), inplace=True)
        elif missing_value_strategy == "mean":
            df.fillna(df.mean(numeric_only=True), inplace=True)
        elif missing_value_strategy == "mode":
            df.fillna(df.mode().iloc[0], inplace=True)
        elif missing_value_strategy == "knn":
            imputer = KNNImputer(n_neighbors=5)
            df[numerical_cols] = imputer.fit_transform(df[numerical_cols])
        elif missing_value_strategy == "remove":
            df.dropna(inplace=True)

        # Encode categorical target variable
        label_encoder = LabelEncoder()
        df[target_column] = label_encoder.fit_transform(df[target_column])

        # Check class distribution
        class_counts = df[target_column].value_counts()
        if class_counts.min() < 2:
            raise HTTPException(status_code=400, detail=f"Insufficient samples in class: {class_counts.to_dict()}. Each class must have at least 2 samples.")

        # Normalize numerical data
        scaler = StandardScaler() if scaling_strategy == "standard" else MinMaxScaler()
        df[numerical_cols] = scaler.fit_transform(df[numerical_cols])

        # Split dataset
        X = df.drop(columns=[target_column])
        y = df[target_column]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

        # Define models (using fewer models initially)
        models = {
            "Logistic Regression": LogisticRegression(max_iter=500),
            "SVM": SVC(probability=True),
            "Naive Bayes": GaussianNB(),
            "KNN": KNeighborsClassifier(),
            "Gradient Boosting": GradientBoostingClassifier(),
            "Random Forest": RandomForestClassifier(n_jobs=-1),
            "XGBoost": XGBClassifier(use_label_encoder=False, eval_metric="logloss", n_jobs=-1),
        }

        best_model = None
        best_accuracy = 0
        results = {}

        # Train models
        for name, model in models.items():
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            results[name] = accuracy
            if accuracy > best_accuracy:
                best_accuracy = accuracy
                best_model = name
                best_model_instance = model

        # Save the best model
        joblib.dump(best_model_instance, "best_model.pkl")

        # Generate Evaluation Metrics
        y_pred = best_model_instance.predict(X_test)
        conf_matrix = confusion_matrix(y_test, y_pred)
        class_report = classification_report(y_test, y_pred, output_dict=True)
        cross_val_scores = cross_val_score(best_model_instance, X, y, cv=5, scoring="accuracy", n_jobs=-1)
        mean_cv_accuracy = np.mean(cross_val_scores)
        train_acc = best_model_instance.score(X_train, y_train)
        test_acc = best_model_instance.score(X_test, y_test)

        # Generate confusion matrix plot
        plt.figure(figsize=(10, 7))
        sns.heatmap(conf_matrix, annot=True, fmt="d", cmap="Blues")
        plt.xlabel("Predicted")
        plt.ylabel("Actual")
        plt.title("Confusion Matrix")

        # Save the plot as a BytesIO object
        img_bytes = BytesIO()
        plt.savefig(img_bytes, format="png")
        img_bytes.seek(0)

        # Save evaluation report
        report_data = {
            "model_accuracies": results,
            "best_model": best_model,
            "best_accuracy": best_accuracy,
            "confusion_matrix": conf_matrix.tolist(),
            "classification_report": class_report,
            "cross_validation_scores": cross_val_scores.tolist(),
            "mean_cross_validation_accuracy": mean_cv_accuracy,
            "training_accuracy": train_acc,
            "test_accuracy": test_acc,
        }
        with open("model_report.json", "w") as f:
            json.dump(report_data, f, indent=4)

        return {"report": report_data, "confusion_matrix_image": "confusion_matrix.png"}

    except Exception as e:
        print(f"🚨 ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AutoML pipeline failed: {str(e)}")


@app.get("/download-model/")
def download_model():
    with open("best_model.pkl", "rb") as model_file:
        return Response(
            content=model_file.read(),
            media_type="application/octet-stream",
            headers={"Content-Disposition": "attachment; filename=best_model.pkl"},
        )


@app.get("/download-report/")
def download_report():
    with open("model_report.json", "rb") as report_file:
        return Response(
            content=report_file.read(),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=model_report.json"},
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080, timeout_keep_alive=120)
