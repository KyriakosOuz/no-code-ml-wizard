
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Activity, BarChart, Database, ListChecks } from "lucide-react";

interface DataSummaryProps {
  data: {
    columns: string[];
    head: any[][];
    types: { [key: string]: string };
    summary: {
      [key: string]: {
        type: string;
        count: number;
        missing: number;
        unique?: number;
        top?: string;
        min?: number;
        max?: number;
        mean?: number;
        std?: number;
      };
    };
    shape: [number, number];
    target?: string;
    problemType?: 'classification' | 'regression' | 'clustering';
  } | null;
  isLoading: boolean;
}

const DataSummary: React.FC<DataSummaryProps> = ({ data, isLoading }) => {
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

  if (!data) return null;

  // Generate type badges with appropriate colors
  const getTypeBadge = (type: string) => {
    const colorMap: Record<string, string> = {
      'numeric': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'integer': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'float': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'categorical': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'text': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'datetime': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'boolean': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'object': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    
    return colorMap[type.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <Card className="w-full bg-card animate-fade-in">
      <CardHeader>
        <div className="flex items-center">
          <Database className="mr-2 h-5 w-5 text-primary" />
          <CardTitle>Dataset Overview</CardTitle>
        </div>
        <CardDescription>
          {data.shape[0]} rows × {data.shape[1]} columns • 
          {data.problemType && (
            <Badge variant="outline" className="ml-2 capitalize">
              {data.problemType} problem
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="preview" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Data Preview</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Statistics</span>
            </TabsTrigger>
            <TabsTrigger value="columns" className="flex items-center space-x-2">
              <ListChecks className="h-4 w-4" />
              <span>Columns</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="animate-fade-in">
            <ScrollArea className="h-[300px] w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {data.columns.map((column, index) => (
                      <TableHead key={index} className={cn(
                        column === data.target ? "bg-primary/10 font-semibold" : ""
                      )}>
                        {column}
                        {column === data.target && (
                          <Badge variant="outline" className="ml-2 px-1">Target</Badge>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.head.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex} className={cn(
                          data.columns[cellIndex] === data.target ? "bg-primary/5 font-medium" : ""
                        )}>
                          {String(cell)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="stats" className="animate-fade-in">
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <BarChart className="h-4 w-4" /> 
                    Numerical Features
                  </h3>
                  <Separator className="mb-3" />
                  
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(data.summary)
                      .filter(([_, stats]) => stats.type === 'numeric' || stats.type === 'integer' || stats.type === 'float')
                      .map(([column, stats]) => (
                        <Card key={column} className="overflow-hidden">
                          <CardHeader className="p-3">
                            <CardTitle className="text-sm">{column}</CardTitle>
                            <Badge className={cn("text-xs", getTypeBadge(stats.type))}>
                              {stats.type}
                            </Badge>
                          </CardHeader>
                          <CardContent className="p-3 pt-0 text-xs">
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                              <div className="text-muted-foreground">Min:</div>
                              <div className="font-medium text-right">{stats.min?.toFixed(2)}</div>
                              <div className="text-muted-foreground">Max:</div>
                              <div className="font-medium text-right">{stats.max?.toFixed(2)}</div>
                              <div className="text-muted-foreground">Mean:</div>
                              <div className="font-medium text-right">{stats.mean?.toFixed(2)}</div>
                              <div className="text-muted-foreground">Missing:</div>
                              <div className="font-medium text-right">{stats.missing}</div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    }
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <ListChecks className="h-4 w-4" /> 
                    Categorical Features
                  </h3>
                  <Separator className="mb-3" />
                  
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(data.summary)
                      .filter(([_, stats]) => stats.type === 'categorical' || stats.type === 'boolean' || stats.type === 'object')
                      .map(([column, stats]) => (
                        <Card key={column} className="overflow-hidden">
                          <CardHeader className="p-3">
                            <CardTitle className="text-sm">{column}</CardTitle>
                            <Badge className={cn("text-xs", getTypeBadge(stats.type))}>
                              {stats.type}
                            </Badge>
                          </CardHeader>
                          <CardContent className="p-3 pt-0 text-xs">
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                              <div className="text-muted-foreground">Unique:</div>
                              <div className="font-medium text-right">{stats.unique}</div>
                              <div className="text-muted-foreground">Top value:</div>
                              <div className="font-medium text-right truncate max-w-[100px]" title={stats.top}>
                                {stats.top}
                              </div>
                              <div className="text-muted-foreground">Missing:</div>
                              <div className="font-medium text-right">{stats.missing}</div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    }
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="columns" className="animate-fade-in">
            <ScrollArea className="h-[300px] w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Missing Values</TableHead>
                    <TableHead>Stats</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(data.summary).map(([column, stats]) => (
                    <TableRow key={column} className={cn(
                      column === data.target ? "bg-primary/5" : ""
                    )}>
                      <TableCell className="font-medium">
                        {column}
                        {column === data.target && (
                          <Badge variant="outline" className="ml-2">Target</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs", getTypeBadge(stats.type))}>
                          {stats.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {stats.missing === 0 ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            No missing values
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {stats.missing} missing ({((stats.missing / stats.count) * 100).toFixed(1)}%)
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {stats.type === 'numeric' || stats.type === 'integer' || stats.type === 'float' ? (
                          <span>
                            Min: {stats.min?.toFixed(2)} • Max: {stats.max?.toFixed(2)} • Mean: {stats.mean?.toFixed(2)}
                          </span>
                        ) : (
                          <span>
                            Unique values: {stats.unique} • Most common: {stats.top}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DataSummary;
