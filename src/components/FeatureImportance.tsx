
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getImageUrl } from '@/services/mlApi';
import { Spinner } from '@/components/ui/spinner';

interface FeatureImportanceProps {
  featureImportanceImageUrl?: string;
}

const FeatureImportance: React.FC<FeatureImportanceProps> = ({ featureImportanceImageUrl }) => {
  const imageUrl = featureImportanceImageUrl ? getImageUrl(featureImportanceImageUrl) : null;
  
  if (!imageUrl) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Feature Importance</CardTitle>
        <CardDescription>
          Most influential features in your model
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md overflow-hidden border">
          <img 
            src={imageUrl} 
            alt="Feature Importance Chart" 
            className="w-full h-auto"
            onError={(e) => {
              // Replace with fallback if image fails to load
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = 'flex justify-center items-center p-8 text-muted-foreground';
                fallback.textContent = 'Feature importance visualization not available';
                parent.appendChild(fallback);
              }
            }}
          />
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          <p>
            Features with higher importance have more influence on the model's predictions. 
            Consider focusing on these features for further analysis or feature engineering.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureImportance;
