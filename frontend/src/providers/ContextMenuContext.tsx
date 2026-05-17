import {createContext, type ReactNode, useContext, useEffect, useState} from "react";
import "./ContextMenuContext.css"
type ContextMenuState = {
    x: number;
    y: number;
    content: ReactNode | null;
};

type ContextMenuContextType = {
    open: (x: number, y: number, content: ReactNode) => void;
    handleContextMenu: (event: React.MouseEvent, content: ReactNode) => void;
    change: (content: ReactNode) => void;
    close: () => void;
};

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

export function ContextMenuProvider({children}: { children: ReactNode }) {
    const [menu, setMenu] = useState<ContextMenuState>({x: 0, y: 0, content: null});

    const open = (x: number, y: number, content: ReactNode) => {
        setMenu({x, y, content});
    }
    const handleContextMenu = (event: React.MouseEvent, content: ReactNode) => {
        event.preventDefault();
        event.stopPropagation();
        open(event.clientX, event.clientY, content);
    }
    const change = (content: ReactNode) => {
        setMenu(prev => {
            return {x: prev.x, y: prev.y, content}
        });
    }

    const close = () => setMenu({x: 0, y: 0, content: null});

    useEffect(() => {
        const handleClick = () => close();
        const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && close();

        document.addEventListener("click", handleClick);
        document.addEventListener("keydown", handleEsc);
        return () => {
            document.removeEventListener("click", handleClick);
            document.removeEventListener("keydown", handleEsc);
        };
    }, []);

    return (
        <ContextMenuContext.Provider value={{open, close, change, handleContextMenu}}>
            <div id={"context-menu-context"}>
                {children}
                {menu.content && (
                    <div
                        style={{position: "fixed", top: menu.y, left: menu.x}}
                        onClick={(e) => e.stopPropagation()}
                        id={"context-menu"}
                    >
                        {menu.content}
                    </div>
                )}
            </div>
        </ContextMenuContext.Provider>
    );
}

export function useContextMenu() {
    const ctx = useContext(ContextMenuContext);
    if (!ctx) throw new Error("useContextMenu must be used within ContextMenuContext");
    return ctx;
}