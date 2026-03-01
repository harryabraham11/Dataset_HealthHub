import { z } from "zod";
import { insertDatasetSchema, datasets } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  datasets: {
    list: {
      method: "GET" as const,
      path: "/api/datasets" as const,
      responses: {
        200: z.array(z.custom<typeof datasets.$inferSelect>()),
      },
    },
    upload: {
      method: "POST" as const,
      path: "/api/datasets/upload" as const,
      // body is multipart/form-data with a 'file' field
      responses: {
        201: z.object({ id: z.number(), message: z.string() }),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/datasets/:id" as const,
      responses: {
        200: z.custom<typeof datasets.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    analyze: {
      method: "POST" as const,
      path: "/api/datasets/:id/analyze" as const,
      responses: {
        200: z.object({ success: z.boolean(), message: z.string() }),
        404: errorSchemas.notFound,
        500: errorSchemas.internal,
      },
    },
    suggest: {
      method: "POST" as const,
      path: "/api/datasets/:id/suggest" as const,
      responses: {
        200: z.object({ suggestions: z.string() }),
        404: errorSchemas.notFound,
        500: errorSchemas.internal,
      },
    },
    clean: {
      method: "POST" as const,
      path: "/api/datasets/:id/clean" as const,
      input: z.object({
        handleMissing: z.enum(['drop', 'mean', 'median', 'mode', 'none']),
        removeDuplicates: z.boolean(),
        encodeCategorical: z.boolean(),
        normalize: z.boolean(),
      }),
      responses: {
        200: z.object({ success: z.boolean(), cleanedFilename: z.string().optional(), message: z.string().optional() }),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        500: errorSchemas.internal,
      },
    },
    automl: {
      method: "POST" as const,
      path: "/api/datasets/:id/automl" as const,
      input: z.object({
        targetColumn: z.string(),
        taskType: z.enum(['classification', 'regression']).optional(),
      }),
      responses: {
        200: z.object({ success: z.boolean(), results: z.any() }),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        500: errorSchemas.internal,
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type DatasetResponse = typeof datasets.$inferSelect;
