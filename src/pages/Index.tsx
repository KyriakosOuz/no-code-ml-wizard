
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { ArrowRight, FileText, BrainCircuit, Activity, Database, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import Header from "@/components/Header";
import FileUpload from "@/components/FileUpload";
import DataSummary from "@/components/DataSummary";
import DataPreprocessing from "@/components/DataPreprocessing";
import ModelSelection from "@/components/ModelSelection";
import ModelResults from "@/components/ModelResults";
import { processDataset, trainModel, exportModel, generateReport } from "@/utils/mlUtils";

const Index = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<
    'upload' | 'data' | 'preprocess' | 'model' | 'results'
  >('upload');
  
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [datasetInfo, setDatasetInfo] = useState<any | null>(null);
  const [isProcessingData, setIsProcessingData] = useState(false);
  
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [modelHyperparams, setModelHyperparams] = useState<any | null>(null);
  const [isTrainingModel, setIsTrainingModel] = useState(false);
  const [modelResults, setModelResults] = useState<any | null>(null);
  
  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setDatasetFile(file);
    setIsProcessingData(true);
    toast({
      title: "Processing dataset",
      description: "Analyzing your data. This may take a moment...",
    });
    
    try {
      const info = await processDataset(file);
      setDatasetInfo(info);
      toast({
        title: "Dataset processed successfully",
        description: `Detected ${info.shape[0]} rows and ${info.shape[1]} columns.`,
      });
      setCurrentStep('data');
    } catch (error) {
      toast({
        title: "Error processing dataset",
        description: "There was an error analyzing your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingData(false);
    }
  };
  
  // Handle model selection
  const handleModelSelect = async (model: string, hyperparams: any) => {
    setSelectedModel(model);
    setModelHyperparams(hyperparams);
    setIsTrainingModel(true);
    
    toast({
      title: "Training model",
      description: "Building and evaluating your model. This may take a moment...",
    });
    
    try {
      const results = await trainModel(datasetInfo, model, hyperparams);
      setModelResults(results);
      toast({
        title: "Model trained successfully",
        description: getProblemTypeSuccessMessage(datasetInfo?.problemType, results),
      });
      setCurrentStep('results');
    } catch (error) {
      toast({
        title: "Error training model",
        description: "There was an error training your model. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTrainingModel(false);
    }
  };
  
  // Helper to get success message based on problem type
  const getProblemTypeSuccessMessage = (problemType: string | undefined, results: any): string => {
    if (problemType === 'classification') {
      return `Classification model achieved ${(results.metrics.accuracy * 100).toFixed(1)}% accuracy.`;
    } else if (problemType === 'regression') {
      return `Regression model achieved R² score of ${(results.metrics.r2 * 100).toFixed(1)}%.`;
    } else if (problemType === 'clustering') {
      return `Clustering model completed with silhouette score of ${(results.metrics.silhouette_score).toFixed(2)}.`;
    }
    return "Model training completed successfully.";
  };
  
  // Handle data updates from preprocessing
  const handleDataUpdate = (updatedData: any) => {
    setDatasetInfo(updatedData);
  };
  
  // Handle export model
  const handleExportModel = () => {
    if (!modelResults) return;
    
    const modelBlob = exportModel(modelResults);
    const url = URL.createObjectURL(modelBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model_${selectedModel}_${new Date().toISOString().split('T')[0]}.pkl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Model exported",
      description: "Your trained model file has been downloaded.",
    });
  };
  
  // Handle export report
  const handleExportReport = () => {
    if (!datasetInfo || !modelResults) return;
    
    const reportBlob = generateReport(datasetInfo, modelResults);
    const url = URL.createObjectURL(reportBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ml_report_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Report generated",
      description: "Your model analysis report has been downloaded.",
    });
  };
  
  // Show the appropriate step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <FileUpload 
              onFileUpload={handleFileUpload}
              isProcessing={isProcessingData}
            />
          </motion.div>
        );
      case 'data':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <DataSummary 
              data={datasetInfo}
              isLoading={isProcessingData}
            />
            
            <div className="flex justify-end">
              <Button 
                onClick={() => setCurrentStep('preprocess')}
                disabled={!datasetInfo}
                className="flex items-center space-x-2"
              >
                <span>Preprocess Data</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </motion.div>
        );
      case 'preprocess':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <DataPreprocessing
              data={datasetInfo}
              onDataUpdate={handleDataUpdate}
              isProcessing={isProcessingData}
            />
            
            <div className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => setCurrentStep('data')}
              >
                Back to Data Summary
              </Button>
              <Button 
                onClick={() => setCurrentStep('model')}
                disabled={!datasetInfo}
                className="flex items-center space-x-2"
              >
                <span>Select Model</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </motion.div>
        );
      case 'model':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <ModelSelection 
              problemType={datasetInfo?.problemType || null}
              onSelectModel={handleModelSelect}
              autoSelectRecommended={true}
              isProcessing={isTrainingModel}
            />
            
            <div className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => setCurrentStep('preprocess')}
              >
                Back to Preprocessing
              </Button>
            </div>
          </motion.div>
        );
      case 'results':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <ModelResults 
              results={modelResults}
              isLoading={isTrainingModel}
              onExportModel={handleExportModel}
              onExportReport={handleExportReport}
            />
            
            <div className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => setCurrentStep('model')}
              >
                Back to Model Selection
              </Button>
              
              <Button 
                onClick={() => {
                  setDatasetFile(null);
                  setDatasetInfo(null);
                  setSelectedModel(null);
                  setModelHyperparams(null);
                  setModelResults(null);
                  setCurrentStep('upload');
                }}
                variant="default"
              >
                Start New Project
              </Button>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container max-w-6xl mx-auto py-8 px-4">
        {/* Steps Progress */}
        <div className="mb-12">
          <Tabs value={currentStep} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger 
                value="upload" 
                onClick={() => currentStep !== 'upload' && datasetFile && setCurrentStep('upload')}
                disabled={isProcessingData || isTrainingModel}
                className="flex items-center space-x-2 h-14"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <FileText size={16} />
                </div>
                <span>Upload</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="data" 
                onClick={() => datasetInfo && setCurrentStep('data')}
                disabled={!datasetInfo || isProcessingData || isTrainingModel}
                className="flex items-center space-x-2 h-14"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'data' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <Database size={16} />
                </div>
                <span>Data</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="preprocess" 
                onClick={() => datasetInfo && setCurrentStep('preprocess')}
                disabled={!datasetInfo || isProcessingData || isTrainingModel}
                className="flex items-center space-x-2 h-14"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'preprocess' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <SlidersHorizontal size={16} />
                </div>
                <span>Preprocess</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="model" 
                onClick={() => datasetInfo && setCurrentStep('model')}
                disabled={!datasetInfo || isProcessingData || isTrainingModel}
                className="flex items-center space-x-2 h-14"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'model' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <BrainCircuit size={16} />
                </div>
                <span>Model</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="results" 
                onClick={() => modelResults && setCurrentStep('results')}
                disabled={!modelResults || isProcessingData || isTrainingModel}
                className="flex items-center space-x-2 h-14"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'results' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <Activity size={16} />
                </div>
                <span>Results</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Main Content */}
        <div className="mt-4">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 border-t">
        <div className="container max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>No-Code Machine Learning Platform • Created with modern web technologies</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
