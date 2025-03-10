
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import { 
  uploadDataset, 
  processAutoML, 
  downloadModel, 
  downloadReport, 
  getConfusionMatrixUrl, 
  getFeatureImportanceUrl, 
  getPrecisionRecallUrl,
  type DatasetOverview, 
  type UploadParams 
} from '@/services/mlApi';
import Header from '@/components/Header';

// DataSummary component to display dataset information
const DataSummary = ({ dataset }: { dataset: DatasetOverview | null }) => {
  if (!dataset) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Dataset Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{dataset.num_rows}</div>
            <div className="text-sm text-muted-foreground">Rows</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{dataset.num_columns}</div>
            <div className="text-sm text-muted-foreground">Columns</div>
          </CardContent>
        </Card>
      </div>
      
      <h3 className="text-lg font-semibold mt-6">Column Details</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="border p-2 text-left">Column</th>
              <th className="border p-2 text-left">Type</th>
              <th className="border p-2 text-left">Missing Values</th>
              <th className="border p-2 text-left">Statistics</th>
            </tr>
          </thead>
          <tbody>
            {dataset.column_details.map((column, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                <td className="border p-2">{column.name}</td>
                <td className="border p-2">
                  {column.type === 'numeric' ? 'Numeric' : 'Categorical'}
                </td>
                <td className="border p-2">
                  {column.missing_values} ({(column.missing_percent).toFixed(2)}%)
                </td>
                <td className="border p-2">
                  {column.type === 'numeric' ? (
                    <>
                      Range: {(column.stats as any).min.toFixed(2)} - {(column.stats as any).max.toFixed(2)}<br/>
                      Mean: {(column.stats as any).mean.toFixed(2)}<br/>
                      Median: {(column.stats as any).median.toFixed(2)}
                    </>
                  ) : (
                    <>
                      Unique Values: {(column.stats as any).unique_values}<br/>
                      Most Common: {(column.stats as any).most_common}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Component for selecting data preprocessing options
const DataPreprocessing = ({ 
  dataset, 
  onSubmit,
  isProcessing
}: { 
  dataset: DatasetOverview | null;
  onSubmit: (params: { targetColumn: string, missingValueStrategy: string, scalingStrategy: string, missingValueSymbol: string, problemType: string }) => void;
  isProcessing: boolean;
}) => {
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [missingValueStrategy, setMissingValueStrategy] = useState<string>('mean');
  const [scalingStrategy, setScalingStrategy] = useState<string>('standard');
  const [missingValueSymbol, setMissingValueSymbol] = useState<string>('?');
  const [problemType, setProblemType] = useState<string>('auto');
  
  useEffect(() => {
    // Set default target column when dataset loads
    if (dataset && dataset.column_details.length > 0) {
      setTargetColumn(dataset.column_details[dataset.column_details.length - 1].name);
    }
  }, [dataset]);
  
  if (!dataset) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      targetColumn,
      missingValueStrategy,
      scalingStrategy,
      missingValueSymbol,
      problemType
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="targetColumn" className="block text-sm font-medium mb-1">
            Target Column (What you want to predict)
          </label>
          <select
            id="targetColumn"
            value={targetColumn}
            onChange={(e) => setTargetColumn(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          >
            {dataset.column_details.map((column, index) => (
              <option key={index} value={column.name}>
                {column.name} ({column.type})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="problemType" className="block text-sm font-medium mb-1">
            Problem Type
          </label>
          <select
            id="problemType"
            value={problemType}
            onChange={(e) => setProblemType(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="auto">Auto (Let the system decide)</option>
            <option value="classification">Classification (Categorical target)</option>
            <option value="regression">Regression (Numeric target)</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            For numeric target columns, choose Regression. For categorical target columns, choose Classification.
          </p>
        </div>
        
        <div>
          <label htmlFor="missingValueStrategy" className="block text-sm font-medium mb-1">
            Missing Value Strategy
          </label>
          <select
            id="missingValueStrategy"
            value={missingValueStrategy}
            onChange={(e) => setMissingValueStrategy(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="mean">Mean/Mode (Replace with average for numeric, most common for categorical)</option>
            <option value="median">Median (Replace with median value - numeric columns only)</option>
            <option value="drop">Drop (Remove rows with missing values)</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="scalingStrategy" className="block text-sm font-medium mb-1">
            Scaling Strategy
          </label>
          <select
            id="scalingStrategy"
            value={scalingStrategy}
            onChange={(e) => setScalingStrategy(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="standard">Standard Scaling (Mean=0, Std=1)</option>
            <option value="minmax">Min-Max Scaling (Values between 0 and 1)</option>
            <option value="none">No Scaling</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="missingValueSymbol" className="block text-sm font-medium mb-1">
            Missing Value Symbol
          </label>
          <input
            id="missingValueSymbol"
            type="text"
            value={missingValueSymbol}
            onChange={(e) => setMissingValueSymbol(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Symbol used for missing values (e.g. ?, NA, NaN)"
          />
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isProcessing}>
        {isProcessing ? (
          <>
            <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
            Processing...
          </>
        ) : (
          'Train Model'
        )}
      </Button>
    </form>
  );
};

// Component to display model results
const ModelResults = ({ 
  modelResults, 
  onDownloadModel, 
  onDownloadReport 
}: { 
  modelResults: any; 
  onDownloadModel: () => void;
  onDownloadReport: () => void;
}) => {
  if (!modelResults) return null;

  const confusionMatrixUrl = getConfusionMatrixUrl();
  const featureImportanceUrl = getFeatureImportanceUrl();
  const precisionRecallUrl = getPrecisionRecallUrl();
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Model Performance</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{modelResults.best_score?.toFixed(4) || 'N/A'}</div>
            <div className="text-sm text-muted-foreground">Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{modelResults.best_algorithm || 'N/A'}</div>
            <div className="text-sm text-muted-foreground">Best Algorithm</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{modelResults.problem_type || 'N/A'}</div>
            <div className="text-sm text-muted-foreground">Problem Type</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Visualizations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modelResults.problem_type === 'classification' && (
            <>
              <div>
                <h4 className="font-medium mb-2">Confusion Matrix</h4>
                <img 
                  src={confusionMatrixUrl} 
                  alt="Confusion Matrix" 
                  className="w-full border rounded-lg" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextSibling!.textContent = 'Image not available';
                  }}
                />
                <div className="text-sm text-muted-foreground mt-1 hidden"></div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Precision-Recall Curve</h4>
                <img 
                  src={precisionRecallUrl} 
                  alt="Precision-Recall Curve" 
                  className="w-full border rounded-lg" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextSibling!.textContent = 'Image not available';
                  }}
                />
                <div className="text-sm text-muted-foreground mt-1 hidden"></div>
              </div>
            </>
          )}
          
          <div className={modelResults.problem_type === 'classification' ? 'md:col-span-2' : ''}>
            <h4 className="font-medium mb-2">Feature Importance</h4>
            <img 
              src={featureImportanceUrl} 
              alt="Feature Importance" 
              className="w-full border rounded-lg" 
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextSibling!.textContent = 'Image not available';
              }}
            />
            <div className="text-sm text-muted-foreground mt-1 hidden"></div>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Download</h3>
        <div className="flex flex-wrap gap-4">
          <Button onClick={onDownloadModel}>
            Download Model
          </Button>
          <Button variant="outline" onClick={onDownloadReport}>
            Download Report
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main AutoML page component
const CustomAutoML = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<'upload' | 'process' | 'results'>('upload');
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [datasetOverview, setDatasetOverview] = useState<DatasetOverview | null>(null);
  const [currentTab, setCurrentTab] = useState('summary');
  const [modelResults, setModelResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileUpload = async (file: File) => {
    setDatasetFile(file);
    setIsUploading(true);
    setError(null);
    
    try {
      const overview = await uploadDataset(file);
      setDatasetOverview(overview);
      setCurrentStep('process');
      toast({
        title: 'Dataset uploaded successfully',
        description: `Analyzed ${overview.num_rows} rows and ${overview.num_columns} columns.`,
      });
    } catch (error: any) {
      setError(`Error uploading dataset: ${error.message}`);
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleProcessing = async (params: { 
    targetColumn: string, 
    missingValueStrategy: string,
    scalingStrategy: string,
    missingValueSymbol: string,
    problemType: string
  }) => {
    if (!datasetFile) return;
    
    setIsProcessing(true);
    setError(null);
    
    const uploadParams: UploadParams = {
      file: datasetFile,
      targetColumn: params.targetColumn,
      missingValueStrategy: params.missingValueStrategy,
      scalingStrategy: params.scalingStrategy,
      missingValueSymbol: params.missingValueSymbol,
      problemType: params.problemType
    };
    
    try {
      const results = await processAutoML(uploadParams);
      setModelResults(results);
      setCurrentStep('results');
      toast({
        title: 'Model training complete',
        description: `Best model: ${results.best_algorithm} with score: ${results.best_score.toFixed(4)}`,
      });
    } catch (error: any) {
      setError(`Error processing dataset: ${error.message}`);
      toast({
        title: 'Processing failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDownloadModel = () => {
    try {
      downloadModel();
      toast({
        title: 'Downloading model',
        description: 'Your model file is being downloaded.',
      });
    } catch (error: any) {
      toast({
        title: 'Download failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };
  
  const handleDownloadReport = () => {
    try {
      downloadReport();
      toast({
        title: 'Downloading report',
        description: 'Your report file is being downloaded.',
      });
    } catch (error: any) {
      toast({
        title: 'Download failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };
  
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };
  
  const handleRestart = () => {
    setCurrentStep('upload');
    setDatasetFile(null);
    setDatasetOverview(null);
    setModelResults(null);
    setError(null);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-screen-xl mx-auto py-8 px-4 sm:px-6">
        <div className="flex items-center mb-6 space-x-4">
          <Button variant="outline" size="sm" onClick={handleBackToDashboard}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">AutoML Wizard</h1>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-8">
          {currentStep === 'upload' ? (
            <FileUpload onFileUpload={handleFileUpload} isProcessing={isUploading} />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">
                  {currentStep === 'process' ? 'Data Preparation' : 'Model Results'}
                </h2>
                <Button variant="outline" size="sm" onClick={handleRestart}>
                  Start Over
                </Button>
              </div>
              
              {currentStep === 'process' && (
                <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="summary">Data Summary</TabsTrigger>
                    <TabsTrigger value="prepare">Data Preparation</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="summary" className="py-4">
                    <DataSummary dataset={datasetOverview} />
                  </TabsContent>
                  
                  <TabsContent value="prepare" className="py-4">
                    <DataPreprocessing 
                      dataset={datasetOverview} 
                      onSubmit={handleProcessing}
                      isProcessing={isProcessing} 
                    />
                  </TabsContent>
                </Tabs>
              )}
              
              {currentStep === 'results' && (
                <ModelResults 
                  modelResults={modelResults} 
                  onDownloadModel={handleDownloadModel}
                  onDownloadReport={handleDownloadReport}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CustomAutoML;
