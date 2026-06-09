import { BrowserRouter, Route, Routes } from "react-router-dom";
import Deployments from "./pages/deployments";
import SendZip from "./pages/sendZip";

function App() {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" Component={SendZip} />
                    <Route path="/deployments/:deploymentId" Component={Deployments} />
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
