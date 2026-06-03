import { useEffect, useState } from "react";

function App() {
    const URL = import.meta.env.VITE_API_URL;
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async () => {
        if (!file) return;
        const formData = new FormData();
        formData.append("project", file);
        const res = await fetch(`${URL}/send-file`, {
            method: "POST",
            body: formData,
        });
        const data = await res.json();
        console.log(data);
    };

    useEffect(() => {
        console.log(file);
    }, [file]);

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
            </div>
        </>
    );
}

export default App;
