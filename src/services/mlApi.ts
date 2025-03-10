
import axios from "axios";

const API_BASE_URL = "https://no-code-ml-wizard-production.up.railway.app";

export interface UploadParams {
  file: File;
  targetColumn: string;
  missingValueStrategy: string;
  scalingStrategy: string;
  missingValueSymbol?: string; // Optional since we provide a default
  problemType: string; // Required: "classification" or "regression" or "auto"
}

export interface DatasetOverview {
  num_rows: number;
  num_columns: number;
  column_details: ColumnDetail[];
  sample_rows: any[]; // Preview of first 5 rows
  missing_values_summary: MissingValuesSummary;
  correlation_matrix: CorrelationMatrix;
}

export interface MissingValuesSummary {
  columns: string[];
  percentages: number[];
}

export interface CorrelationMatrix {
  columns: string[];
  values: number[][];
}

export interface ColumnDetail {
  name: string;
  type: "numeric" | "categorical" | "datetime";
  missing_values: number;
  missing_percent: number;
  stats: NumericStats | CategoricalStats;
  sample_missing_row?: string; // Added sample row field for columns with missing values
}

interface NumericStats {
  min: number;
  max: number;
  mean: number;
  std_dev: number;
  median: number;
  skewness?: number;
  kurtosis?: number;
  quartiles?: {
    "25%": number;
    "50%": number;
    "75%": number;
  };
}

interface CategoricalStats {
  unique_values: number;
  most_common: string;
  most_common_count?: number;
  least_common?: string;
  least_common_count?: number;
}

export interface ModelReport {
  problem_type: string;
  model_scores: Record<string, number>;
  best_model: string;
  best_score: number;
  model_metrics: ClassificationMetrics | RegressionMetrics;
  model_comparison: Record<string, ModelComparison>;
  model_predictions: {
    test_indices: number[];
    actual_values: number[] | string[];
    predictions: Record<string, (number | string)[]>;
  };
}

interface ModelComparison {
  score: number;
  is_best: boolean;
}

interface ClassificationMetrics {
  training_accuracy: number;
  test_accuracy: number;
  class_report: any;
  confusion_matrix: number[][];
}

interface RegressionMetrics {
  train_rmse: number;
  train_r2: number;
  test_rmse: number;
  test_r2: number;
}

export interface ModelResultUrls {
  report: ModelReport;
  dataset_url: string;
  preprocessed_dataset_url: string;
  confusion_matrix_image?: string;
  feature_importance_image?: string;
  precision_recall_image?: string;
  residual_plot_image?: string;
  actual_vs_predicted_image?: string;
  correlation_heatmap?: string;
  missing_values_chart?: string;
}

export const uploadDataset = async (file: File): Promise<DatasetOverview> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(`${API_BASE_URL}/upload-dataset/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60 seconds timeout for dataset analysis
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
export const uploadCSV = async (params: Partial<UploadParams>) => {
  // Ensure problemType is set with a default value if missing
  const completeParams: UploadParams = {
    file: params.file as File,
    targetColumn: params.targetColumn || "",
    missingValueStrategy: params.missingValueStrategy || "median",
    scalingStrategy: params.scalingStrategy || "standard",
    missingValueSymbol: params.missingValueSymbol || "?",
    problemType: params.problemType || "auto" // Default to auto-detection if not specified
  };
  
  // This is essentially the same as processAutoML but with a different name
  return processAutoML(completeParams);
};

export const processAutoML = async (params: Partial<UploadParams>): Promise<ModelResultUrls> => {
  try {
    console.log("Processing AutoML with params:", params); // Add debugging
    const formData = new FormData();
    formData.append("file", params.file as File);
    formData.append("target_column", params.targetColumn || "");
    formData.append("missing_value_strategy", params.missingValueStrategy || "median");
    formData.append("scaling_strategy", params.scalingStrategy || "standard");
    
    // Ensure missing value symbol is explicitly set and not undefined
    const missingValueSymbol = params.missingValueSymbol || "?";
    formData.append("missing_value_symbol", missingValueSymbol);
    
    // Explicitly require problem type parameter with a default
    const problemType = params.problemType || "auto";
    formData.append("problem_type", problemType);
    
    console.log("Using missing value symbol:", missingValueSymbol); // Add debugging
    console.log("Using problem type:", problemType); // Add debugging

    const response = await axios.post(`${API_BASE_URL}/automl/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 180000, // 3 minutes for model training
    });

    return response.data;
  } catch (error) {
    console.error("Error processing AutoML:", error);
    
    if (axios.isAxiosError(error) && error.code === 'ERR_NETWORK') {
      throw new Error("Network error: Unable to connect to the ML server. Please check your internet connection and try again.");
    }
    
    // Handle specific known errors
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data;
      console.error("Error response data:", errorData);
      
      // Handle specific error about continuous vs categorical target
      if (errorData?.detail && typeof errorData.detail === 'string') {
        if (errorData.detail.includes("Unknown label type: continuous")) {
          throw new Error(
            "Dataset error: It appears your target column contains continuous values, " +
            "but you're trying to perform a classification task. For numeric target columns, " + 
            "please use regression instead."
          );
        } else if (errorData.detail.includes("Classification metrics are not defined for regression")) {
          throw new Error(
            "Dataset error: It appears your target column contains discrete values, " +
            "but you're trying to perform a regression task. For categorical target columns, " + 
            "please use classification instead."
          );
        }
      }
      
      const errorDetail = errorData?.detail || "Unknown server error";
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

export const downloadDataset = (): void => {
  try {
    window.open(`${API_BASE_URL}/download-dataset/`);
  } catch (error) {
    console.error("Error downloading dataset:", error);
    throw new Error("Failed to download the dataset. Please try again later.");
  }
};

export const downloadPreprocessedDataset = (): void => {
  try {
    window.open(`${API_BASE_URL}/download-preprocessed-dataset/`);
  } catch (error) {
    console.error("Error downloading processed dataset:", error);
    throw new Error("Failed to download the processed dataset. Please try again later.");
  }
};

export const getImageUrl = (imagePath: string | null | undefined): string | undefined => {
  if (!imagePath) return undefined;
  return `${API_BASE_URL}${imagePath}`;
};
