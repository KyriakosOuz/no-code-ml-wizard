
import axios from "axios";

const API_BASE_URL = "https://no-code-ml-wizard-production.up.railway.app";

interface UploadParams {
  file: File;
  targetColumn: string;
  missingValueStrategy: string;
  scalingStrategy: string;
}

export const uploadCSV = async (params: UploadParams): Promise<any> => {
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

export const downloadModel = async (): Promise<void> => {
  const response = await axios.get(`${API_BASE_URL}/download-model/`, {
    responseType: "blob",
  });

  // Create a download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "best_model.pkl");
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const downloadReport = async (): Promise<any> => {
  const response = await axios.get(`${API_BASE_URL}/download-report/`);
  return response.data;
};
