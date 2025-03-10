import pandas as pd
import numpy as np
import json
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from xgboost import XGBClassifier, XGBRegressor
from sklearn.svm import SVC, SVR
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    mean_absolute_error, mean_squared_error, r2_score
)


def train_model(df, target_column, algorithm, hyperparameters, missing_value_strategy, scaling_strategy, auto_tune, generate_visualization):
    """Processes data, trains model, and evaluates results."""

    # Detect problem type (classification vs regression)
    problem_type = "classification" if df[target_column].dtype == "object" else "regression"

    # Handle missing values dynamically
    numerical_cols = df.select_dtypes(include=["int64", "float64"]).columns.tolist()
    categorical_cols = df.select_dtypes(include=["object"]).columns.tolist()

    imputer_methods = {
        "mean": SimpleImputer(strategy="mean"),
        "median": SimpleImputer(strategy="median"),
        "most_frequent": SimpleImputer(strategy="most_frequent"),
        "knn": KNNImputer(n_neighbors=5)
    }

    if missing_value_strategy in imputer_methods:
        df[numerical_cols] = imputer_methods[missing_value_strategy].fit_transform(df[numerical_cols])

    for col in categorical_cols:
        df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else "Unknown")

    # Encode categorical variables
    for col in categorical_cols:
        if col != target_column:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col])

    # Normalize numerical features
    scaler = StandardScaler() if scaling_strategy == "standard" else MinMaxScaler()
    df[numerical_cols] = scaler.fit_transform(df[numerical_cols])

    # Train-test split
    X = df.drop(columns=[target_column])
    y = df[target_column]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Model selection
    models = {
        "Random Forest": RandomForestClassifier() if problem_type == "classification" else RandomForestRegressor(),
        "Gradient Boosting": GradientBoostingClassifier() if problem_type == "classification" else GradientBoostingRegressor(),
        "XGBoost": XGBClassifier() if problem_type == "classification" else XGBRegressor(),
        "SVM": SVC(probability=True) if problem_type == "classification" else SVR(),
        "KNN": KNeighborsClassifier() if problem_type == "classification" else KNeighborsRegressor()
    }

    if algorithm not in models:
        raise ValueError(f"Invalid algorithm '{algorithm}' selected.")

    model = models[algorithm]

    # Load hyperparameters
    hyperparameters = json.loads(hyperparameters)

    if auto_tune:
        param_grid = {"n_estimators": [50, 100, 200]} if "n_estimators" in model.get_params() else {"C": [0.1, 1, 10]}
        grid_search = GridSearchCV(model, param_grid, cv=5)
        grid_search.fit(X_train, y_train)
        model = grid_search.best_estimator_

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    # Evaluate model
    if problem_type == "classification":
        metrics = {
            "accuracy": accuracy_score(y_test, y_pred),
            "classification_report": classification_report(y_test, y_pred, output_dict=True),
            "confusion_matrix": confusion_matrix(y_test, y_pred).tolist()
        }
    else:
        metrics = {
            "mean_absolute_error": mean_absolute_error(y_test, y_pred),
            "mean_squared_error": mean_squared_error(y_test, y_pred),
            "r2_score": r2_score(y_test, y_pred)
        }

    # Generate Visualizations
    if generate_visualization:
        plt.figure(figsize=(8, 5))
        sns.histplot(y_pred, kde=True)
        plt.title(f"{algorithm} Prediction Distribution")
        plt.savefig("static/prediction_distribution.png")

    return {
        "algorithm": algorithm,
        "metrics": metrics,
        "best_hyperparameters": model.get_params() if auto_tune else hyperparameters,
        "visualization": "/static/prediction_distribution.png" if generate_visualization else None
    }
