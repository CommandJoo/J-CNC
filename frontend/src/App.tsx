import './App.css'
import Sidebar from "./sidebar/Sidebar.tsx";
import Preview from "./preview/Preview.tsx";
import Topbar from "./topbar/Topbar.tsx";
import Terminal from "./terminal/Terminal.tsx";
import {GRBLProvider, useGRBL} from "./GRBLContext.tsx";
import {DropdownProvider, useDropdown} from "./topbar/comp/DropdownMenuContext.tsx";
import {useEffect} from "react";

function App() {
    return <GRBLProvider>
        <DropdownProvider>
            <Themeable/>
        </DropdownProvider>
    </GRBLProvider>
}

function Themeable() {
    const {theme} = useGRBL();
    const {setCurrent} = useDropdown();

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                setCurrent(null);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [setCurrent]);

    return <div id={"theme"} className={theme.name} tabIndex={-1}>
        <div id={"app-top"}>
            <Topbar/>
        </div>
        <div id={"app-main"}>
            <Sidebar/>
            <div className={"main-content"}>
                <Preview/>
                <Terminal/>
            </div>
        </div>
    </div>
}

export default App
