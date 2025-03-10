from fastapi import FastAPI, UploadFile, File, Form, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pandas as pd
import numpy as np
import json
import io
from io import StringIO
from typing import Dict, Optional
from model_training import train_model  # Import training functions

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directory for visualizations
app.mount("/static", StaticFiles(directory="./static"), name="static")


@app.post("/upload-dataset/")
async def upload_dataset(file: UploadFile = File(...)):
    """Handles dataset upload and provides an overview."""
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")), na_values=["?", "NA", "N/A", "None", "null", "", "undefined"])

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
                "min": df[col].min() if col_type == "numeric" else None,
                "max": df[col].max() if col_type == "numeric" else None,
                "mean": df[col].mean() if col_type == "numeric" else None,
                "std_dev": df[col].std() if col_type == "numeric" else None,
                "median": df[col].median() if col_type == "numeric" else None,
                "unique_values": df[col].nunique() if col_type == "categorical" else None,
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


@app.post("/automl/")
async def automl_pipeline(
    file: UploadFile = File(...),
    target_column: str = Form(...),
    algorithm: str = Form(...),
    hyperparameters: str = Form("{}"),
    missing_value_strategy: str = Form("median"),
    scaling_strategy: str = Form("standard"),
    auto_tune: bool = Form(False),
    generate_visualization: bool = Form(False)
):
    """Handles AutoML training by calling model_training functions."""
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")), na_values=["?", "NA", "N/A", "None", "null", ""])

        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataset.")

        # Send data to training module
        result = train_model(df, target_column, algorithm, hyperparameters, missing_value_strategy, scaling_strategy, auto_tune, generate_visualization)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AutoML pipeline failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080, timeout_keep_alive=120)
