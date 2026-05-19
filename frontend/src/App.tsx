import './App.css'
import Sidebar from "./sidebar/Sidebar.tsx";
import Preview from "./preview/Preview.tsx";
import Topbar from "./topbar/Topbar.tsx";
import Terminal from "./terminal/Terminal.tsx";
import {GRBLProvider} from "./providers/GRBLContext.tsx";
import {DropdownProvider, useDropdown} from "./providers/DropdownMenuContext.tsx";
import {useEffect} from "react";
import {ModalProvider, useModal} from "./providers/ModalContext.tsx";
import {ContextMenuProvider} from "./providers/ContextMenuContext.tsx";
import {UIContextProvider} from "./providers/UIContext.tsx";

function App() {
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            e.preventDefault();
        }
        window.addEventListener("contextmenu", handler)
        return () => window.removeEventListener("contextmenu", handler);
    }, []);

    return <UIContextProvider>
        <GRBLProvider>
            <ContextMenuProvider>
                <ModalProvider>
                    <DropdownProvider>
                        <BaseApp/>
                    </DropdownProvider>
                </ModalProvider>
            </ContextMenuProvider>
        </GRBLProvider>
    </UIContextProvider>
}

function BaseApp() {
    const {setCurrent, current} = useDropdown();
    const {isOpen, close} = useModal();

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                if (isOpen) {
                    close();
                } else if (current != null) {
                    setCurrent(null);
                }

            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [close, current, isOpen, setCurrent]);

    return <div id={"app"}>
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
