
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CorrelationMatrix as CorrelationMatrixType } from '@/services/mlApi';
import { getImageUrl } from '@/services/mlApi';
import { Spinner } from '@/components/ui/spinner';

interface CorrelationMatrixProps {
  correlationMatrix: CorrelationMatrixType;
}

const CorrelationMatrix: React.FC<CorrelationMatrixProps> = ({ correlationMatrix }) => {
  const chartUrl = getImageUrl('/static/correlation_heatmap.png');
  
  // If no correlation data, don't display chart
  if (!correlationMatrix || !correlationMatrix.columns || correlationMatrix.columns.length <= 1) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Feature Correlation Matrix</CardTitle>
        <CardDescription>
          Relationships between numerical features in your dataset
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartUrl ? (
          <div className="rounded-md overflow-hidden border">
            <img 
              src={chartUrl} 
              alt="Correlation Matrix" 
              className="w-full h-auto"
              onError={(e) => {
                // Hide image if it fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="flex justify-center items-center p-8">
            <Spinner size="md" />
          </div>
        )}
        
        <div className="mt-3 text-sm text-muted-foreground">
          <p>
            <span className="font-medium">Correlation interpretation:</span> Values close to 1 indicate strong positive correlation, 
            close to -1 indicate strong negative correlation, and close to 0 indicate little to no correlation.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CorrelationMatrix;
