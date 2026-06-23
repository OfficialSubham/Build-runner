import { Router } from "express";
import type { Response } from "express";
import {
    createFile,
    DEPLOYMENTS_ROOT,
    saveZip,
    startBuilding,
    updateStatusJson,
} from "../helpers/utils";
import { randomUUID } from "crypto";
import multer from "multer";
import fsPromises from "fs/promises";

//Keeping a map of users who are checking for their logs
export const clients: Record<string, Response[]> = {};

//Adding the clients
const addClient = (deploymentId: string, res: Response) => {
    if (!clients[deploymentId]) {
        clients[deploymentId] = [];
    }

    clients[deploymentId].push(res);
};

const upload = multer({
    storage: multer.memoryStorage(),
});

const deploymentRoute = Router();

deploymentRoute.post("/send-file", upload.single("project"), async (req, res) => {
    const file = req.file;
    const buildType = req.body.buildType;
    console.log("BUILD TYPE : ", buildType);
    if (!file || !file.originalname.endsWith(".zip")) {
        res.status(400).json({
            message: "Please provide valid zip file",
        });
        return;
    }

    try {
        const deploymentId = randomUUID();
        console.log("Deployment ID ->", deploymentId, "\n\n\n");

        //Creating the folder to put the zip file
        await createFile(DEPLOYMENTS_ROOT + "/" + deploymentId);
        //Creating Status json file as this create and update at the same time
        await updateStatusJson(
            `${DEPLOYMENTS_ROOT}/${deploymentId}/status.json`,
            "QUEUED",
        );
        //Zip file added
        await saveZip(deploymentId, file);

        res.status(201).json({ message: "Successfully created the file", deploymentId });
        setImmediate(() => {
            startBuilding(deploymentId, buildType);
        });
    } catch (error) {
        console.log("Error ->", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

deploymentRoute.get("/:deploymentId/status", async (req, res) => {
    const deploymentId = req.params.deploymentId;
    const logsPath = `${DEPLOYMENTS_ROOT}/${deploymentId}/logs.txt`;
    const statusPath = `${DEPLOYMENTS_ROOT}/${deploymentId}/status.json`;

    try {
        const logs = await fsPromises.readFile(logsPath, "utf-8");
        const { status } = JSON.parse(await fsPromises.readFile(statusPath, "utf-8"));
        res.json({
            logs,
            status,
        });
    } catch (error) {
        //Sending failed status as if there is no logs or status file is present this will run
        res.status(500).json({
            status: "FAILED",
            logs: "Nothing to log",
            message: "Logs not found",
        });
    }
});

//This is actually SSE and this is a prototype project so I will not do this in this project
deploymentRoute.get("/:deploymentId/logs/stream", (req, res) => {
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

export default deploymentRoute;
