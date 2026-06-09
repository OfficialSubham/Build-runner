import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

const Deployments = () => {
    const { deploymentId } = useParams();
    const URL = import.meta.env.VITE_API_URL;

    const [logs, setLogs] = useState("");
    const [status, setStatus] = useState<
        "BUILDING" | "QUEUED" | "" | "SUCCESS" | "FAILED"
    >();
    const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        intervalId.current = setInterval(async () => {
            const res = await fetch(`${URL}/deployments/${deploymentId}/status`);
            const data = await res.json();
            console.log(data.status);
            if (!data.status) {
                alert("Something went wrong");
                clearInterval(intervalId.current!);
            }

            setStatus(data.status);
            setLogs(data.logs);

            if (data.status == "SUCCESS" || data.status == "FAILED") {
                clearInterval(intervalId.current!);
            }
        }, 1000);
        return () => {
            if (intervalId.current) clearInterval(intervalId.current);
        };
    });

    return (
        <div>
            --- Deployments ---
            <div>
                <h1>Status : {status ?? "QUEUED"}</h1>
            </div>
            <div style={{ whiteSpace: "pre-wrap" }}>
                <h1>Logs : </h1>
                {logs ?? "Wait while fetching"}
            </div>
        </div>
    );
};

export default Deployments;
