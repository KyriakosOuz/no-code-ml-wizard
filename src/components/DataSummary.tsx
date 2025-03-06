
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Activity, 
  BarChart, 
  Database, 
  ListChecks, 
  Search, 
  SlidersHorizontal,
  Table as TableIcon,
  ArrowDown,
  ArrowUp
} from "lucide-react";

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
        median?: number;
      };
    };
    shape: [number, number];
    target?: string;
    problemType?: 'classification' | 'regression' | 'clustering';
    rawData?: any[];
  } | null;
  isLoading: boolean;
}

const DataSummary: React.FC<DataSummaryProps> = ({ data, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  } | null>(null);
  
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

  // Function to handle sorting
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Function to filter raw data based on search term
  const getFilteredData = () => {
    if (!data.rawData || !searchTerm.trim()) {
      return data.rawData || [];
    }
    
    return data.rawData.filter(row => {
      return Object.entries(row).some(([key, value]) => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  };
  
  // Function to sort the dataset
  const getSortedData = () => {
    const filteredData = getFilteredData();
    if (!sortConfig) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      if (a[sortConfig.key] === null || a[sortConfig.key] === undefined) return 1;
      if (b[sortConfig.key] === null || b[sortConfig.key] === undefined) return -1;
      
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };
  
  const getSortIcon = (columnName: string) => {
    if (!sortConfig || sortConfig.key !== columnName) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
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
          <TabsList className="grid w-full grid-cols-4 mb-4">
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
            <TabsTrigger value="dataset" className="flex items-center space-x-2">
              <TableIcon className="h-4 w-4" />
              <span>Full Dataset</span>
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
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Column</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Min</TableHead>
                        <TableHead>Max</TableHead>
                        <TableHead>Mean</TableHead>
                        <TableHead>Std Dev</TableHead>
                        <TableHead>Median</TableHead>
                        <TableHead>Missing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(data.summary)
                        .filter(([_, stats]) => stats.type === 'numeric' || stats.type === 'integer' || stats.type === 'float')
                        .map(([column, stats]) => (
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
                            <TableCell>{stats.min?.toFixed(2)}</TableCell>
                            <TableCell>{stats.max?.toFixed(2)}</TableCell>
                            <TableCell>{stats.mean?.toFixed(2)}</TableCell>
                            <TableCell>{stats.std?.toFixed(2)}</TableCell>
                            <TableCell>{stats.median?.toFixed(2) || 'N/A'}</TableCell>
                            <TableCell>
                              {stats.missing === 0 ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  0
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                  {stats.missing} ({((stats.missing / stats.count) * 100).toFixed(1)}%)
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <ListChecks className="h-4 w-4" /> 
                    Categorical Features
                  </h3>
                  <Separator className="mb-3" />
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Column</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Unique Values</TableHead>
                        <TableHead>Most Frequent</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Missing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(data.summary)
                        .filter(([_, stats]) => stats.type === 'categorical' || stats.type === 'boolean' || stats.type === 'object')
                        .map(([column, stats]) => (
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
                            <TableCell>{stats.unique || 'N/A'}</TableCell>
                            <TableCell>{stats.top || 'N/A'}</TableCell>
                            <TableCell>{stats.top || 'N/A'}</TableCell>
                            <TableCell>
                              {stats.missing === 0 ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  0
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                  {stats.missing} ({((stats.missing / stats.count) * 100).toFixed(1)}%)
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
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
          
          <TabsContent value="dataset" className="animate-fade-in">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search dataset..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                {searchTerm && (
                  <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')}>
                    Clear
                  </Button>
                )}
              </div>
              
              <ScrollArea className="h-[250px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {data.columns.map((column) => (
                        <TableHead 
                          key={column}
                          className={cn(
                            "cursor-pointer hover:bg-muted/50 select-none",
                            column === data.target ? "bg-primary/10 font-semibold" : ""
                          )}
                          onClick={() => requestSort(column)}
                        >
                          <div className="flex items-center">
                            {column}
                            {getSortIcon(column)}
                            {column === data.target && (
                              <Badge variant="outline" className="ml-2 px-1">Target</Badge>
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getSortedData().map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {data.columns.map((column) => (
                          <TableCell key={`${rowIndex}-${column}`} className={cn(
                            column === data.target ? "bg-primary/5 font-medium" : "",
                            searchTerm && row[column] !== null && 
                            String(row[column]).toLowerCase().includes(searchTerm.toLowerCase()) ? 
                            "bg-yellow-50 dark:bg-yellow-900/20" : ""
                          )}>
                            {row[column] === null || row[column] === undefined ? 
                              <span className="text-muted-foreground italic">null</span> : 
                              String(row[column])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              
              <div className="text-xs text-muted-foreground">
                Showing {getSortedData().length} of {data.rawData?.length || 0} rows
                {searchTerm && ` (filtered by "${searchTerm}")`}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DataSummary;
