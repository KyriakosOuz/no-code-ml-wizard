
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ProblemTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const ProblemTypeSelector: React.FC<ProblemTypeSelectorProps> = ({ 
  value, 
  onChange 
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="problem-type">Problem Type</Label>
      <Select
        value={value}
        onValueChange={onChange}
      >
        <SelectTrigger id="problem-type" className="w-full">
          <SelectValue placeholder="Select problem type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="classification">
            Classification (categorical target)
          </SelectItem>
          <SelectItem value="regression">
            Regression (numerical target)
          </SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Choose regression for continuous numerical targets (e.g., income, price).
        Choose classification for categorical targets (e.g., yes/no, categories).
      </p>
    </div>
  );
};

export default ProblemTypeSelector;
