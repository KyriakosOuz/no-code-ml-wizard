
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import Header from "@/components/Header";
import { Spinner } from "@/components/ui/spinner";
import { uploadCSV, downloadModel, downloadReport, getConfusionMatrixUrl } from "@/services/mlApi";

const ModelTraining = () => {
  useEffect(() => {
    console.log("ModelTraining component mounted");
  }, []);

  const [file, setFile] = useState<File | null>(null);
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [missingValueStrategy, setMissingValueStrategy] = useState<string>("median");
  const [scalingStrategy, setScalingStrategy] = useState<string>("standard");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [confusionMatrixVisible, setConfusionMatrixVisible] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!targetColumn) {
      toast({
        title: "Error",
        description: "Please specify a target column to predict",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setAccuracy(null);
    setReportData(null);
    setConfusionMatrixVisible(false);

    try {
      const response = await uploadCSV({
        file,
        targetColumn,
        missingValueStrategy,
        scalingStrategy,
      });

      setAccuracy(response.report?.best_accuracy || 0);
      setConfusionMatrixVisible(true);
      
      toast({
        title: "Success",
        description: `Model trained successfully with accuracy: ${((response.report?.best_accuracy || 0) * 100).toFixed(2)}%`,
      });

      // Try to fetch the report automatically after successful training
      try {
        setReportData(response.report);
      } catch (error) {
        console.error("Failed to fetch report:", error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to train model. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadModel = async () => {
    try {
      await downloadModel();
      toast({
        title: "Success",
        description: "Model downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download model",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const data = await downloadReport();
      setReportData(data);
      toast({
        title: "Success",
        description: "Report downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Train Your ML Model</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload Dataset & Configure Model</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Upload CSV</label>
                <Input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Column</label>
                <Input 
                  type="text" 
                  placeholder="Column name to predict"
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Missing Value Strategy</label>
                <Select 
                  value={missingValueStrategy} 
                  onValueChange={setMissingValueStrategy}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="median">Median</SelectItem>
                    <SelectItem value="mean">Mean</SelectItem>
                    <SelectItem value="mode">Mode</SelectItem>
                    <SelectItem value="knn">KNN</SelectItem>
                    <SelectItem value="remove">Remove</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Scaling Strategy</label>
                <Select 
                  value={scalingStrategy} 
                  onValueChange={setScalingStrategy}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="minmax">MinMax</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner className="mr-2" />
                    Training Model...
                  </>
                ) : (
                  "Train Model"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {accuracy !== null && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Model Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4">Model Accuracy</h3>
                <div className="text-4xl font-bold text-primary">
                  {(accuracy * 100).toFixed(2)}%
                </div>
              </div>
              
              {confusionMatrixVisible && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-4">Confusion Matrix</h3>
                  <div className="flex justify-center">
                    <img 
                      src={getConfusionMatrixUrl()} 
                      alt="Confusion Matrix" 
                      className="max-w-full h-auto border rounded shadow-sm"
                      onError={(e) => {
                        console.error("Failed to load confusion matrix image");
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex justify-center gap-4 mt-6">
                <Button onClick={handleDownloadModel} variant="outline">
                  Download Model
                </Button>
                <Button onClick={handleDownloadReport} variant="outline">
                  Download Report
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {reportData && (
          <Card>
            <CardHeader>
              <CardTitle>Model Report</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                {JSON.stringify(reportData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ModelTraining;
