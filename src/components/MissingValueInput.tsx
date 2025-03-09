
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MissingValueInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const MissingValueInput: React.FC<MissingValueInputProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Label htmlFor="missing-value-symbol" className="text-sm font-medium">
          Missing Value Symbol
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="w-[220px] text-xs">
                Specify the symbol used to represent missing values in your dataset.
                Common symbols include "?", "NA", "N/A", "NULL", "NaN", or blank spaces.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Input
        id="missing-value-symbol"
        placeholder="?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="max-w-xs"
      />
      <p className="text-xs text-muted-foreground">
        Default is "?" if left empty.
      </p>
    </div>
  );
};

export default MissingValueInput;
