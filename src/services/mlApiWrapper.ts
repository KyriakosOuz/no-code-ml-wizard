
import { uploadDataset, uploadCSV, processAutoML, UploadParams } from "./mlApi";
import { withDefaultParams } from "./defaultParams";

export const uploadDatasetWithDefaults = uploadDataset;

export const uploadCSVWithDefaults = (params: Partial<UploadParams>) => {
  return uploadCSV(withDefaultParams(params));
};

export const processAutoMLWithDefaults = (params: Partial<UploadParams>) => {
  return processAutoML(withDefaultParams(params));
};

// Re-export other functions from mlApi.ts
export { 
  downloadModel, 
  downloadReport, 
  getConfusionMatrixUrl, 
  getFeatureImportanceUrl, 
  getPrecisionRecallUrl 
} from "./mlApi";
