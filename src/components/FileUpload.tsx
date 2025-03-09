import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, FileText, Upload, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isProcessing }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const validateFile = (file: File): boolean => {
    if (!file.name.endsWith('.csv')) {
      setError("Please upload a CSV file");
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError("File size exceeds 10MB limit");
      return false;
    }
    
    setError(null);
    return true;
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };
  
  const handleSubmit = async () => {
    if (!file) return;
    
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload and process datasets",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // First upload file to Supabase storage
      const filePath = `${user.id}/${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('datasets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('datasets')
        .getPublicUrl(filePath);
        
      // Now process the file
      onFileUpload(file);
      
      toast({
        title: "File uploaded successfully",
        description: "Your dataset has been uploaded to your account",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const clearFile = () => {
    setFile(null);
    setError(null);
  };
  
  return (
    <Card className={cn(
      "w-full max-w-3xl mx-auto transition-all duration-300",
      dragActive ? "ring-2 ring-primary/50" : "",
      isProcessing || isUploading ? "opacity-50 pointer-events-none" : ""
    )}>
      <CardHeader>
        <CardTitle className="text-2xl font-medium">Upload Your Dataset</CardTitle>
        <CardDescription>
          Upload a CSV file to begin analyzing and building ML models
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-10 text-center transition-all duration-200 animate-fade-in",
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30",
            file ? "bg-muted/30" : "bg-muted/10",
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!file ? (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-float">
                <Upload size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium">Drag and drop your CSV file here</p>
                <p className="text-sm text-muted-foreground mt-1">Or click to browse for a file</p>
              </div>
              <Input
                type="file"
                accept=".csv"
                className="hidden"
                id="file-upload"
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="mt-4"
              >
                Browse Files
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Maximum file size: 10MB
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <FileText size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-green-600">File selected</p>
                <p className="text-sm font-medium mt-1">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFile}
                className="mt-2"
              >
                <X size={16} className="mr-1" /> Remove File
              </Button>
            </div>
          )}
          
          {error && (
            <div className="mt-4 text-sm text-destructive animate-fade-in">
              <p>{error}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          variant="default"
          size="lg"
          disabled={!file || !!error || isProcessing || isUploading}
          onClick={handleSubmit}
          className={cn(
            "transition-all duration-300",
            file && !error ? "animate-slide-up" : "opacity-0"
          )}
        >
          {isUploading ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
              Uploading...
            </>
          ) : (
            <>
              <Check size={16} className="mr-2" />
              Process Dataset
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FileUpload;
