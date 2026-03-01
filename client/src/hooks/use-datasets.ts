import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CleanDataRequest } from "@shared/routes";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Helper to log and parse
function parse<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod Error] ${label}:`, result.error.format());
    throw new Error(`Invalid response format for ${label}`);
  }
  return result.data;
}

export function useDatasets() {
  return useQuery({
    queryKey: [api.datasets.list.path],
    queryFn: async () => {
      const res = await fetch(api.datasets.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch datasets");
      const data = await res.json();
      return parse(api.datasets.list.responses[200], data, "datasets.list");
    },
  });
}

export function useDataset(id: number) {
  return useQuery({
    queryKey: [api.datasets.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.datasets.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch dataset");
      const data = await res.json();
      return parse(api.datasets.get.responses[200], data, "datasets.get");
    },
    enabled: !!id,
  });
}

export function useUploadDataset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(api.datasets.upload.path, {
        method: api.datasets.upload.method,
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.datasets.upload.responses[400].parse(data);
          throw new Error(error.message);
        }
        throw new Error("Failed to upload dataset");
      }
      return parse(api.datasets.upload.responses[201], data, "datasets.upload");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.datasets.list.path] });
      toast({ title: "Success", description: "Dataset uploaded successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    }
  });
}

export function useAnalyzeDataset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.datasets.analyze.path, { id });
      const res = await fetch(url, { method: api.datasets.analyze.method, credentials: "include" });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to analyze dataset");
      
      return parse(api.datasets.analyze.responses[200], data, "datasets.analyze");
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.datasets.get.path, id] });
      toast({ title: "Analysis Complete", description: "Dataset summary is ready." });
    },
    onError: (err: Error) => {
      toast({ title: "Analysis Failed", description: err.message, variant: "destructive" });
    }
  });
}

export function useSuggestDataset() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.datasets.suggest.path, { id });
      const res = await fetch(url, { method: api.datasets.suggest.method, credentials: "include" });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to get suggestions");
      
      return parse(api.datasets.suggest.responses[200], data, "datasets.suggest");
    },
    onError: (err: Error) => {
      toast({ title: "AI Error", description: err.message, variant: "destructive" });
    }
  });
}

export function useCleanDataset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...body }: { id: number } & CleanDataRequest) => {
      const validated = api.datasets.clean.input.parse(body);
      const url = buildUrl(api.datasets.clean.path, { id });
      
      const res = await fetch(url, {
        method: api.datasets.clean.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cleaning failed");
      
      return parse(api.datasets.clean.responses[200], data, "datasets.clean");
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.datasets.get.path, variables.id] });
      toast({ 
        title: "Cleaning Complete", 
        description: data.message || "Dataset has been cleaned successfully." 
      });
    },
    onError: (err: Error) => {
      toast({ title: "Cleaning Failed", description: err.message, variant: "destructive" });
    }
  });
}

export function useAutoMLDataset() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, targetColumn, taskType }: { id: number, targetColumn: string, taskType?: 'classification' | 'regression' }) => {
      const validated = api.datasets.automl.input.parse({ targetColumn, taskType });
      const url = buildUrl(api.datasets.automl.path, { id });
      
      const res = await fetch(url, {
        method: api.datasets.automl.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "AutoML failed");
      
      return parse(api.datasets.automl.responses[200], data, "datasets.automl");
    },
    onSuccess: () => {
      toast({ title: "Model Trained", description: "AutoML completed successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "AutoML Failed", description: err.message, variant: "destructive" });
    }
  });
}
