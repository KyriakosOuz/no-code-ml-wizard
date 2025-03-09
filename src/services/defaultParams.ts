
import { UploadParams } from "./mlApi";

// This function takes a partial UploadParams object and fills in any missing values with defaults
export const withDefaultParams = (params: Partial<UploadParams>): UploadParams => {
  return {
    file: params.file as File,
    targetColumn: params.targetColumn || "",
    missingValueStrategy: params.missingValueStrategy || "median",
    scalingStrategy: params.scalingStrategy || "standard",
    missingValueSymbol: params.missingValueSymbol || "?", // Default to "?" if not provided
  };
};
