import { datasets, type InsertDataset, type Dataset } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  createDataset(dataset: InsertDataset): Promise<Dataset>;
  getDataset(id: number): Promise<Dataset | undefined>;
  getAllDatasets(): Promise<Dataset[]>;
  updateDataset(id: number, updates: Partial<Dataset>): Promise<Dataset | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createDataset(dataset: InsertDataset): Promise<Dataset> {
    const [newDataset] = await db.insert(datasets).values(dataset).returning();
    return newDataset;
  }

  async getDataset(id: number): Promise<Dataset | undefined> {
    const [dataset] = await db.select().from(datasets).where(eq(datasets.id, id));
    return dataset;
  }

  async getAllDatasets(): Promise<Dataset[]> {
    return await db.select().from(datasets).orderBy(datasets.createdAt);
  }

  async updateDataset(id: number, updates: Partial<Dataset>): Promise<Dataset | undefined> {
    const [updated] = await db
      .update(datasets)
      .set(updates)
      .where(eq(datasets.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
