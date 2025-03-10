
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
import os
from io import StringIO, BytesIO
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder, MinMaxScaler
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, RandomForestRegressor, GradientBoostingRegressor
from xgboost import XGBClassifier, XGBRegressor
from sklearn.svm import SVC, SVR
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_recall_curve, mean_squared_error, r2_score
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

# Create static directory if it doesn't exist
os.makedirs("./static", exist_ok=True)

# Mount the static directory
app.mount("/static", StaticFiles(directory="./static"), name="static")

class DatasetOverviewResponse(BaseModel):
    num_rows: int
    num_columns: int
    column_details: list
    sample_rows: list
    missing_values_summary: dict
    correlation_matrix: dict

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
        missing_values_summary = {"columns": [], "percentages": []}
        
        for col in df.columns:
            # Determine column type
            if pd.api.types.is_numeric_dtype(df[col]):
                col_type = "numeric"
            elif pd.api.types.is_datetime64_any_dtype(df[col]):
                col_type = "datetime"
            else:
                col_type = "categorical"
                
            missing_count = int(df[col].isnull().sum())
            missing_percent = round((missing_count / len(df)) * 100, 2)
            
            # Add to missing values summary if any values are missing
            if missing_count > 0:
                missing_values_summary["columns"].append(col)
                missing_values_summary["percentages"].append(missing_percent)

            # Get a sample row with missing value if any
            sample_missing_row = None
            if missing_count > 0:
                missing_index = df[df[col].isnull()].index[0]
                sample_row = df.iloc[missing_index].to_dict()
                # Convert the row to a string representation
                sample_missing_row = str(sample_row)

            if col_type == "numeric":
                # Calculate additional statistics for numeric columns
                stats = {
                    "min": float(df[col].min()) if not df[col].isnull().all() else None,
                    "max": float(df[col].max()) if not df[col].isnull().all() else None,
                    "mean": round(float(df[col].mean()), 2) if not df[col].isnull().all() else None,
                    "std_dev": round(float(df[col].std()), 2) if not df[col].isnull().all() else None,
                    "median": float(df[col].median()) if not df[col].isnull().all() else None,
                    "skewness": round(float(df[col].skew()), 2) if not df[col].isnull().all() else None,
                    "kurtosis": round(float(df[col].kurtosis()), 2) if not df[col].isnull().all() else None,
                    "quartiles": {
                        "25%": float(df[col].quantile(0.25)) if not df[col].isnull().all() else None,
                        "50%": float(df[col].quantile(0.5)) if not df[col].isnull().all() else None,
                        "75%": float(df[col].quantile(0.75)) if not df[col].isnull().all() else None
                    }
                }
                
                # Generate histogram for numeric columns
                if not df[col].isnull().all():
                    plt.figure(figsize=(8, 4))
                    sns.histplot(df[col].dropna(), kde=True)
                    plt.title(f"Distribution of {col}")
                    plt.xlabel(col)
                    plt.ylabel("Frequency")
                    plt.tight_layout()
                    
                    # Save histogram
                    hist_path = f"./static/{col}_histogram.png"
                    plt.savefig(hist_path)
                    plt.close()
            else:
                # For categorical columns
                stats = {
                    "unique_values": int(df[col].nunique()),
                    "most_common": df[col].mode()[0] if not df[col].mode().empty else "N/A",
                    "most_common_count": int(df[col].value_counts().iloc[0]) if not df[col].value_counts().empty else 0,
                    "least_common": df[col].value_counts().index[-1] if not df[col].value_counts().empty else "N/A",
                    "least_common_count": int(df[col].value_counts().iloc[-1]) if not df[col].value_counts().empty else 0
                }
                
                # Generate bar chart for categorical columns if not too many categories
                if not df[col].isnull().all() and df[col].nunique() < 20:
                    plt.figure(figsize=(10, 5))
                    value_counts = df[col].value_counts().nlargest(10)
                    sns.barplot(x=value_counts.index, y=value_counts.values)
                    plt.title(f"Top 10 Categories in {col}")
                    plt.xticks(rotation=45, ha='right')
                    plt.tight_layout()
                    
                    # Save bar chart
                    barchart_path = f"./static/{col}_barchart.png"
                    plt.savefig(barchart_path)
                    plt.close()

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

        # Generate correlation matrix for numeric columns
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        correlation_matrix = {}
        if len(numeric_cols) > 1:
            corr_matrix = df[numeric_cols].corr().round(2)
            correlation_matrix = {
                "columns": numeric_cols,
                "values": corr_matrix.values.tolist()
            }
            
            # Generate correlation heatmap
            plt.figure(figsize=(10, 8))
            sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', linewidths=0.5)
            plt.title("Feature Correlation Matrix")
            plt.tight_layout()
            plt.savefig("./static/correlation_heatmap.png")
            plt.close()

        # Get sample rows for preview (first 5 rows)
        sample_rows = df.head(5).to_dict('records')
        
        # Generate missing values visualization
        if missing_values_summary["columns"]:
            plt.figure(figsize=(10, 6))
            sns.barplot(x=missing_values_summary["percentages"], y=missing_values_summary["columns"])
            plt.title("Percentage of Missing Values by Column")
            plt.xlabel("Missing Values (%)")
            plt.tight_layout()
            plt.savefig("./static/missing_values_chart.png")
            plt.close()

        return {
            "num_rows": int(len(df)),
            "num_columns": int(len(df.columns)),
            "column_details": column_details,
            "sample_rows": sample_rows,
            "missing_values_summary": missing_values_summary,
            "correlation_matrix": correlation_matrix
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
    problem_type: str = Form("auto"),
):
    try:
        # Load dataset and handle missing value symbol
        contents = await file.read()
        missing_values_list = ["NA", "N/A", "None", "null", ""]
        if missing_value_symbol and missing_value_symbol.strip():
            missing_values_list.append(missing_value_symbol)

        df = pd.read_csv(StringIO(contents.decode("utf-8")), na_values=missing_values_list)
        
        # Save original dataset for reference
        df.to_csv("./static/original_dataset.csv", index=False)

        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataset.")

        # Auto-detect problem type if set to 'auto'
        if problem_type == "auto":
            if df[target_column].dtype in ["int64", "float64"]:
                # Check if the target has few unique values (likely classification)
                if df[target_column].nunique() < 10 and df[target_column].nunique() / len(df) < 0.05:
                    problem_type = "classification"
                else:
                    problem_type = "regression"
            else:
                problem_type = "classification"
                
        print(f"Using problem type: {problem_type}")

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
        if problem_type == "classification" and target_column in categorical_cols:
            label_encoder = LabelEncoder()
            df[target_column] = label_encoder.fit_transform(df[target_column])
            # Save class labels for later reference
            class_names = label_encoder.classes_.tolist()
            with open("./static/class_names.json", "w") as f:
                json.dump(class_names, f)

        # Normalize numerical data
        scaler = StandardScaler() if scaling_strategy == "standard" else MinMaxScaler()
        df[numerical_cols] = scaler.fit_transform(df[numerical_cols])

        # Save preprocessed dataset
        df.to_csv("./static/preprocessed_dataset.csv", index=False)

        # Split dataset
        X = df.drop(columns=[target_column])
        y = df[target_column]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Save feature names for later use in feature importance plots
        with open("./static/feature_names.json", "w") as f:
            json.dump(X.columns.tolist(), f)

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
        else:  # regression
            models = {
                "Linear Regression": LinearRegression(),
                "Random Forest Regressor": RandomForestRegressor(n_jobs=-1),
                "Gradient Boosting Regressor": GradientBoostingRegressor(),
                "XGBoost Regressor": XGBRegressor(eval_metric="rmse", n_jobs=-1),
                "SVR": SVR(),
                "KNN Regressor": KNeighborsRegressor(),
            }

        best_model = None
        best_score = float('-inf') if problem_type == "regression" else 0
        results = {}
        model_predictions = {}

        # Train models
        for name, model in models.items():
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            model_predictions[name] = y_pred.tolist()

            if problem_type == "classification":
                score = accuracy_score(y_test, y_pred)
            else:
                score = -np.mean(cross_val_score(model, X, y, cv=5, scoring="neg_root_mean_squared_error"))

            results[name] = float(score)  # Convert to float for JSON serialization
            
            if (problem_type == "classification" and score > best_score) or (problem_type == "regression" and score < best_score):
                best_score = score
                best_model = name
                best_model_instance = model

        # Save the best model
        joblib.dump(best_model_instance, "best_model.pkl")

        # Generate Evaluation Metrics
        y_pred = best_model_instance.predict(X_test)
        
        # Try to get feature importance if available
        try:
            if hasattr(best_model_instance, 'feature_importances_'):
                # Feature importance plot
                feature_importance = best_model_instance.feature_importances_
                feature_names = X.columns
                
                # Sort features by importance
                indices = np.argsort(feature_importance)[::-1]
                
                # Plot
                plt.figure(figsize=(10, 6))
                plt.bar(range(X.shape[1]), feature_importance[indices])
                plt.xticks(range(X.shape[1]), [feature_names[i] for i in indices], rotation=90)
                plt.title(f'Feature Importance - {best_model}')
                plt.tight_layout()
                plt.savefig('./static/feature_importance.png')
                plt.close()
                
                # Save feature importance data
                importance_data = {}
                for i, feature in enumerate(feature_names):
                    importance_data[feature] = float(feature_importance[i])
                
                with open('./static/feature_importance.json', 'w') as f:
                    json.dump(importance_data, f)
        except Exception as e:
            print(f"Could not generate feature importance: {str(e)}")

        if problem_type == "classification":
            # Confusion Matrix
            conf_matrix = confusion_matrix(y_test, y_pred)
            
            plt.figure(figsize=(8, 6))
            sns.heatmap(conf_matrix, annot=True, fmt='d', cmap='Blues')
            plt.title('Confusion Matrix')
            plt.ylabel('True Label')
            plt.xlabel('Predicted Label')
            plt.tight_layout()
            plt.savefig('./static/confusion_matrix.png')
            plt.close()
            
            # Classification Report
            class_report = classification_report(y_test, y_pred, output_dict=True)
            
            # ROC and Precision-Recall
            if hasattr(best_model_instance, 'predict_proba'):
                y_prob = best_model_instance.predict_proba(X_test)
                
                # Precision-Recall curve
                if len(set(y_test)) == 2:  # Binary classification
                    precision, recall, _ = precision_recall_curve(y_test, y_prob[:, 1])
                    
                    plt.figure(figsize=(8, 6))
                    plt.plot(recall, precision, marker='.')
                    plt.title('Precision-Recall Curve')
                    plt.xlabel('Recall')
                    plt.ylabel('Precision')
                    plt.grid(True)
                    plt.savefig('./static/precision_recall.png')
                    plt.close()
            
            train_acc = best_model_instance.score(X_train, y_train)
            test_acc = best_model_instance.score(X_test, y_test)
            
            model_metrics = {
                "training_accuracy": float(train_acc),
                "test_accuracy": float(test_acc),
                "class_report": class_report,
                "confusion_matrix": conf_matrix.tolist(),
            }
        else:  # Regression
            # RMSE, R2, etc.
            train_pred = best_model_instance.predict(X_train)
            train_rmse = np.sqrt(mean_squared_error(y_train, train_pred))
            train_r2 = r2_score(y_train, train_pred)
            
            test_rmse = np.sqrt(mean_squared_error(y_test, y_pred))
            test_r2 = r2_score(y_test, y_pred)
            
            # Residual Plot
            plt.figure(figsize=(8, 6))
            residuals = y_test - y_pred
            plt.scatter(y_pred, residuals)
            plt.axhline(y=0, color='r', linestyle='-')
            plt.title('Residual Plot')
            plt.xlabel('Predicted Values')
            plt.ylabel('Residuals')
            plt.grid(True)
            plt.savefig('./static/residual_plot.png')
            plt.close()
            
            # Actual vs Predicted Plot
            plt.figure(figsize=(8, 6))
            plt.scatter(y_test, y_pred)
            plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--')
            plt.title('Actual vs Predicted')
            plt.xlabel('Actual Values')
            plt.ylabel('Predicted Values')
            plt.grid(True)
            plt.savefig('./static/actual_vs_predicted.png')
            plt.close()
            
            model_metrics = {
                "train_rmse": float(train_rmse),
                "train_r2": float(train_r2),
                "test_rmse": float(test_rmse),
                "test_r2": float(test_r2),
            }

        # Save all model comparisons
        model_comparison = {}
        for name, score in results.items():
            model_comparison[name] = {
                "score": float(score),
                "is_best": name == best_model
            }

        # Save evaluation report
        report_data = {
            "problem_type": problem_type,
            "model_scores": results,
            "best_model": best_model,
            "best_score": float(best_score),
            "model_metrics": model_metrics,
            "model_comparison": model_comparison,
            "model_predictions": {
                "test_indices": X_test.index.tolist(),
                "actual_values": y_test.tolist(),
                "predictions": model_predictions
            }
        }
        
        with open("model_report.json", "w") as f:
            json.dump(report_data, f, indent=4)

        result_urls = {
            "report": report_data,
            "dataset_url": "/static/original_dataset.csv",
            "preprocessed_dataset_url": "/static/preprocessed_dataset.csv",
            "confusion_matrix_image": "/static/confusion_matrix.png" if problem_type == "classification" else None,
            "feature_importance_image": "/static/feature_importance.png",
            "precision_recall_image": "/static/precision_recall.png" if problem_type == "classification" else None,
            "residual_plot_image": "/static/residual_plot.png" if problem_type == "regression" else None,
            "actual_vs_predicted_image": "/static/actual_vs_predicted.png" if problem_type == "regression" else None,
            "correlation_heatmap": "/static/correlation_heatmap.png",
            "missing_values_chart": "/static/missing_values_chart.png"
        }

        return result_urls

    except Exception as e:
        print(f"ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AutoML pipeline failed: {str(e)}")


@app.get("/download-model/")
def download_model():
    try:
        with open("best_model.pkl", "rb") as model_file:
            return Response(
                content=model_file.read(),
                media_type="application/octet-stream",
                headers={"Content-Disposition": "attachment; filename=best_model.pkl"},
            )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Model file not found: {str(e)}")


@app.get("/download-report/")
def download_report():
    try:
        with open("model_report.json", "rb") as report_file:
            return Response(
                content=report_file.read(),
                media_type="application/json",
                headers={"Content-Disposition": "attachment; filename=model_report.json"},
            )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Report file not found: {str(e)}")


@app.get("/download-dataset/")
def download_dataset():
    try:
        with open("./static/original_dataset.csv", "rb") as dataset_file:
            return Response(
                content=dataset_file.read(),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=original_dataset.csv"},
            )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Dataset file not found: {str(e)}")


@app.get("/download-preprocessed-dataset/")
def download_preprocessed_dataset():
    try:
        with open("./static/preprocessed_dataset.csv", "rb") as dataset_file:
            return Response(
                content=dataset_file.read(),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=preprocessed_dataset.csv"},
            )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Preprocessed dataset file not found: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080, timeout_keep_alive=120)
