
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Table, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Upload } from "lucide-react";
import { uploadCSV, downloadModel, downloadReport, getConfusionMatrixUrl } from "@/services/mlApi";

export default function AutoMLDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [targetColumn, setTargetColumn] = useState("");
  const [missingStrategy, setMissingStrategy] = useState("median");
  const [scalingStrategy, setScalingStrategy] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [confusionMatrixUrl, setConfusionMatrixUrl] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !targetColumn) {
      alert("Please upload a file and specify the target column.");
      return;
    }

    setLoading(true);
    
    try {
      const response = await uploadCSV({
        file,
        targetColumn,
        missingValueStrategy: missingStrategy,
        scalingStrategy
      });
      
      setResults(response.report);
      setConfusionMatrixUrl(getConfusionMatrixUrl());
    } catch (error) {
      console.error("Error uploading dataset:", error);
      alert("Error processing dataset. Please try again.");
    }

    setLoading(false);
  };

  const handleDownloadModel = async () => {
    await downloadModel();
  };

  const handleDownloadReport = async () => {
    await downloadReport();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-bold mb-4">Upload Dataset</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Dataset CSV File</Label>
              <Input 
                id="file-upload" 
                type="file" 
                onChange={handleFileChange} 
                accept=".csv"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-column">Target Column</Label>
              <Input 
                id="target-column"
                value={targetColumn} 
                onChange={(e) => setTargetColumn(e.target.value)} 
                placeholder="Enter column name to predict"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="missing-strategy">Missing Value Strategy</Label>
              <Select value={missingStrategy} onValueChange={setMissingStrategy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select strategy" />
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
              <Label htmlFor="scaling-strategy">Scaling Strategy</Label>
              <Select value={scalingStrategy} onValueChange={setScalingStrategy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scaling" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Scaling</SelectItem>
                  <SelectItem value="minmax">Min-Max Scaling</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleUpload} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Run AutoML
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="mt-6">
          <Label>Processing your dataset...</Label>
          <Progress value={45} className="mt-2" />
        </div>
      )}

      {results && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-4">AutoML Results</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm text-muted-foreground">Best Model</p>
                  <p className="text-lg font-medium">{results.best_model}</p>
                </div>
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm text-muted-foreground">Best Accuracy</p>
                  <p className="text-lg font-medium">{(results.best_accuracy * 100).toFixed(2)}%</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mt-4 mb-2">Model Accuracies</h3>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell className="font-medium">Model</TableCell>
                      <TableCell className="font-medium">Accuracy</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(results.model_accuracies).map(([model, accuracy]) => (
                      <TableRow key={model}>
                        <TableCell>{model}</TableCell>
                        <TableCell>{(Number(accuracy) * 100).toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {confusionMatrixUrl && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Confusion Matrix</h3>
                  <img 
                    src={confusionMatrixUrl} 
                    alt="Confusion Matrix" 
                    className="w-full max-w-lg mx-auto border rounded-md"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                <Button onClick={handleDownloadModel} variant="outline">
                  Download Model
                </Button>
                <Button onClick={handleDownloadReport}>
                  Download Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
