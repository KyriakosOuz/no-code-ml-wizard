
import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MethodInfoTooltipProps {
  type: 'missingValues' | 'scaling' | 'problemType';
  method: string;
}

const MethodInfoTooltip: React.FC<MethodInfoTooltipProps> = ({ type, method }) => {
  // Define explanations for different methods
  const explanations: Record<string, Record<string, string>> = {
    missingValues: {
      mean: "Replaces missing values with the average value of the column. Good for normally distributed data.",
      median: "Replaces missing values with the middle value of the column. Best for skewed data with outliers.",
      most_frequent: "Replaces missing values with the most common value in the column. Good for categorical data.",
      hot_deck: "Replaces missing values with randomly sampled values from the same column. Preserves distribution.",
      remove: "Removes rows with any missing values. Only use if missing data is minimal.",
    },
    scaling: {
      standard: "Scales features to have mean=0 and variance=1. Best for algorithms sensitive to feature magnitudes.",
      minmax: "Scales features to a range between 0 and 1. Good for preserving distribution shape.",
      none: "No scaling applied. Use only if features are already on similar scales.",
    },
    problemType: {
      classification: "For predicting categories or classes (e.g., spam/not spam, disease type).",
      regression: "For predicting continuous numerical values (e.g., house prices, temperature).",
      auto: "Automatically detects whether classification or regression is more appropriate based on your target column.",
    },
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Info size={16} className="text-muted-foreground ml-1" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[250px]">
          <p>{explanations[type][method] || "No explanation available"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MethodInfoTooltip;
