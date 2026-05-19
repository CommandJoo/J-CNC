import {createContext, useCallback, useContext, useRef, useState} from "react";
import type {CNC} from "../types.ts";
import "./GRBLContext.css";

type GRBLContextType = {
    lines: string[];
    setLines: (lines: string[]) => void;
    sendLine: (line: string) => void;
}

const GRBLContext = createContext<GRBLContextType|null>(null);

function getCNC() {
    if(!("cnc" in window)) {
        return;
    }else if(window.cnc) {
        return window.cnc as CNC;
    }
    return;
}

export function GRBLProvider({ children }: { children: React.ReactNode }) {
    const [lineBuffer, setLineBuffer] = useState<string[]>([]);
    const cnc = useRef(getCNC());

    const [lines, setLines] = useState<string[]>([]);

    const sendLine = useCallback((line: string) => {
        setLines(prev => [...prev, line]);
    }, []);

    return (
        <GRBLContext.Provider value={{
            lines,
            setLines,
            sendLine,
        }}>
            <div id={"grbl-context"}>
                {children}
            </div>
        </GRBLContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGRBL() {
    const ctx = useContext(GRBLContext);

    if (!ctx) {
        throw new Error("useGRBL must be used inside GRBLProvider");
    }

    return ctx;
}