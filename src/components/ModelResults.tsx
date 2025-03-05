import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Check, Download, FileText, BarChart2, LineChart, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter as ReScatter, LineChart as ReLineChart, Line, PieChart as RePieChart, Pie, Cell } from 'recharts';

interface ModelResultsProps {
  results: {
    model: string;
    metrics: {
      [key: string]: number;
    };
    featureImportance: { name: string; importance: number }[];
    predictions?: any[];
    confusion?: number[][];
    probabilities?: number[][];
    shap?: { name: string; values: number[] }[];
    target?: string;
    problemType: 'classification' | 'regression' | 'clustering';
  } | null;
  isLoading: boolean;
  onExportModel: () => void;
  onExportReport: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const ModelResults: React.FC<ModelResultsProps> = ({ 
  results, 
  isLoading, 
  onExportModel, 
  onExportReport 
}) => {
  if (isLoading) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader>
          <div className="h-7 bg-muted rounded-md w-1/3 mb-2"></div>
          <div className="h-5 bg-muted rounded-md w-2/3 opacity-70"></div>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted rounded-md w-full"></div>
        </CardContent>
      </Card>
    );
  }

  if (!results) return null;
  
  const getModelDisplayName = (modelId: string) => {
    const nameMap: {[key: string]: string} = {
      'logistic_regression': 'Logistic Regression',
      'random_forest': 'Random Forest',
      'xgboost': 'XGBoost',
      'linear_regression': 'Linear Regression',
      'random_forest_regressor': 'Random Forest',
      'xgboost_regressor': 'XGBoost',
      'kmeans': 'K-Means',
      'dbscan': 'DBSCAN',
    };
    
    return nameMap[modelId] || modelId;
  };
  
  const formatMetric = (key: string, value: number): string => {
    if (['accuracy', 'precision', 'recall', 'f1', 'r2'].includes(key.toLowerCase())) {
      return (value * 100).toFixed(2) + '%';
    } else if (['rmse', 'mae', 'mse'].includes(key.toLowerCase())) {
      return value.toFixed(4);
    }
    return value.toFixed(2);
  };
  
  const getEvaluationMessage = (): string => {
    const { problemType, metrics } = results;
    
    if (problemType === 'classification') {
      const accuracy = metrics.accuracy || 0;
      if (accuracy >= 0.9) return "Excellent performance! This model achieves high accuracy.";
      if (accuracy >= 0.8) return "Good performance. The model predicts correctly in most cases.";
      if (accuracy >= 0.7) return "Moderate performance. Consider feature engineering or trying different algorithms.";
      return "This model may need improvement. Consider checking your data quality or trying different approaches.";
    }
    
    if (problemType === 'regression') {
      const r2 = metrics.r2 || 0;
      if (r2 >= 0.8) return "Excellent fit! The model explains most of the variance in the data.";
      if (r2 >= 0.6) return "Good fit. The model captures the main trends in your data.";
      if (r2 >= 0.4) return "Moderate fit. Consider adding more features or trying non-linear models.";
      return "This model may need improvement. Try feature engineering or different algorithms.";
    }
    
    if (problemType === 'clustering') {
      const silhouette = metrics.silhouette_score || 0;
      if (silhouette >= 0.7) return "Excellent clustering! Clear separation between clusters.";
      if (silhouette >= 0.5) return "Good clustering structure detected in your data.";
      if (silhouette >= 0.3) return "Moderate clustering. Some overlap between clusters.";
      return "Weak clustering structure. Consider different parameters or algorithms.";
    }
    
    return "Model training complete. Evaluate the metrics to assess performance.";
  };
  
  const getMetricsDisplayInfo = () => {
    const { problemType } = results;
    
    if (problemType === 'classification') {
      return [
        { key: 'accuracy', name: 'Accuracy', primary: true },
        { key: 'precision', name: 'Precision', primary: false },
        { key: 'recall', name: 'Recall', primary: false },
        { key: 'f1', name: 'F1 Score', primary: false },
      ];
    }
    
    if (problemType === 'regression') {
      return [
        { key: 'r2', name: 'R² Score', primary: true },
        { key: 'rmse', name: 'RMSE', primary: false },
        { key: 'mae', name: 'MAE', primary: false },
      ];
    }
    
    if (problemType === 'clustering') {
      return [
        { key: 'silhouette_score', name: 'Silhouette Score', primary: true },
        { key: 'inertia', name: 'Inertia', primary: false },
      ];
    }
    
    return [];
  };

  return (
    <Card className="w-full bg-card animate-fade-in">
      <CardHeader>
        <div className="flex items-center">
          <BarChart className="mr-2 h-5 w-5 text-primary" />
          <CardTitle>Model Results</CardTitle>
        </div>
        <CardDescription>
          {getModelDisplayName(results.model)} • Trained and evaluated
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="metrics" className="flex items-center space-x-2">
              <BarChart2 className="h-4 w-4" />
              <span>Metrics</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center space-x-2">
              <BarChart className="h-4 w-4" />
              <span>Feature Importance</span>
            </TabsTrigger>
            <TabsTrigger value="viz" className="flex items-center space-x-2">
              <LineChart className="h-4 w-4" />
              <span>Visualization</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Export</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics" className="animate-fade-in">
            <div className="space-y-6">
              <div className="bg-muted/40 p-4 rounded-lg">
                <p className="text-sm">{getEvaluationMessage()}</p>
              </div>
              
              <div>
                {getMetricsDisplayInfo().filter(m => m.primary).map(metricInfo => (
                  <div key={metricInfo.key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{metricInfo.name}</h3>
                      <span className="text-2xl font-bold">
                        {formatMetric(metricInfo.key, results.metrics[metricInfo.key] || 0)}
                      </span>
                    </div>
                    <Progress 
                      value={
                        (['rmse', 'mae', 'mse', 'inertia'].includes(metricInfo.key.toLowerCase())) 
                          ? 100 - Math.min(100, (results.metrics[metricInfo.key] || 0) * 100) 
                          : (results.metrics[metricInfo.key] || 0) * 100
                      } 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                {getMetricsDisplayInfo().filter(m => !m.primary).map(metricInfo => (
                  <div key={metricInfo.key} className="space-y-1">
                    <div className="text-sm text-muted-foreground">{metricInfo.name}</div>
                    <div className="text-lg font-medium">
                      {formatMetric(metricInfo.key, results.metrics[metricInfo.key] || 0)}
                    </div>
                  </div>
                ))}
              </div>
              
              {results.problemType === 'classification' && results.confusion && (
                <div className="space-y-3 pt-4">
                  <h3 className="font-medium">Confusion Matrix</h3>
                  <div className="flex justify-center">
                    <div className="grid grid-cols-2 gap-px bg-muted rounded-lg overflow-hidden">
                      <div className="bg-background p-4 text-center">
                        <div className="text-xs text-muted-foreground mb-1">True Positive</div>
                        <div className="text-2xl font-bold">{results.confusion[0][0]}</div>
                      </div>
                      <div className="bg-background p-4 text-center">
                        <div className="text-xs text-muted-foreground mb-1">False Positive</div>
                        <div className="text-2xl font-bold">{results.confusion[0][1]}</div>
                      </div>
                      <div className="bg-background p-4 text-center">
                        <div className="text-xs text-muted-foreground mb-1">False Negative</div>
                        <div className="text-2xl font-bold">{results.confusion[1][0]}</div>
                      </div>
                      <div className="bg-background p-4 text-center">
                        <div className="text-xs text-muted-foreground mb-1">True Negative</div>
                        <div className="text-2xl font-bold">{results.confusion[1][1]}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="features" className="animate-fade-in">
            <div className="space-y-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart
                    data={results.featureImportance.slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip 
                      formatter={(value: any) => [`${(Number(value) * 100).toFixed(2)}%`, 'Importance']}
                    />
                    <Legend />
                    <Bar dataKey="importance" fill="#3b82f6" name="Importance" />
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h3 className="font-medium">Feature Ranking</h3>
                <div className="space-y-2">
                  {results.featureImportance.map((feature, index) => (
                    <div 
                      key={feature.name}
                      className="flex items-center"
                    >
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "w-6 h-6 rounded-full p-0 flex items-center justify-center mr-2",
                          index < 3 ? "bg-primary text-primary-foreground border-primary" : ""
                        )}
                      >
                        {index + 1}
                      </Badge>
                      <div className="flex-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium truncate max-w-[200px]" title={feature.name}>
                            {feature.name}
                          </span>
                          <span>{(feature.importance * 100).toFixed(2)}%</span>
                        </div>
                        <Progress 
                          value={feature.importance * 100} 
                          className="h-1 mt-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="viz" className="animate-fade-in">
            <div className="space-y-6">
              {results.problemType === 'classification' && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart className="chart-container">
                      <Pie
                        data={[
                          { name: 'Correct', value: results.metrics.accuracy || 0 },
                          { name: 'Incorrect', value: 1 - (results.metrics.accuracy || 0) },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#e11d48" />
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${(Number(value) * 100).toFixed(2)}%`, 'Percentage']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {results.problemType === 'regression' && results.predictions && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 20, right: 20, bottom: 10, left: 10 }}
                      className="chart-container"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number" 
                        dataKey="actual" 
                        name="Actual" 
                        label={{ value: "Actual Values", position: "insideBottomRight", offset: -5 }} 
                      />
                      <YAxis 
                        type="number" 
                        dataKey="predicted" 
                        name="Predicted" 
                        label={{ value: "Predicted Values", angle: -90, position: "insideLeft" }} 
                      />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Legend />
                      <ReScatter name="Actual vs Predicted" data={results.predictions} fill="#3b82f6" />
                      <Line 
                        type="monotone" 
                        dataKey="perfect" 
                        stroke="#ff7300" 
                        name="Perfect Prediction" 
                        dot={false} 
                        activeDot={false}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}

              {results.problemType === 'clustering' && (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Clustering visualization available in the downloaded report</p>
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div className="bg-muted/40 rounded-lg p-4">
                <h3 className="font-medium mb-2">Interpretation</h3>
                <p className="text-sm text-muted-foreground">
                  {results.problemType === 'classification' && (
                    <>This model correctly classifies {formatMetric('accuracy', results.metrics.accuracy || 0)} of instances. 
                    The most influential features are {results.featureImportance.slice(0, 3).map(f => f.name).join(', ')}.</>
                  )}
                  
                  {results.problemType === 'regression' && (
                    <>This model explains {formatMetric('r2', results.metrics.r2 || 0)} of the variance in {results.target || 'the target'}. 
                    The most influential features are {results.featureImportance.slice(0, 3).map(f => f.name).join(', ')}.</>
                  )}
                  
                  {results.problemType === 'clustering' && (
                    <>This clustering solution identified distinct groups in your data with a silhouette score of {formatMetric('silhouette_score', results.metrics.silhouette_score || 0)}. 
                    The most important features for cluster separation are {results.featureImportance.slice(0, 3).map(f => f.name).join(', ')}.</>
                  )}
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="export" className="animate-fade-in">
            <div className="space-y-8 py-4">
              <div className="grid grid-cols-2 gap-6">
                <Card className="transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Download size={18} className="mr-2 text-primary" /> Download Model
                    </CardTitle>
                    <CardDescription>
                      Save the trained model for future use
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p>This will download a .pkl file containing your trained model. You can use this file to make predictions on new data.</p>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={onExportModel} className="w-full">
                      <Download size={16} className="mr-2" /> Download .pkl
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <FileText size={18} className="mr-2 text-primary" /> Download Report
                    </CardTitle>
                    <CardDescription>
                      Get a detailed PDF report
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p>This report includes model performance metrics, feature importance, visualizations, and recommendations.</p>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={onExportReport} className="w-full">
                      <FileText size={16} className="mr-2" /> Generate PDF Report
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium mb-2 flex items-center">
                  <Check size={16} className="mr-2" /> What's included
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <Check size={14} className="mr-2 text-green-600" />
                    Complete dataset statistics and preprocessing steps
                  </li>
                  <li className="flex items-center">
                    <Check size={14} className="mr-2 text-green-600" />
                    Detailed model performance metrics and evaluation
                  </li>
                  <li className="flex items-center">
                    <Check size={14} className="mr-2 text-green-600" />
                    Feature importance analysis and visualizations
                  </li>
                  <li className="flex items-center">
                    <Check size={14} className="mr-2 text-green-600" />
                    Model parameters and training configuration
                  </li>
                  <li className="flex items-center">
                    <Check size={14} className="mr-2 text-green-600" />
                    Recommendations for model improvement
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ModelResults;
