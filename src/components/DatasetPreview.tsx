
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DatasetPreviewProps {
  sampleRows: any[];
  columnDetails: {
    name: string;
    type: "numeric" | "categorical" | "datetime";
    missing_values: number;
  }[];
}

const DatasetPreview: React.FC<DatasetPreviewProps> = ({ sampleRows, columnDetails }) => {
  if (!sampleRows || sampleRows.length === 0) {
    return (
      <Card className="w-full animate-fade-in">
        <CardHeader>
          <CardTitle className="text-xl">Dataset Preview</CardTitle>
          <CardDescription>No preview data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Get column names from the first sample row
  const columns = Object.keys(sampleRows[0]);

  // Get column type map for icon display
  const columnTypeMap = columnDetails.reduce((acc, col) => {
    acc[col.name] = col.type;
    return acc;
  }, {} as Record<string, string>);

  // Get missing values columns
  const missingValuesColumns = columnDetails
    .filter(col => col.missing_values > 0)
    .map(col => col.name);

  return (
    <Card className="w-full animate-fade-in">
      <CardHeader>
        <CardTitle className="text-xl">Dataset Preview</CardTitle>
        <CardDescription>First 5 rows of your dataset</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column} className="whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <span>{column}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {columnTypeMap[column] === "numeric" ? (
                              <span className="text-blue-500 text-xs font-mono">#</span>
                            ) : columnTypeMap[column] === "datetime" ? (
                              <span className="text-purple-500 text-xs font-mono">📅</span>
                            ) : (
                              <span className="text-green-500 text-xs font-mono">Aa</span>
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{columnTypeMap[column] === "numeric" 
                                ? "Numeric column" 
                                : columnTypeMap[column] === "datetime"
                                ? "Date/time column"
                                : "Categorical column"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {missingValuesColumns.includes(column) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info size={14} className="text-amber-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>This column contains missing values</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleRows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column) => {
                    const value = row[column];
                    const isMissing = value === null || value === undefined || value === "";
                    
                    return (
                      <TableCell key={`${rowIndex}-${column}`}>
                        {isMissing ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="text-red-500 italic">missing</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>This value is missing in the dataset and will be handled based on your selected strategy</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatasetPreview;
