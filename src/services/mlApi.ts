
import axios from "axios";

const API_BASE_URL = "https://no-code-ml-wizard-production.up.railway.app";

export interface UploadParams {
  file: File;
  targetColumn: string;
  missingValueStrategy: string;
  scalingStrategy: string;
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
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(`${API_BASE_URL}/upload-dataset/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const processAutoML = async (params: UploadParams) => {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("target_column", params.targetColumn);
  formData.append("missing_value_strategy", params.missingValueStrategy);
  formData.append("scaling_strategy", params.scalingStrategy);

  const response = await axios.post(`${API_BASE_URL}/automl/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const downloadModel = (): void => {
  window.open(`${API_BASE_URL}/download-model/`);
};

export const downloadReport = (): void => {
  window.open(`${API_BASE_URL}/download-report/`);
};

export const getConfusionMatrixUrl = (): string => {
  return `${API_BASE_URL}/confusion_matrix.png`;
};
