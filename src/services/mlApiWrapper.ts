
import { UploadParams, processAutoML, uploadCSV } from "./mlApi";
import { withDefaultParams } from "./defaultParams";

// Wrapper function for processAutoML that handles defaults
export const processAutoMLWithDefaults = async (params: Partial<UploadParams>) => {
  const completeParams = withDefaultParams(params);
  return processAutoML(completeParams);
};

// Wrapper function for uploadCSV that handles defaults
export const uploadCSVWithDefaults = async (params: Partial<UploadParams>) => {
  const completeParams = withDefaultParams(params);
  return uploadCSV(completeParams);
};
