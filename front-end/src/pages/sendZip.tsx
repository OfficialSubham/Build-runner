import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const SendZip = () => {
    const URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [uploadType, setUploadType] = useState("static");
    const deploymentIdRef = useRef("");

    const handleOnchange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setUploadType(e.target.value);
    };

    const handleSubmit = async () => {
        if (!file) return;
        const formData = new FormData();
        formData.append("project", file);
        formData.append("buildType", uploadType);

        const res = await fetch(`${URL}/api/deployments/send-file`, {
            method: "POST",
            body: formData,
        });

        const data = await res?.json();
        if (data.deploymentId) {
            deploymentIdRef.current = data.deploymentId;
            navigate(`/deployments/${data.deploymentId}`);
        }
    };
    return (
        <>
            <div>Hello hello</div>
            <div>
                <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => {
                        setFile(e.target.files?.[0] ?? null);
                    }}
                />
                <button onClick={handleSubmit}>Submit</button>
                <div>
                    <select
                        name="deploymentType"
                        defaultValue={"static"}
                        onChange={handleOnchange}
                    >
                        <option value="static">Static</option>
                        <option value="long-running">Long Running</option>
                    </select>
                </div>
            </div>
        </>
    );
};

export default SendZip;
