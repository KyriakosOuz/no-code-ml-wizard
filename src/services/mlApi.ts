
import axios from "axios";

const API_BASE_URL = "https://no-code-ml-wizard-production.up.railway.app";

export interface UploadParams {
  file: File;
  targetColumn: string;
  missingValueStrategy: string;
  scalingStrategy: string;
  missingValueSymbol?: string; // Changed back to optional to maintain compatibility
}

export interface DatasetOverview {
  num_rows: number;
  num_columns: number;
  column_details: ColumnDetail[];
}

export interface ColumnDetail {
  name: string;
  type: "numeric" | "categorical";
  missing_values: number;
  missing_percent: number;
  stats: NumericStats | CategoricalStats;
}

interface NumericStats {
  min: number;
  max: number;
  mean: number;
  std_dev: number;
  median: number;
}

interface CategoricalStats {
  unique_values: number;
  most_common: string;
}

export const uploadDataset = async (file: File): Promise<DatasetOverview> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(`${API_BASE_URL}/upload-dataset/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 30000, // 30 seconds timeout
    });

    return response.data;
  } catch (error) {
    console.error("Error uploading dataset:", error);
    if (axios.isAxiosError(error) && error.code === 'ERR_NETWORK') {
      throw new Error("Network error: Unable to connect to the ML server. Please check your internet connection and try again.");
    }
    throw new Error("Failed to analyze the dataset. Please check the file format and try again.");
  }
};

// Add the uploadCSV function that ModelTraining is expecting to use
export const uploadCSV = async (params: UploadParams) => {
  // This is essentially the same as processAutoML but with a different name
  return processAutoML(params);
};

export const processAutoML = async (params: UploadParams) => {
  try {
    const formData = new FormData();
    formData.append("file", params.file);
    formData.append("target_column", params.targetColumn);
    formData.append("missing_value_strategy", params.missingValueStrategy);
    formData.append("scaling_strategy", params.scalingStrategy);
    
    // Use default "?" if missingValueSymbol is not provided
    const missingValueSymbol = params.missingValueSymbol || "?";
    formData.append("missing_value_symbol", missingValueSymbol);

    const response = await axios.post(`${API_BASE_URL}/automl/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 120000, // 120 seconds (2 minutes) for model training
    });

    return response.data;
  } catch (error) {
    console.error("Error processing AutoML:", error);
    if (axios.isAxiosError(error) && error.code === 'ERR_NETWORK') {
      throw new Error("Network error: Unable to connect to the ML server. Please check your internet connection and try again.");
    }
    // Add more detailed error message based on actual API response
    if (axios.isAxiosError(error) && error.response) {
      const errorDetail = error.response.data?.detail || "Unknown server error";
      throw new Error(`Failed to process the dataset: ${errorDetail}`);
    }
    throw new Error("Failed to process the dataset. Please check that the target column exists and try again.");
  }
};

export const downloadModel = (): void => {
  try {
    window.open(`${API_BASE_URL}/download-model/`);
  } catch (error) {
    console.error("Error downloading model:", error);
    throw new Error("Failed to download the model. Please try again later.");
  }
};

export const downloadReport = (): void => {
  try {
    window.open(`${API_BASE_URL}/download-report/`);
  } catch (error) {
    console.error("Error downloading report:", error);
    throw new Error("Failed to download the report. Please try again later.");
  }
};

export const getConfusionMatrixUrl = (): string => {
  return `${API_BASE_URL}/static/confusion_matrix.png`;
};

export const getFeatureImportanceUrl = (): string => {
  return `${API_BASE_URL}/static/feature_importance.png`;
};

export const getPrecisionRecallUrl = (): string => {
  return `${API_BASE_URL}/static/precision_recall.png`;
};
