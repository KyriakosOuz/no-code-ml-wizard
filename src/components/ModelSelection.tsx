import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Layers, Cog, BrainCircuit, BarChart, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModelSelectionProps {
  problemType: 'classification' | 'regression' | 'clustering' | null;
  onSelectModel: (model: string, hyperparams: any) => void;
  autoSelectRecommended?: boolean;
  isProcessing: boolean;
}

type Algorithm = {
  id: string;
  name: string;
  description: string;
  hyperparams: {
    [key: string]: {
      type: 'slider' | 'radio' | 'checkbox';
      label: string;
      description?: string;
      min?: number;
      max?: number;
      step?: number;
      default: any;
      options?: { value: any; label: string }[];
    };
  };
  tags: string[];
};

const classificationAlgorithms: Algorithm[] = [
  {
    id: 'logistic_regression',
    name: 'Logistic Regression',
    description: 'A linear model that predicts the probability of a categorical target. Simple, interpretable, and works well for linearly separable data.',
    hyperparams: {
      C: {
        type: 'slider',
        label: 'Regularization Strength',
        description: 'Lower values increase regularization',
        min: 0.1,
        max: 10,
        step: 0.1,
        default: 1.0,
      },
      penalty: {
        type: 'radio',
        label: 'Penalty',
        description: 'Type of regularization',
        default: 'l2',
        options: [
          { value: 'l1', label: 'L1 (Lasso)' },
          { value: 'l2', label: 'L2 (Ridge)' },
        ],
      },
    },
    tags: ['linear', 'simple', 'interpretable', 'fast'],
  },
  {
    id: 'random_forest',
    name: 'Random Forest',
    description: 'An ensemble of decision trees that provides strong performance on most datasets. Handles non-linear relationships well.',
    hyperparams: {
      n_estimators: {
        type: 'slider',
        label: 'Number of Trees',
        min: 10,
        max: 500,
        step: 10,
        default: 100,
      },
      max_depth: {
        type: 'slider',
        label: 'Maximum Depth',
        min: 2,
        max: 30,
        step: 1,
        default: 10,
      },
    },
    tags: ['ensemble', 'robust', 'feature importance', 'non-linear'],
  },
  {
    id: 'xgboost',
    name: 'XGBoost',
    description: 'A gradient boosting algorithm known for winning ML competitions. High performance but may require more tuning.',
    hyperparams: {
      n_estimators: {
        type: 'slider',
        label: 'Number of Trees',
        min: 10,
        max: 500,
        step: 10,
        default: 100,
      },
      learning_rate: {
        type: 'slider',
        label: 'Learning Rate',
        min: 0.01,
        max: 0.3,
        step: 0.01,
        default: 0.1,
      },
      max_depth: {
        type: 'slider',
        label: 'Maximum Depth',
        min: 2,
        max: 15,
        step: 1,
        default: 6,
      },
    },
    tags: ['boosting', 'high performance', 'competition winner', 'advanced'],
  },
];

const regressionAlgorithms: Algorithm[] = [
  {
    id: 'linear_regression',
    name: 'Linear Regression',
    description: 'A simple approach that models the relationship with a linear equation. Fast, interpretable, but only captures linear relationships.',
    hyperparams: {
      fit_intercept: {
        type: 'radio',
        label: 'Fit Intercept',
        default: true,
        options: [
          { value: true, label: 'Yes' },
          { value: false, label: 'No' },
        ],
      },
    },
    tags: ['linear', 'simple', 'interpretable', 'fast'],
  },
  {
    id: 'random_forest_regressor',
    name: 'Random Forest',
    description: 'An ensemble of decision trees that provides strong performance on most datasets. Handles non-linear relationships well.',
    hyperparams: {
      n_estimators: {
        type: 'slider',
        label: 'Number of Trees',
        min: 10,
        max: 500,
        step: 10,
        default: 100,
      },
      max_depth: {
        type: 'slider',
        label: 'Maximum Depth',
        min: 2,
        max: 30,
        step: 1,
        default: 10,
      },
    },
    tags: ['ensemble', 'robust', 'feature importance', 'non-linear'],
  },
  {
    id: 'xgboost_regressor',
    name: 'XGBoost',
    description: 'A gradient boosting algorithm known for winning ML competitions. High performance but may require more tuning.',
    hyperparams: {
      n_estimators: {
        type: 'slider',
        label: 'Number of Trees',
        min: 10,
        max: 500,
        step: 10,
        default: 100,
      },
      learning_rate: {
        type: 'slider',
        label: 'Learning Rate',
        min: 0.01,
        max: 0.3,
        step: 0.01,
        default: 0.1,
      },
      max_depth: {
        type: 'slider',
        label: 'Maximum Depth',
        min: 2,
        max: 15,
        step: 1,
        default: 6,
      },
    },
    tags: ['boosting', 'high performance', 'competition winner', 'advanced'],
  },
];

const clusteringAlgorithms: Algorithm[] = [
  {
    id: 'kmeans',
    name: 'K-Means',
    description: 'A classic clustering algorithm that groups similar data points into k clusters. Simple, fast, but assumes spherical clusters.',
    hyperparams: {
      n_clusters: {
        type: 'slider',
        label: 'Number of Clusters',
        min: 2,
        max: 20,
        step: 1,
        default: 5,
      },
    },
    tags: ['simple', 'fast', 'centroid-based'],
  },
  {
    id: 'dbscan',
    name: 'DBSCAN',
    description: 'Density-based clustering that can find arbitrarily shaped clusters. Less sensitive to outliers and doesn\'t require specifying cluster count.',
    hyperparams: {
      eps: {
        type: 'slider',
        label: 'Maximum Distance',
        min: 0.1,
        max: 5,
        step: 0.1,
        default: 0.5,
      },
      min_samples: {
        type: 'slider',
        label: 'Minimum Samples',
        min: 2,
        max: 20,
        step: 1,
        default: 5,
      },
    },
    tags: ['density-based', 'no cluster count', 'handles outliers'],
  },
];

const ModelSelection: React.FC<ModelSelectionProps> = ({ 
  problemType, 
  onSelectModel, 
  autoSelectRecommended = false,
  isProcessing,
}) => {
  const algorithms = 
    problemType === 'classification' ? classificationAlgorithms :
    problemType === 'regression' ? regressionAlgorithms :
    problemType === 'clustering' ? clusteringAlgorithms : [];
  
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string | null>(
    autoSelectRecommended && algorithms.length > 0 ? 
      problemType === 'classification' ? 'random_forest' :
      problemType === 'regression' ? 'random_forest_regressor' :
      'kmeans' : null
  );
  
  const [hyperparams, setHyperparams] = useState<{[key: string]: any}>({});
  
  React.useEffect(() => {
    if (selectedAlgorithm) {
      const algorithm = algorithms.find(a => a.id === selectedAlgorithm);
      if (algorithm) {
        const defaultParams = Object.entries(algorithm.hyperparams).reduce(
          (acc, [key, config]) => ({
            ...acc,
            [key]: config.default,
          }),
          {}
        );
        setHyperparams(defaultParams);
      }
    }
  }, [selectedAlgorithm, algorithms]);
  
  const handleHyperparamChange = (param: string, value: any) => {
    setHyperparams(prev => ({
      ...prev,
      [param]: value,
    }));
  };
  
  const handleTrainModel = () => {
    if (selectedAlgorithm) {
      onSelectModel(selectedAlgorithm, hyperparams);
    }
  };
  
  if (!problemType) return null;
  
  return (
    <Card className="w-full animate-fade-in">
      <CardHeader>
        <div className="flex items-center">
          <BrainCircuit className="mr-2 h-5 w-5 text-primary" />
          <CardTitle>Select Algorithm</CardTitle>
        </div>
        <CardDescription>
          Choose a machine learning algorithm for your {problemType} problem
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="select">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="select" className="flex items-center space-x-2">
              <BrainCircuit className="h-4 w-4" />
              <span>Select Algorithm</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tune" 
              disabled={!selectedAlgorithm}
              className="flex items-center space-x-2"
            >
              <Cog className="h-4 w-4" />
              <span>Tune Hyperparameters</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="select" className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 gap-4">
              {algorithms.map((algorithm) => (
                <div 
                  key={algorithm.id}
                  className={cn(
                    "flex flex-col rounded-lg border p-4 transition-all duration-200 hover:shadow-md cursor-pointer",
                    selectedAlgorithm === algorithm.id ? "ring-2 ring-primary border-primary bg-primary/5" : "hover:bg-muted/40"
                  )}
                  onClick={() => setSelectedAlgorithm(algorithm.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center mr-3",
                        selectedAlgorithm === algorithm.id ? "bg-primary text-white" : "bg-muted"
                      )}>
                        {selectedAlgorithm === algorithm.id ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Layers className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{algorithm.name}</h3>
                        <p className="text-sm text-muted-foreground">{algorithm.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-2 pt-1">
                    {algorithm.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs capitalize">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="tune" className="animate-fade-in">
            {selectedAlgorithm && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Cog className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">
                      {algorithms.find(a => a.id === selectedAlgorithm)?.name} Settings
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Tune hyperparameters to improve model performance
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-6">
                    {selectedAlgorithm && algorithms.find(a => a.id === selectedAlgorithm)?.hyperparams && 
                      Object.entries(algorithms.find(a => a.id === selectedAlgorithm)!.hyperparams).map(([param, config]) => (
                        <div key={param} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={param} className="text-base">
                              {config.label}
                            </Label>
                            {config.type === 'slider' && (
                              <span className="text-sm font-medium">
                                {hyperparams[param]}
                              </span>
                            )}
                          </div>
                          
                          {config.description && (
                            <p className="text-xs text-muted-foreground">
                              {config.description}
                            </p>
                          )}
                          
                          {config.type === 'slider' && (
                            <Slider
                              id={param}
                              min={config.min}
                              max={config.max}
                              step={config.step}
                              value={[hyperparams[param]]}
                              onValueChange={(values) => handleHyperparamChange(param, values[0])}
                              className="py-2"
                            />
                          )}
                          
                          {config.type === 'radio' && (
                            <RadioGroup
                              value={String(hyperparams[param])}
                              onValueChange={(value) => {
                                let parsedValue = value;
                                if (value === "true") parsedValue = true;
                                if (value === "false") parsedValue = false;
                                handleHyperparamChange(param, parsedValue);
                              }}
                              className="flex flex-col space-y-1"
                            >
                              {config.options?.map((option) => (
                                <div key={String(option.value)} className="flex items-center space-x-2">
                                  <RadioGroupItem 
                                    value={String(option.value)} 
                                    id={`${param}-${String(option.value)}`}
                                  />
                                  <Label htmlFor={`${param}-${String(option.value)}`}>
                                    {option.label}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          )}
                        </div>
                      ))
                    }
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="justify-end pt-0">
        <Button 
          variant="default" 
          size="lg"
          disabled={!selectedAlgorithm || isProcessing}
          onClick={handleTrainModel}
          className={cn(
            "transition-all duration-300",
            isProcessing ? "opacity-50" : ""
          )}
        >
          <Activity className="mr-2 h-4 w-4" />
          Train Model
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ModelSelection;
