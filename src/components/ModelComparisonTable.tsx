
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ModelReport } from '@/services/mlApi';
import { Check } from "lucide-react";

interface ModelComparisonTableProps {
  modelReport: ModelReport;
}

const ModelComparisonTable: React.FC<ModelComparisonTableProps> = ({ modelReport }) => {
  if (!modelReport || !modelReport.model_comparison) {
    return null;
  }

  const isClassification = modelReport.problem_type === 'classification';
  
  // Format score for display based on problem type
  const formatScore = (score: number) => {
    if (isClassification) {
      // For classification, show as percentage
      return `${(score * 100).toFixed(2)}%`;
    } else {
      // For regression, show RMSE or other metric
      return score.toFixed(4);
    }
  };

  // Get models sorted by performance (based on problem type)
  const sortedModels = Object.entries(modelReport.model_comparison)
    .sort(([, a], [, b]) => {
      if (isClassification) {
        // For classification, higher score is better
        return b.score - a.score;
      } else {
        // For regression, lower score (error) is better
        return a.score - b.score;
      }
    });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Model Comparison</CardTitle>
        <CardDescription>
          {isClassification 
            ? "Models ranked by accuracy" 
            : "Models ranked by error (lower is better)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">
                  {isClassification ? "Accuracy" : "RMSE"}
                </TableHead>
                <TableHead className="w-[100px] text-center">Best Model</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedModels.map(([modelName, details], index) => (
                <TableRow key={modelName} className={details.is_best ? "bg-primary/5" : ""}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{modelName}</TableCell>
                  <TableCell className="text-right">{formatScore(details.score)}</TableCell>
                  <TableCell className="text-center">
                    {details.is_best && <Check className="mx-auto text-green-600" size={18} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelComparisonTable;
