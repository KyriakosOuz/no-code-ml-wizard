
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ColumnDetail, MissingValuesSummary } from '@/services/mlApi';
import { getImageUrl } from '@/services/mlApi';
import { Spinner } from '@/components/ui/spinner';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MissingValuesChartProps {
  missingSummary: MissingValuesSummary;
  columnDetails: ColumnDetail[];
}

const MissingValuesChart: React.FC<MissingValuesChartProps> = ({ missingSummary, columnDetails }) => {
  const chartUrl = getImageUrl('/static/missing_values_chart.png');
  
  // If no missing values, don't display chart
  if (!missingSummary.columns || missingSummary.columns.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Missing Values</CardTitle>
          <CardDescription>No missing values detected in your dataset</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Your dataset is complete with no missing values.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Find sample rows with missing values
  const samplesWithMissing = columnDetails
    .filter(col => col.sample_missing_row)
    .map(col => ({
      column: col.name,
      sample: col.sample_missing_row,
      missingPercent: col.missing_percent
    }));

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Missing Values</CardTitle>
            <CardDescription>
              {missingSummary.columns.length} columns have missing values
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info size={16} className="text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Missing values will be handled according to your selected strategy</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {chartUrl && (
          <div className="rounded-md overflow-hidden border">
            <img 
              src={chartUrl} 
              alt="Missing Values Chart" 
              className="w-full h-auto"
              onError={(e) => {
                // Hide image if it fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        
        {samplesWithMissing.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Sample Rows with Missing Values</h4>
            <div className="space-y-2 text-sm">
              {samplesWithMissing.slice(0, 3).map((sample, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-md">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{sample.column}</span>
                    <span className="text-xs bg-amber-100 text-amber-800 py-0.5 px-2 rounded-full">
                      {sample.missingPercent}% missing
                    </span>
                  </div>
                  <div className="text-xs font-mono break-all opacity-70">
                    {sample.sample}
                  </div>
                </div>
              ))}
              
              {samplesWithMissing.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  + {samplesWithMissing.length - 3} more columns with missing values
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MissingValuesChart;
