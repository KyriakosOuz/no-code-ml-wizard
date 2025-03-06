
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database, FileText, BrainCircuit, Plus, Settings, LogOut, Trash2 } from "lucide-react";
import Header from '@/components/Header';

interface Dataset {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  problem_type: string | null;
}

interface Model {
  id: string;
  name: string;
  model_type: string;
  created_at: string;
  dataset_id: string;
  dataset_name?: string;
  metrics: any;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchUserData();
  }, [user, navigate]);
  
  const fetchUserData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch user's datasets
      const { data: datasetsData, error: datasetsError } = await supabase
        .from('datasets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (datasetsError) throw datasetsError;
      
      // Fetch user's models
      const { data: modelsData, error: modelsError } = await supabase
        .from('models')
        .select('*, datasets:dataset_id(name)')
        .order('created_at', { ascending: false });
      
      if (modelsError) throw modelsError;
      
      // Process model data to include dataset name
      const processedModels = modelsData.map(model => ({
        ...model,
        dataset_name: model.datasets?.name || 'Unknown dataset'
      }));
      
      setDatasets(datasetsData);
      setModels(processedModels);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message || "There was an error loading your data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteDataset = async (id: string) => {
    try {
      const { error } = await supabase
        .from('datasets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setDatasets(datasets.filter(dataset => dataset.id !== id));
      
      toast({
        title: "Dataset deleted",
        description: "The dataset has been successfully deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting dataset",
        description: error.message || "There was an error deleting the dataset",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteModel = async (id: string) => {
    try {
      const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setModels(models.filter(model => model.id !== id));
      
      toast({
        title: "Model deleted",
        description: "The model has been successfully deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting model",
        description: error.message || "There was an error deleting the model",
        variant: "destructive",
      });
    }
  };
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container max-w-7xl mx-auto py-8 px-4">
        {/* Dashboard Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your datasets and machine learning models
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <Tabs defaultValue="datasets" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="datasets" className="flex items-center">
              <Database className="mr-2 h-4 w-4" />
              Datasets
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center">
              <BrainCircuit className="mr-2 h-4 w-4" />
              Models
            </TabsTrigger>
          </TabsList>
          
          {/* Datasets Tab */}
          <TabsContent value="datasets">
            {isLoading ? (
              <div className="text-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Loading your datasets...</p>
              </div>
            ) : datasets.length > 0 ? (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Problem Type</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datasets.map((dataset) => (
                      <TableRow key={dataset.id}>
                        <TableCell className="font-medium">{dataset.name}</TableCell>
                        <TableCell>{dataset.problem_type || 'Unknown'}</TableCell>
                        <TableCell>{formatDate(dataset.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/dataset/${dataset.id}`)}
                            >
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDataset(dataset.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="pt-10 pb-10 text-center">
                  <Database className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No datasets yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your first dataset to start building machine learning models
                  </p>
                  <Button onClick={() => navigate('/')}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Dataset
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Models Tab */}
          <TabsContent value="models">
            {isLoading ? (
              <div className="text-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Loading your models...</p>
              </div>
            ) : models.length > 0 ? (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Dataset</TableHead>
                      <TableHead>Model Type</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {models.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell className="font-medium">{model.name}</TableCell>
                        <TableCell>{model.dataset_name}</TableCell>
                        <TableCell>{model.model_type}</TableCell>
                        <TableCell>{formatDate(model.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/model/${model.id}`)}
                            >
                              <BrainCircuit className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteModel(model.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="pt-10 pb-10 text-center">
                  <BrainCircuit className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No models yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Train your first model to see it here
                  </p>
                  <Button onClick={() => navigate('/')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Start New Project
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
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

export default Dashboard;
