import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { 
  Upload, 
  Database, 
  BarChart, 
  Download, 
  Activity,
  AlertCircle
} from "lucide-react";
import { 
  processAutoML, 
  downloadModel, 
  downloadReport, 
  getConfusionMatrixUrl,
  uploadDataset,
  type DatasetOverview,
  type ColumnDetail
} from "@/services/mlApi";

export default function AutoMLDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  
  const [datasetOverview, setDatasetOverview] = useState<DatasetOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(false);
  
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [missingStrategy, setMissingStrategy] = useState<string>("median");
  const [scalingStrategy, setScalingStrategy] = useState<string>("standard");
  const [missingValueSymbol, setMissingValueSymbol] = useState<string>("?");
  
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("dataset");
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      
      setDatasetOverview(null);
      setResults(null);
      setError(null);
      
      await analyzeDataset(selectedFile);
    }
  };

  const analyzeDataset = async (selectedFile: File) => {
    try {
      setLoadingOverview(true);
      const overview = await uploadDataset(selectedFile);
      setDatasetOverview(overview);
      console.log("Dataset overview:", overview);
      
      if (overview.column_details.length > 0) {
        const categoricalColumn = overview.column_details.find(col => col.type === "categorical");
        if (categoricalColumn) {
          setTargetColumn(categoricalColumn.name);
        } else {
          setTargetColumn(overview.column_details[overview.column_details.length - 1].name);
        }
      }
    } catch (error) {
      console.error("Error analyzing dataset:", error);
      setError("Failed to analyze the dataset. Please check the file format and try again.");
    } finally {
      setLoadingOverview(false);
    }
  };

  const handleRunAutoML = async () => {
    if (!file || !targetColumn) {
      setError("Please upload a file and specify the target column.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await processAutoML({
        file,
        targetColumn,
        missingValueSymbol,
        missingValueStrategy: missingStrategy,
        scalingStrategy
      });
      
      setResults(response);
      setActiveTab("results");
    } catch (error) {
      console.error("Error processing dataset:", error);
      setError("Error processing dataset. Please check your inputs and try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderColumnStats = (column: ColumnDetail) => {
    if (column.type === "numeric") {
      const stats = column.stats as any;
      return (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p><span className="font-medium">Min:</span> {stats.min?.toFixed(2) ?? 'N/A'}</p>
          <p><span className="font-medium">Max:</span> {stats.max?.toFixed(2) ?? 'N/A'}</p>
          <p><span className="font-medium">Mean:</span> {stats.mean?.toFixed(2) ?? 'N/A'}</p>
          <p><span className="font-medium">Median:</span> {stats.median?.toFixed(2) ?? 'N/A'}</p>
          <p><span className="font-medium">Std Dev:</span> {stats.std_dev?.toFixed(2) ?? 'N/A'}</p>
          
          {column.sample_missing_row && (
            <div className="col-span-2 bg-red-50 text-red-600 p-2 rounded-md mt-2">
              <p><strong>Example Row with Missing Value:</strong></p>
              <pre className="text-xs whitespace-pre-wrap">{column.sample_missing_row}</pre>
            </div>
          )}
        </div>
      );
    } else {
      const stats = column.stats as any;
      return (
        <div className="text-sm">
          <p><span className="font-medium">Unique Values:</span> {stats.unique_values}</p>
          <p><span className="font-medium">Most Common:</span> {stats.most_common}</p>
  
          {column.sample_missing_row && (
            <div className="bg-red-50 text-red-600 p-2 rounded-md mt-2">
              <p><strong>Example Row with Missing Value:</strong></p>
              <pre className="text-xs whitespace-pre-wrap">{column.sample_missing_row}</pre>
            </div>
          )}
        </div>
      );
    }
  };  

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">AutoML Dashboard</CardTitle>
          <CardDescription>
            Upload your dataset and let our ML wizard analyze and build the best model for your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="file-upload">Dataset (CSV file)</Label>
              <div className="flex gap-2">
                <Input 
                  id="file-upload" 
                  type="file" 
                  onChange={handleFileChange} 
                  accept=".csv"
                  className="flex-1"
                />
              </div>
              {fileName && (
                <p className="text-sm text-gray-500">Uploaded: {fileName}</p>
              )}
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {(datasetOverview || loadingOverview) && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="dataset" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Dataset Overview
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2" disabled={!results}>
              <BarChart className="h-4 w-4" />
              Model Results
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dataset" className="space-y-4 mt-4">
            {loadingOverview ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Spinner size="lg" />
                <p className="mt-4 text-gray-500">Analyzing your dataset...</p>
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Dataset Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <h3 className="font-medium">Overview</h3>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p><span className="font-medium">Rows:</span> {datasetOverview?.num_rows}</p>
                          <p><span className="font-medium">Columns:</span> {datasetOverview?.num_columns}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-medium">AutoML Configuration</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="target-column">Target Column</Label>
                            <Select value={targetColumn} onValueChange={setTargetColumn}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select column to predict" />
                              </SelectTrigger>
                              <SelectContent>
                                {datasetOverview?.column_details.map((column) => (
                                  <SelectItem key={column.name} value={column.name}>
                                    {column.name} ({column.type})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="missing-strategy">Missing Value Strategy</Label>
                            <Select value={missingStrategy} onValueChange={setMissingStrategy}>
                              <SelectTrigger>
                                <SelectValue placeholder="How to handle missing values" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="median">Median</SelectItem>
                                <SelectItem value="mean">Mean</SelectItem>
                                <SelectItem value="mode">Mode</SelectItem>
                                <SelectItem value="knn">KNN Imputation</SelectItem>
                                <SelectItem value="remove">Remove Rows</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="missing-value-symbol">Missing Value Symbol</Label>
                            <Input
                              id="missing-value-symbol"
                              type="text"
                              placeholder="e.g., ?, NA, null"
                              value={missingValueSymbol}
                              onChange={(e) => setMissingValueSymbol(e.target.value)}
                              className="w-full"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="scaling-strategy">Scaling Strategy</Label>
                            <Select value={scalingStrategy} onValueChange={setScalingStrategy}>
                              <SelectTrigger>
                                <SelectValue placeholder="How to scale numeric features" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="standard">Standard Scaling</SelectItem>
                                <SelectItem value="minmax">Min-Max Scaling</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <Button 
                            onClick={handleRunAutoML} 
                            disabled={loading || !targetColumn} 
                            className="w-full"
                          >
                            {loading ? (
                              <>
                                <Spinner size="sm" className="mr-2" />
                                Running AutoML...
                              </>
                            ) : (
                              <>
                                <Activity className="mr-2 h-4 w-4" />
                                Run AutoML
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Column Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {datasetOverview?.column_details.map((column) => (
                        <Card key={column.name} className="overflow-hidden">
                          <CardHeader className="bg-gray-50 py-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">{column.name}</h3>
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-200">
                                {column.type}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="py-3">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500 mb-1">Missing Values</p>
                                <div className="flex items-center gap-2">
                                  <Progress value={100 - column.missing_percent} className="flex-1" />
                                  <span className="text-sm whitespace-nowrap">
                                    {column.missing_values} ({column.missing_percent}%)
                                  </span>
                                </div>
                              </div>
                              <div>
                                {renderColumnStats(column)}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="results" className="space-y-4 mt-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Spinner size="lg" />
                <p className="mt-4 text-gray-500">Training and evaluating models...</p>
                <Progress value={65} className="w-3/4 mt-4" />
              </div>
            ) : results ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Model Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-blue-800">Best Model</h3>
                        <p className="text-2xl font-bold text-blue-700">{results.report.best_model}</p>
                      </div>
                      <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-green-800">Best Accuracy</h3>
                        <p className="text-2xl font-bold text-green-700">
                          {(results.report.best_accuracy * 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2">Cross-Validation</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p><span className="font-medium">Mean CV Accuracy:</span> {(results.report.mean_cross_validation_accuracy * 100).toFixed(2)}%</p>
                        <p><span className="font-medium">Training Accuracy:</span> {(results.report.training_accuracy * 100).toFixed(2)}%</p>
                        <p><span className="font-medium">Test Accuracy:</span> {(results.report.test_accuracy * 100).toFixed(2)}%</p>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-2">Model Comparison</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Model</TableHead>
                          <TableHead className="text-right">Accuracy</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(results.report.model_accuracies)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .map(([model, accuracy]) => (
                            <TableRow key={model}>
                              <TableCell>{model}</TableCell>
                              <TableCell className="text-right">
                                {((accuracy as number) * 100).toFixed(2)}%
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Confusion Matrix</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <img 
                      src={getConfusionMatrixUrl()} 
                      alt="Confusion Matrix" 
                      className="max-w-full h-auto border rounded-lg shadow-sm"
                    />
                  </CardContent>
                </Card>
                
                <div className="flex flex-wrap gap-2">
                  <Button onClick={downloadModel} variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download Model
                  </Button>
                  <Button onClick={downloadReport} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download Report
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">Run AutoML to see model results</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
