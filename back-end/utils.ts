import { spawn } from "child_process";
import { WriteStream } from "fs";
import { clients } from ".";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import unzipper from "unzipper";

const DEPLOYMENTS_ROOT = process.env.DEPLOYMENTS_ROOT ?? "/home/codersubham/deployments";

export const runCommand = async (
    command: string,
    args: string[],
    cwd: string,
    logStream: WriteStream,
    commandType: string,
    deploymentId: string,
) => {
    return new Promise<void>((resolve, reject) => {
        process.stdout.write(`Starting ${commandType}...`);
        const child = spawn(command, args, {
            cwd,
            shell: true,
        });

        child.stdout.on("data", (data) => {
            const text = data.toString();
            process.stdout.write(text);
            logStream.write(text);
            clients[deploymentId]?.forEach((client) => {
                client.write(`Data : ${text}\n`);
            });
        });

        child.stderr.on("data", (data) => {
            const text = data.toString();
            process.stdout.write(text);
            logStream.write(text);
            clients[deploymentId]?.forEach((client) => {
                client.write(`Data : ${text}\n`);
            });
        });

        child.on("close", (code) => {
            if (code == 0) {
                console.log("--- Successfully completed ---");
                clients[deploymentId]?.forEach((client) => {
                    client.write(`Data : Successfully Completed\n`);
                });
                resolve();
            } else {
                reject(new Error(`Process exited with code ${code}`));
            }
        });
    });
};

export const createFile = async (filePath: string) => {
    await fsPromises.mkdir(filePath, {
        recursive: true,
    });
};

export const saveZip = async (deploymentId: string, zipFile: Express.Multer.File) => {
    const zipPath = path.join(DEPLOYMENTS_ROOT, deploymentId, "project.zip");
    console.log("Zip Path :", zipPath);
    await fsPromises.writeFile(zipPath, zipFile.buffer);
};

export const updateStatusJson = async (
    deploymentStatusJsonPath: string,
    status: "BUILDING" | "FAILED" | "QUEUED" | "SUCCESS",
) => {
    await fsPromises.writeFile(deploymentStatusJsonPath, JSON.stringify({ status }));
};

export const getDeploymentsPath = (deploymentId: string) => {
    const deploymentsDir = path.join(DEPLOYMENTS_ROOT, deploymentId);

    return {
        rootDir: deploymentsDir,
        zipPath: path.join(deploymentsDir, "project.zip"),
        sourceDir: path.join(deploymentsDir, "source"),
        logsPath: path.join(deploymentsDir, "logs.txt"),
        statusPath: path.join(deploymentsDir, "status.json"),
    };
};

export const extractFile = async (deploymentId: string) => {
    const { zipPath, sourceDir } = getDeploymentsPath(deploymentId);
    await fs
        .createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: sourceDir }))
        .promise();
};

export const startBuilding = async (deploymentId: string) => {
    const paths = getDeploymentsPath(deploymentId);
    try {
        updateStatusJson(paths.statusPath, "BUILDING");
        await createFile(paths.sourceDir);
        await extractFile(deploymentId);
        //Checking for the existance of package.json file in the root folder
        const packageExists = fs.existsSync(paths.sourceDir + "/package.json");

        if (!packageExists) {
            throw new Error("Package.json does not exists in you project");
        }

        const logStream = fs.createWriteStream(paths.logsPath, {
            flags: "a",
        });
        //Checking for the type of the project

        const packageJson = JSON.parse(
            fs.readFileSync(`${paths.sourceDir}/package.json`, "utf8"),
        );

        if (packageJson.dependencies.next) {
            const text = "--- Next Project ---\n\n";
            process.stdout.write(text);
            logStream.write(text);
        } else if (packageJson.dependencies.react) {
            const text = "--- React Project ---\n\n";
            process.stdout.write(text);
            logStream.write(text);
        } else {
            const text = "---  Project not identified ---\n\n";
            process.stdout.write(text);
            logStream.write(text);
        }

        await runCommand(
            "npm",
            ["install"],
            paths.sourceDir,
            logStream,
            "Installing Packages",
            deploymentId,
        );
        await runCommand(
            "npm",
            ["run", "build"],
            paths.sourceDir,
            logStream,
            "Running Build The Project",
            deploymentId,
        );
    } catch (error) {
        console.log("Failed To Build \n\n Error ->", error);
        updateStatusJson(paths.statusPath, "FAILED");
    }
};
