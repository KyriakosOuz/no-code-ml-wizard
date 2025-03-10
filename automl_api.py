
from fastapi import FastAPI, UploadFile, File, Form, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pandas as pd
import numpy as np
import joblib
import json
import matplotlib.pyplot as plt
import seaborn as sns
import io
import shutil
from io import StringIO, BytesIO
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder, MinMaxScaler
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from xgboost import XGBClassifier
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_recall_curve
from pydantic import BaseModel
import uvicorn

app = FastAPI()

# Allow Lovable frontend to access the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the static directory
app.mount("/static", StaticFiles(directory="./static"), name="static")

class DatasetOverviewResponse(BaseModel):
    num_rows: int
    num_columns: int
    column_details: list

@app.post("/upload-dataset/", response_model=DatasetOverviewResponse)
async def upload_dataset(file: UploadFile = File(...)):
    try:
        print(f"Received file: {file.filename}")

        # Read CSV into DataFrame
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")), na_values=["?", "NA", "N/A", "None", "null", ""])

        if df.empty:
            raise ValueError("Dataset is empty after loading.")

        print(f"Dataset loaded successfully: {df.shape}")

        # Detect column types and missing values
        column_details = []
        for col in df.columns:
            col_type = "categorical" if df[col].dtype == "object" else "numeric"
            missing_count = int(df[col].isnull().sum())  # Convert numpy.int64 → int
            missing_percent = round((missing_count / len(df)) * 100, 2)

            # Get a sample row with missing value if any
            sample_missing_row = None
            if missing_count > 0:
                missing_index = df[df[col].isnull()].index[0]
                sample_row = df.iloc[missing_index].to_dict()
                # Convert the row to a string representation
                sample_missing_row = str(sample_row)

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

            column_detail = {
                "name": col,
                "type": col_type,
                "missing_values": missing_count,
                "missing_percent": missing_percent,
                "stats": stats
            }
            
            # Add sample row only if missing values exist
            if sample_missing_row:
                column_detail["sample_missing_row"] = sample_missing_row
            
            column_details.append(column_detail)

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
    missing_value_symbol: str = Form("?"),
    missing_value_strategy: str = Form("median"),
    scaling_strategy: str = Form("standard"),
):
    try:
        # Load dataset and handle missing value symbol
        contents = await file.read()
        missing_values_list = ["NA", "N/A", "None", "null", ""]
        if missing_value_symbol and missing_value_symbol.strip():
            missing_values_list.append(missing_value_symbol)

        df = pd.read_csv(StringIO(contents.decode("utf-8")), na_values=missing_values_list)

        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataset.")

        # Detect problem type (Regression vs. Classification)
        if df[target_column].dtype in ["int64", "float64"]:
            problem_type = "regression"
        else:
            problem_type = "classification"

        print(f"Detected problem type: {problem_type}")

        # Detect categorical and numerical columns
        categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
        numerical_cols = df.select_dtypes(include=["int64", "float64"]).columns.tolist()

        # Handle missing values
        if missing_value_strategy == "mean":
            imputer = SimpleImputer(strategy="mean")
            df[numerical_cols] = imputer.fit_transform(df[numerical_cols])
            for col in categorical_cols:
                df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else "Unknown")

        elif missing_value_strategy == "median":
            imputer = SimpleImputer(strategy="median")
            df[numerical_cols] = imputer.fit_transform(df[numerical_cols])
            for col in categorical_cols:
                df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else "Unknown")

        elif missing_value_strategy == "most_frequent":
            imputer = SimpleImputer(strategy="most_frequent")
            df[numerical_cols] = imputer.fit_transform(df[numerical_cols])
            for col in categorical_cols:
                df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else "Unknown")

        elif missing_value_strategy == "hot_deck":
            for col in numerical_cols:
                missing_count = df[col].isnull().sum()
                if missing_count > 0:
                    df.loc[df[col].isnull(), col] = df[col].dropna().sample(n=missing_count, replace=True, random_state=42).values
            for col in categorical_cols:
                missing_count = df[col].isnull().sum()
                if missing_count > 0:
                    df.loc[df[col].isnull(), col] = df[col].dropna().sample(n=missing_count, replace=True, random_state=42).values

        elif missing_value_strategy == "remove":
            df.dropna(inplace=True)

        # Encode categorical features
        for col in categorical_cols:
            if col != target_column:
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col])

        # Encode categorical target variable if classification
        if problem_type == "classification":
            label_encoder = LabelEncoder()
            df[target_column] = label_encoder.fit_transform(df[target_column])

        # Normalize numerical data
        scaler = StandardScaler() if scaling_strategy == "standard" else MinMaxScaler()
        df[numerical_cols] = scaler.fit_transform(df[numerical_cols])

        # Split dataset
        X = df.drop(columns=[target_column])
        y = df[target_column]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Define models for classification & regression
        if problem_type == "classification":
            models = {
                "Logistic Regression": LogisticRegression(max_iter=500),
                "SVM": SVC(probability=True),
                "Naive Bayes": GaussianNB(),
                "KNN": KNeighborsClassifier(),
                "Gradient Boosting": GradientBoostingClassifier(),
                "Random Forest": RandomForestClassifier(n_jobs=-1),
                "XGBoost": XGBClassifier(use_label_encoder=False, eval_metric="logloss", n_jobs=-1),
            }
        else:
            models = {
                "Linear Regression": LogisticRegression(),
                "Random Forest Regressor": RandomForestClassifier(n_jobs=-1),
                "Gradient Boosting Regressor": GradientBoostingClassifier(),
                "XGBoost Regressor": XGBClassifier(use_label_encoder=False, eval_metric="rmse", n_jobs=-1),
            }

        best_model = None
        best_score = float('-inf') if problem_type == "regression" else 0
        results = {}

        # Train models
        for name, model in models.items():
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)

            if problem_type == "classification":
                score = accuracy_score(y_test, y_pred)
            else:
                score = -np.mean(cross_val_score(model, X, y, cv=5, scoring="neg_root_mean_squared_error"))

            results[name] = score
            if (problem_type == "classification" and score > best_score) or (problem_type == "regression" and score < best_score):
                best_score = score
                best_model = name
                best_model_instance = model

        # Save the best model
        joblib.dump(best_model_instance, "best_model.pkl")

        # Generate Evaluation Metrics
        y_pred = best_model_instance.predict(X_test)

        if problem_type == "classification":
            conf_matrix = confusion_matrix(y_test, y_pred)
            class_report = classification_report(y_test, y_pred, output_dict=True)
            train_acc = best_model_instance.score(X_train, y_train)
            test_acc = best_model_instance.score(X_test, y_test)
        else:
            conf_matrix = None
            class_report = None
            train_acc = best_model_instance.score(X_train, y_train)
            test_acc = best_model_instance.score(X_test, y_test)

        # Save evaluation report
        report_data = {
            "problem_type": problem_type,
            "model_scores": results,
            "best_model": best_model,
            "best_score": best_score,
            "confusion_matrix": conf_matrix.tolist() if conf_matrix is not None else None,
            "classification_report": class_report,
            "training_score": train_acc,
            "test_score": test_acc,
        }
        with open("model_report.json", "w") as f:
            json.dump(report_data, f, indent=4)

        return {
            "report": report_data,
            "confusion_matrix_image": "/static/confusion_matrix.png" if conf_matrix is not None else None
        }

    except Exception as e:
        print(f"ERROR: {str(e)}")
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
