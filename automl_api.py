from fastapi import FastAPI, UploadFile, File, Form, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pandas as pd
import numpy as np
import joblib
import json
import io
import matplotlib.pyplot as plt
import seaborn as sns
from io import StringIO
from typing import Dict, Optional
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from xgboost import XGBClassifier, XGBRegressor
from sklearn.svm import SVC, SVR
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, mean_absolute_error, mean_squared_error, r2_score

app = FastAPI()

# Allow frontend to access the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directory
app.mount("/static", StaticFiles(directory="./static"), name="static")


@app.post("/upload-dataset/")
async def upload_dataset(file: UploadFile = File(...)):
    """Handles dataset upload and provides an overview"""
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")), na_values=["?", "NA", "N/A", "None", "null", ""])

        if df.empty:
            raise ValueError("Dataset is empty after loading.")

        column_details = []
        for col in df.columns:
            col_type = "categorical" if df[col].dtype == "object" else "numeric"
            missing_count = int(df[col].isnull().sum())
            missing_percent = round((missing_count / len(df)) * 100, 2)

            # Sample row with missing value
            sample_missing_row = None
            if missing_count > 0:
                missing_index = df[df[col].isnull()].index[0]
                sample_row = df.iloc[missing_index].replace({np.nan: "NaN", "?": "?", "": "Empty", None: "Null"}).to_dict()
                sample_missing_row = str(sample_row)

            stats = {
                "min": float(df[col].min()) if col_type == "numeric" and not df[col].isnull().all() else None,
                "max": float(df[col].max()) if col_type == "numeric" and not df[col].isnull().all() else None,
                "mean": round(float(df[col].mean()), 2) if col_type == "numeric" and not df[col].isnull().all() else None,
                "std_dev": round(float(df[col].std()), 2) if col_type == "numeric" and not df[col].isnull().all() else None,
                "median": float(df[col].median()) if col_type == "numeric" and not df[col].isnull().all() else None,
                "unique_values": int(df[col].nunique()) if col_type == "categorical" else None,
                "most_common": df[col].mode()[0] if col_type == "categorical" and not df[col].mode().empty else "N/A",
            }

            column_details.append({
                "name": col,
                "type": col_type,
                "missing_values": missing_count,
                "missing_percent": missing_percent,
                "stats": stats,
                "sample_missing_row": sample_missing_row
            })

        return {"num_rows": len(df), "num_columns": len(df.columns), "column_details": column_details}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dataset upload failed: {str(e)}")


from fastapi import FastAPI, UploadFile, File, Form, Response, HTTPException
import json
import pandas as pd
import numpy as np
from typing import Dict, Optional
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.preprocessing import StandardScaler, MinMaxScaler

app = FastAPI()

@app.post("/automl/")
async def automl_pipeline(
    file: UploadFile = File(...),
    target_column: str = Form(...),
    algorithm: str = Form(...),
    hyperparameters: str = Form("{}"),
    missing_value_strategy: str = Form("median"),  # Default single strategy
    scaling_strategy: str = Form("standard"),  # Default single scaling method
    missing_value_per_column: Optional[str] = Form(None),  # JSON string (for per-column mode)
    scaling_per_column: Optional[str] = Form(None),  # JSON string (for per-column mode)
    use_per_column_strategy: bool = Form(False),  # Toggle for per-column mode
):
    try:
        # Load CSV file
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")), na_values=["?", "NA", "N/A", "None", "null", ""])

        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataset.")

        # Detect numerical and categorical columns
        categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
        numerical_cols = df.select_dtypes(include=["int64", "float64"]).columns.tolist()

        # HANDLE MISSING VALUES
        if use_per_column_strategy:
            missing_value_per_column = json.loads(missing_value_per_column or "{}")  # Convert JSON to dict
            for col, strategy in missing_value_per_column.items():
                if col in numerical_cols:
                    if strategy == "mean":
                        df[col].fillna(df[col].mean(), inplace=True)
                    elif strategy == "median":
                        df[col].fillna(df[col].median(), inplace=True)
                    elif strategy == "most_frequent":
                        df[col].fillna(df[col].mode()[0], inplace=True)
                    elif strategy == "knn":
                        imputer = KNNImputer(n_neighbors=5)
                        df[[col]] = imputer.fit_transform(df[[col]])
                elif col in categorical_cols:
                    df[col].fillna(df[col].mode()[0], inplace=True)
        else:
            if missing_value_strategy == "mean":
                df[numerical_cols] = df[numerical_cols].fillna(df[numerical_cols].mean())
            elif missing_value_strategy == "median":
                df[numerical_cols] = df[numerical_cols].fillna(df[numerical_cols].median())
            elif missing_value_strategy == "most_frequent":
                df[numerical_cols] = df[numerical_cols].fillna(df[numerical_cols].mode().iloc[0])
                df[categorical_cols] = df[categorical_cols].fillna(df[categorical_cols].mode().iloc[0])
            elif missing_value_strategy == "knn":
                imputer = KNNImputer(n_neighbors=5)
                df[numerical_cols] = imputer.fit_transform(df[numerical_cols])

        # HANDLE SCALING (NORMALIZATION)
        if use_per_column_strategy:
            scaling_per_column = json.loads(scaling_per_column or "{}")  # Convert JSON to dict
            for col, strategy in scaling_per_column.items():
                if col in numerical_cols:
                    if strategy == "minmax":
                        scaler = MinMaxScaler()
                        df[[col]] = scaler.fit_transform(df[[col]])
                    elif strategy == "standard":
                        scaler = StandardScaler()
                        df[[col]] = scaler.fit_transform(df[[col]])
        else:
            if scaling_strategy == "minmax":
                scaler = MinMaxScaler()
                df[numerical_cols] = scaler.fit_transform(df[numerical_cols])
            elif scaling_strategy == "standard":
                scaler = StandardScaler()
                df[numerical_cols] = scaler.fit_transform(df[numerical_cols])

        # RETURN PROCESSED DATA
        return {
            "message": "Data processed successfully",
            "missing_value_strategy_used": missing_value_strategy if not use_per_column_strategy else missing_value_per_column,
            "scaling_strategy_used": scaling_strategy if not use_per_column_strategy else scaling_per_column,
        }

        # Train-test split
        X = df.drop(columns=[target_column])
        y = df[target_column]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Load hyperparameters
        hyperparameters = json.loads(hyperparameters)

        # Define models
        models = {
            "Random Forest": RandomForestClassifier if problem_type == "classification" else RandomForestRegressor,
            "Gradient Boosting": GradientBoostingClassifier if problem_type == "classification" else GradientBoostingRegressor,
            "XGBoost": XGBClassifier if problem_type == "classification" else XGBRegressor,
        }

        model_class = models[algorithm]
        model = model_class(**hyperparameters)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        # Generate visualizations if requested
        if generate_visualization:
            plt.figure(figsize=(10, 5))
            sns.histplot(y_pred, kde=True)
            plt.title("Prediction Distribution")
            plt.savefig("static/prediction_distribution.png")

        return {
            "algorithm": algorithm,
            "metrics": accuracy_score(y_test, y_pred) if problem_type == "classification" else mean_absolute_error(y_test, y_pred),
            "visualization": "/static/prediction_distribution.png" if generate_visualization else None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AutoML pipeline failed: {str(e)}")
