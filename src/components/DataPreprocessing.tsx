
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ArrowDown, ArrowUp, SlidersHorizontal, Check, Table as TableIcon } from "lucide-react";

interface DataPreprocessingProps {
  data: any;
  onDataUpdate: (updatedData: any) => void;
  isProcessing: boolean;
}

const DataPreprocessing: React.FC<DataPreprocessingProps> = ({ data, onDataUpdate, isProcessing }) => {
  const { toast } = useToast();
  const [imputing, setImputing] = useState(false);
  const [normalizing, setNormalizing] = useState(false);
  const [imputationMethod, setImputationMethod] = useState<'hotdeck' | 'remove'>('hotdeck');
  const [normalizationMethod, setNormalizationMethod] = useState<'minmax' | 'zscore'>('minmax');
  const [normalizeEnabled, setNormalizeEnabled] = useState(false);

  // Only enable preprocessing if we have data with missing values
  const hasMissingValues = data?.missingData?.hasMissing || false;
  const missingCount = data?.missingData?.missingCount || 0;
  const missingColumns = data?.missingData?.missingColumns || [];
  
  // Get counts of numerical and categorical columns
  const columnTypes = Object.entries(data?.types || {}).reduce(
    (acc, [_, type]) => {
      if (type === 'numeric') acc.numerical++;
      else if (type === 'categorical') acc.categorical++;
      return acc;
    },
    { numerical: 0, categorical: 0 }
  );

  // Handle missing values
  const handleImputeMissingValues = async () => {
    if (!data) return;
    
    setImputing(true);
    try {
      // Import the handleMissingValues function dynamically to ensure module is loaded
      const { handleMissingValues } = await import('@/utils/mlUtils');
      
      toast({
        title: "Processing",
        description: `Handling missing values using ${imputationMethod === 'hotdeck' ? 'Hot Deck imputation' : 'row removal'}...`,
      });
      
      const updatedData = await handleMissingValues(data, imputationMethod);
      
      onDataUpdate(updatedData);
      
      toast({
        title: "Success",
        description: imputationMethod === 'hotdeck' 
          ? `Imputed ${missingCount} missing values across ${missingColumns.length} columns.` 
          : `Removed ${updatedData.missingData.removedRows} rows with missing values.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to handle missing values. Please try again.",
        variant: "destructive",
      });
    } finally {
      setImputing(false);
    }
  };

  // Handle normalization
  const handleNormalizeData = async () => {
    if (!data) return;
    
    setNormalizing(true);
    try {
      // Import the normalizeData function dynamically
      const { normalizeData } = await import('@/utils/mlUtils');
      
      toast({
        title: "Processing",
        description: `Normalizing numerical data using ${normalizationMethod === 'minmax' ? 'Min-Max scaling' : 'Z-score standardization'}...`,
      });
      
      const updatedData = await normalizeData(data, normalizationMethod);
      
      onDataUpdate(updatedData);
      
      toast({
        title: "Success",
        description: `Successfully normalized ${updatedData.normalized.columns.length} numerical columns.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to normalize data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setNormalizing(false);
    }
  };

  if (isProcessing || !data) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader>
          <div className="h-7 bg-muted rounded-md w-1/3 mb-2"></div>
          <div className="h-5 bg-muted rounded-md w-2/3 opacity-70"></div>
        </CardHeader>
        <CardContent>
          <div className="h-40 bg-muted rounded-md w-full"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full animate-fade-in">
      <CardHeader>
        <div className="flex items-center">
          <SlidersHorizontal className="mr-2 h-5 w-5 text-primary" />
          <CardTitle>Data Preprocessing</CardTitle>
        </div>
        <CardDescription>
          Prepare your data for machine learning by handling missing values and normalizing numerical features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="missing-values" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="missing-values" className="flex items-center gap-2">
              <TableIcon className="h-4 w-4" />
              <span>Missing Values</span>
              {hasMissingValues && (
                <Badge variant="destructive" className="ml-1 py-0 px-1.5 h-5">
                  {missingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="normalization" className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Normalization</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="missing-values" className="space-y-4">
            {hasMissingValues ? (
              <>
                <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
                  <AlertTitle className="flex items-center gap-2">
                    Missing Values Detected
                  </AlertTitle>
                  <AlertDescription>
                    Your dataset contains {missingCount} missing values across {missingColumns.length} columns. 
                    You should handle these missing values before training a model.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4 mt-4">
                  <div className="grid gap-4">
                    <h3 className="text-sm font-medium mb-2">Choose Imputation Method:</h3>
                    <RadioGroup 
                      value={imputationMethod} 
                      onValueChange={(value) => setImputationMethod(value as 'hotdeck' | 'remove')}
                      className="grid grid-cols-1 gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hotdeck" id="hotdeck" />
                        <Label htmlFor="hotdeck" className="flex-1">
                          <div className="font-medium">Hot Deck Imputation</div>
                          <div className="text-sm text-muted-foreground">
                            Fills missing values with data from similar instances
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="remove" id="remove" />
                        <Label htmlFor="remove" className="flex-1">
                          <div className="font-medium">Remove Rows</div>
                          <div className="text-sm text-muted-foreground">
                            Removes rows containing any missing values
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="mt-6">
                    <Button 
                      onClick={handleImputeMissingValues}
                      disabled={imputing}
                      className="w-full"
                    >
                      {imputing ? (
                        <>
                          <span className="animate-pulse">Processing...</span>
                          <Progress value={30} className="ml-2 w-20" />
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Handle Missing Values
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : data?.missingData?.imputed ? (
              <Alert variant="default" className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-500" />
                <AlertTitle>Missing Values Handled</AlertTitle>
                <AlertDescription>
                  All missing values have been successfully handled using 
                  {data.missingData.method === 'hotdeck' 
                    ? ' Hot Deck imputation.' 
                    : ` row removal (${data.missingData.removedRows} rows removed).`}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="default" className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-500" />
                <AlertTitle>No Missing Values</AlertTitle>
                <AlertDescription>
                  Your dataset does not contain any missing values.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Missing values details table */}
            {missingColumns.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Missing Values Details</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Column</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Missing Count</TableHead>
                        <TableHead>Missing Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {missingColumns.map(column => {
                        const missingCount = data.summary[column].missing;
                        const totalCount = data.summary[column].count;
                        const percentage = ((missingCount / totalCount) * 100).toFixed(1);
                        
                        return (
                          <TableRow key={column}>
                            <TableCell className="font-medium">{column}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                data.types[column] === 'numeric' 
                                  ? "bg-blue-50 text-blue-700" 
                                  : "bg-purple-50 text-purple-700"
                              }>
                                {data.types[column]}
                              </Badge>
                            </TableCell>
                            <TableCell>{missingCount}</TableCell>
                            <TableCell>{percentage}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="normalization" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="normalize"
                checked={normalizeEnabled}
                onCheckedChange={setNormalizeEnabled}
              />
              <Label htmlFor="normalize">Enable Data Normalization</Label>
            </div>
            
            <div className={`space-y-4 ${!normalizeEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <Alert variant="default" className="bg-blue-50 border-blue-200">
                <AlertTitle>Why Normalize?</AlertTitle>
                <AlertDescription>
                  Normalization scales numerical features to a standard range, improving model performance 
                  for algorithms sensitive to feature scales (like SVM, k-NN, and Neural Networks).
                </AlertDescription>
              </Alert>
              
              <div className="grid gap-4">
                <h3 className="text-sm font-medium mb-2">Choose Normalization Method:</h3>
                <RadioGroup 
                  value={normalizationMethod} 
                  onValueChange={(value) => setNormalizationMethod(value as 'minmax' | 'zscore')}
                  className="grid grid-cols-1 gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="minmax" id="minmax" />
                    <Label htmlFor="minmax" className="flex-1">
                      <div className="font-medium">Min-Max Scaling</div>
                      <div className="text-sm text-muted-foreground">
                        Scales features to range [0,1]
                      </div>
                      <div className="text-xs font-mono bg-muted px-2 py-1 rounded mt-1">
                        X_norm = (X - min(X)) / (max(X) - min(X))
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="zscore" id="zscore" />
                    <Label htmlFor="zscore" className="flex-1">
                      <div className="font-medium">Z-score Standardization</div>
                      <div className="text-sm text-muted-foreground">
                        Centers around mean with unit variance
                      </div>
                      <div className="text-xs font-mono bg-muted px-2 py-1 rounded mt-1">
                        X_std = (X - mean(X)) / std_dev(X)
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="rounded-md border p-3 bg-muted/10">
                <h3 className="text-sm font-medium mb-2">Normalization Will Apply To:</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 flex items-center justify-between">
                    <span>Numerical Features</span>
                    <span className="bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-xs ml-2">
                      {columnTypes.numerical}
                    </span>
                  </Badge>
                  <Badge variant="outline" className="bg-gray-50 text-gray-500 flex items-center justify-between">
                    <span>Categorical Features</span>
                    <span className="bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs ml-2">
                      {columnTypes.categorical} (not normalized)
                    </span>
                  </Badge>
                </div>
              </div>
              
              {data?.normalized?.applied && (
                <Alert variant="default" className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-500" />
                  <AlertTitle>Data Already Normalized</AlertTitle>
                  <AlertDescription>
                    Your data has been normalized using {data.normalized.method === 'minmax' ? 'Min-Max scaling' : 'Z-score standardization'}.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="mt-6">
                <Button 
                  onClick={handleNormalizeData}
                  disabled={normalizing || !normalizeEnabled || data?.normalized?.applied}
                  className="w-full"
                >
                  {normalizing ? (
                    <>
                      <span className="animate-pulse">Normalizing...</span>
                      <Progress value={30} className="ml-2 w-20" />
                    </>
                  ) : data?.normalized?.applied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Data Already Normalized
                    </>
                  ) : (
                    <>
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Normalize Data
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DataPreprocessing;
