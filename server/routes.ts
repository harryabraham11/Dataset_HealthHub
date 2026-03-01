import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { spawn } from "child_process";
import { openai } from "./replit_integrations/image/client";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Ensure uploads directory exists
fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(console.error);

const upload = multer({ dest: UPLOADS_DIR });

// Helper to run python scripts
async function runPythonScript(scriptPath: string, args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const process = spawn("python3", [scriptPath, ...args]);
    let stdoutData = "";
    let stderrData = "";

    process.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    process.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Python script exited with code ${code}: ${stderrData}`));
        return;
      }
      try {
        const result = JSON.parse(stdoutData);
        resolve(result);
      } catch (err) {
        // If it's not JSON, just return the raw string
        resolve({ output: stdoutData });
      }
    });
  });
}


export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Serve uploaded files
  app.use('/uploads', express.static(UPLOADS_DIR));

  app.get(api.datasets.list.path, async (req, res) => {
    const datasets = await storage.getAllDatasets();
    res.json(datasets);
  });

  app.post(api.datasets.upload.path, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const dataset = await storage.createDataset({
        filename: req.file.filename,
        originalName: req.file.originalname,
        status: "uploaded",
        rowCount: null,
        colCount: null,
        summary: null,
        cleanedFilename: null
      });

      res.status(201).json({ id: dataset.id, message: "File uploaded successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  app.get(api.datasets.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const dataset = await storage.getDataset(id);
    if (!dataset) {
      return res.status(404).json({ message: "Dataset not found" });
    }
    res.json(dataset);
  });

  app.post(api.datasets.analyze.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const dataset = await storage.getDataset(id);
    
    if (!dataset) {
      return res.status(404).json({ message: "Dataset not found" });
    }

    try {
      await storage.updateDataset(id, { status: "analyzing" });
      
      const filePath = path.join(UPLOADS_DIR, dataset.filename);
      const scriptPath = path.join(process.cwd(), "server", "python", "analyzer.py");
      
      const result = await runPythonScript(scriptPath, [filePath]);
      
      await storage.updateDataset(id, {
        status: "ready",
        rowCount: result.shape[0],
        colCount: result.shape[1],
        summary: result
      });

      res.json({ success: true, message: "Analysis complete" });
    } catch (error: any) {
      console.error("Analysis error:", error);
      await storage.updateDataset(id, { status: "error" });
      res.status(500).json({ message: "Analysis failed: " + error.message });
    }
  });

  app.post(api.datasets.suggest.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const dataset = await storage.getDataset(id);
    
    if (!dataset || !dataset.summary) {
      return res.status(404).json({ message: "Dataset not found or not analyzed yet" });
    }

    try {
      // Use OpenAI to generate suggestions based on the summary
      const prompt = `You are an expert Data Scientist. I have a dataset with the following summary profile. Please provide concise, actionable recommendations for data cleaning and model selection.
      
Dataset Shape: ${dataset.rowCount} rows, ${dataset.colCount} columns.
Missing Values: ${JSON.stringify(dataset.summary.missing_values)}
Duplicate Rows: ${dataset.summary.duplicate_rows}
Data Types: ${JSON.stringify(dataset.summary.dtypes)}

Suggest:
1. Handling missing values
2. Encoding categorical variables
3. Scaling recommendations
4. Potential machine learning models suited for this dataset type.

Format as a clean, readable Markdown string.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
      });

      res.json({ suggestions: response.choices[0]?.message?.content || "No suggestions generated." });
    } catch (error: any) {
      console.error("AI Suggestion error:", error);
      res.status(500).json({ message: "Failed to generate suggestions" });
    }
  });

  app.post(api.datasets.clean.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const dataset = await storage.getDataset(id);
    
    if (!dataset) {
      return res.status(404).json({ message: "Dataset not found" });
    }

    try {
      const config = api.datasets.clean.input.parse(req.body);
      const inputPath = path.join(UPLOADS_DIR, dataset.filename);
      const cleanedFilename = `cleaned_${dataset.filename}.csv`;
      const outputPath = path.join(UPLOADS_DIR, cleanedFilename);
      const scriptPath = path.join(process.cwd(), "server", "python", "cleaner.py");

      const result = await runPythonScript(scriptPath, [
        inputPath, 
        outputPath, 
        JSON.stringify(config)
      ]);

      await storage.updateDataset(id, { cleanedFilename });

      res.json({ success: true, cleanedFilename, message: "Dataset cleaned successfully" });
    } catch (error: any) {
      console.error("Cleaning error:", error);
      res.status(500).json({ message: "Failed to clean dataset: " + error.message });
    }
  });

  app.post(api.datasets.automl.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const dataset = await storage.getDataset(id);
    
    if (!dataset) {
      return res.status(404).json({ message: "Dataset not found" });
    }

    try {
      const config = api.datasets.automl.input.parse(req.body);
      // Use cleaned dataset if available, otherwise original
      const filename = dataset.cleanedFilename || dataset.filename;
      const filePath = path.join(UPLOADS_DIR, filename);
      const scriptPath = path.join(process.cwd(), "server", "python", "automl.py");

      const result = await runPythonScript(scriptPath, [
        filePath,
        config.targetColumn,
        config.taskType || 'auto'
      ]);

      res.json({ success: true, results: result });
    } catch (error: any) {
      console.error("AutoML error:", error);
      res.status(500).json({ message: "AutoML failed: " + error.message });
    }
  });

  return httpServer;
}
