import express from "express";
import cors from "cors";
import multer from "multer";
import { randomUUID } from "crypto";
import fsPromises from "fs/promises";
import fs from "fs";
import unzipper from "unzipper";
import type { Response } from "express";
import { createFile, runCommand, saveZip, startBuilding } from "./utils";

const DEPLOYMENTS_DIR = process.env.DEPLOYMENTS_DIR ?? "/home/codersubham/deployments";

const upload = multer({
    storage: multer.memoryStorage(),
});

//Keeping a map of users who are checking for their logs
export const clients: Record<string, Response[]> = {};

//Adding the clients
const addClient = (deploymentId: string, res: Response) => {
    if (!clients[deploymentId]) {
        clients[deploymentId] = [];
    }

    clients[deploymentId].push(res);
};

const app = express();
app.use(express.json());

app.use(cors({ origin: "http://localhost:5173" }));

app.get("/health", (req, res) => {
    res.json({ status: "OK" });
});

app.post("/send-file", upload.single("project"), async (req, res) => {
    const file = req.file;
    if (!file || !file.originalname.endsWith(".zip")) {
        res.status(400).json({
            message: "Please provide valid zip file",
        });
        return;
    }

    try {
        const deploymentId = randomUUID();
        //Creating the folder to put the zip file
        await createFile(DEPLOYMENTS_DIR + "/" + deploymentId);
        //Zip file added
        await saveZip(deploymentId, file);

        res.status(201).json({ message: "Successfully created the file", deploymentId });
        startBuilding(deploymentId);
    } catch (error) {
        console.log("Error ->", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.get("/deployments/:deploymentId/logs/stream", (req, res) => {
    //Setting up the headers for streaming the text files
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const deploymentId = req.params.deploymentId;
    addClient(deploymentId, res);

    req.on("close", () => {
        console.log("--- Running Close ---\n\n");
        clients[deploymentId]?.filter((client) => client !== res);
    });
});

app.listen(3000, () => {
    console.log("Server Started");
});
