import { z } from "zod";
import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const datasets = pgTable("datasets", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  status: text("status").notNull(), // 'uploaded', 'analyzing', 'ready', 'error'
  rowCount: integer("row_count"),
  colCount: integer("col_count"),
  summary: jsonb("summary"), // store analysis results
  cleanedFilename: text("cleaned_filename"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDatasetSchema = createInsertSchema(datasets).omit({ id: true, createdAt: true });

export type Dataset = typeof datasets.$inferSelect;
export type InsertDataset = z.infer<typeof insertDatasetSchema>;

// API request/response types
export type UploadResponse = {
  id: number;
  message: string;
};

export type AnalysisResponse = {
  id: number;
  status: string;
  summary?: any;
};

export type AiSuggestionsResponse = {
  suggestions: string;
};

export type CleanDataRequest = {
  handleMissing: 'drop' | 'mean' | 'median' | 'mode' | 'none';
  removeDuplicates: boolean;
  encodeCategorical: boolean;
  normalize: boolean;
};

export type CleanDataResponse = {
  success: boolean;
  cleanedFilename?: string;
  message?: string;
};
