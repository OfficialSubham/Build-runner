import { spawn } from "child_process";

export const runCommand = async (command: string, args: string[], cwd: string) => {
    return new Promise<void>((resolve, reject) => {
        const child = spawn(command, args, {
            cwd,
            shell: true,
        });

        child.stdout.on("data", (data) => {
            console.log(data.toString());
        });

        child.stderr.on("data", (data) => {
            console.log(data.toString());
        });

        child.on("close", (code) => {
            if (code == 0) {
                console.log("--- Successfully completed ---");
                resolve();
            } else {
                reject(new Error(`Process exited with code ${code}`));
            }
        });
    });
};
