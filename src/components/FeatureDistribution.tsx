
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ColumnDetail } from '@/services/mlApi';
import { ChartContainer, LineChart, BarChart } from '@/components/ui/chart';
import { getImageUrl } from '@/services/mlApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from '@/components/ui/spinner';

interface FeatureDistributionProps {
  columnDetail: ColumnDetail;
  featureName: string;
}

const FeatureDistribution: React.FC<FeatureDistributionProps> = ({ columnDetail, featureName }) => {
  const histogramUrl = getImageUrl(`/static/${featureName}_histogram.png`);
  const barChartUrl = getImageUrl(`/static/${featureName}_barchart.png`);
  
  if (!columnDetail) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{featureName} Distribution</CardTitle>
        <CardDescription>
          {columnDetail.type === 'numeric' 
            ? 'Distribution of numeric values' 
            : 'Frequency of categories'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {columnDetail.type === 'numeric' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Statistics</h4>
                <div className="bg-muted/50 p-3 rounded-md text-sm">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="font-medium">Min:</div>
                    <div>{(columnDetail.stats as any).min?.toFixed(2)}</div>
                    
                    <div className="font-medium">Max:</div>
                    <div>{(columnDetail.stats as any).max?.toFixed(2)}</div>
                    
                    <div className="font-medium">Mean:</div>
                    <div>{(columnDetail.stats as any).mean?.toFixed(2)}</div>
                    
                    <div className="font-medium">Median:</div>
                    <div>{(columnDetail.stats as any).median?.toFixed(2)}</div>
                    
                    <div className="font-medium">Std Dev:</div>
                    <div>{(columnDetail.stats as any).std_dev?.toFixed(2)}</div>
                    
                    {(columnDetail.stats as any).skewness !== undefined && (
                      <>
                        <div className="font-medium">Skewness:</div>
                        <div>{(columnDetail.stats as any).skewness?.toFixed(2)}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Quartiles</h4>
                <div className="bg-muted/50 p-3 rounded-md text-sm">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="font-medium">25%:</div>
                    <div>{(columnDetail.stats as any).quartiles?.["25%"]?.toFixed(2) || "N/A"}</div>
                    
                    <div className="font-medium">50%:</div>
                    <div>{(columnDetail.stats as any).quartiles?.["50%"]?.toFixed(2) || "N/A"}</div>
                    
                    <div className="font-medium">75%:</div>
                    <div>{(columnDetail.stats as any).quartiles?.["75%"]?.toFixed(2) || "N/A"}</div>
                    
                    <div className="font-medium">Missing:</div>
                    <div>{columnDetail.missing_values} ({columnDetail.missing_percent}%)</div>
                  </div>
                </div>
              </div>
            </div>
            
            {histogramUrl && (
              <div className="mt-4 rounded-md overflow-hidden border">
                <img 
                  src={histogramUrl} 
                  alt={`${featureName} Histogram`} 
                  className="w-full h-auto"
                  onError={(e) => {
                    // Hide image if it fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Statistics</h4>
                <div className="bg-muted/50 p-3 rounded-md text-sm">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="font-medium">Unique Values:</div>
                    <div>{(columnDetail.stats as any).unique_values}</div>
                    
                    <div className="font-medium">Most Common:</div>
                    <div className="truncate max-w-[150px]" title={(columnDetail.stats as any).most_common}>
                      {(columnDetail.stats as any).most_common}
                    </div>
                    
                    {(columnDetail.stats as any).most_common_count !== undefined && (
                      <>
                        <div className="font-medium">Count:</div>
                        <div>{(columnDetail.stats as any).most_common_count}</div>
                      </>
                    )}
                    
                    <div className="font-medium">Missing:</div>
                    <div>{columnDetail.missing_values} ({columnDetail.missing_percent}%)</div>
                  </div>
                </div>
              </div>
            </div>
            
            {barChartUrl && (
              <div className="mt-4 rounded-md overflow-hidden border">
                <img 
                  src={barChartUrl} 
                  alt={`${featureName} Bar Chart`} 
                  className="w-full h-auto"
                  onError={(e) => {
                    // Hide image if it fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeatureDistribution;
