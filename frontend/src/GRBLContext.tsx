import {createContext, useCallback, useContext, useState} from "react";

type GRBLContextType = {
    lines: string[];
    setLines: (lines: string[]) => void;
    sendLine: (line: string) => void;
    theme: ThemeType;
    setTheme: (theme: ThemeType) => void;
}

export type ThemeType = {
    name: string;
    darkMode: boolean;
}

const GRBLContext = createContext<GRBLContextType|null>(null);

export function GRBLProvider({ children }: { children: React.ReactNode }) {
    const [lines, setLines] = useState<string[]>([]);
    const [theme, setStoredTheme] = useState(() => {
        try {
            const item = localStorage.getItem("theme");
            return item ? (JSON.parse(item) as ThemeType) : {name: "light", darkMode: false};
        } catch (error) {
            console.error("Error reading localStorage key:", "theme", error);
            return {name: "light", darkMode: false};
        }
    });
    const setTheme = (value: ThemeType) => {
        try {
            const valueToStore =
                value instanceof Function ? value(theme) : value;
            setStoredTheme(valueToStore);
            localStorage.setItem("theme", JSON.stringify(valueToStore));
        } catch (error) {
            console.error("Error setting localStorage key:", "theme", error);
        }
    };

    const sendLine = useCallback((line: string) => {
        setLines(prev => [...prev, line]);
        if ("gconsole" in window) {
            const gc = window.gconsole as { sendLine: (gcode: string) => void };
            gc.sendLine(line);
        }
    }, []);

    return (
        <GRBLContext.Provider value={{
            lines,
            setLines,
            sendLine,
            theme,
            setTheme
        }}>
            {children}
        </GRBLContext.Provider>
    );
}

export function useGRBL() {
    const ctx = useContext(GRBLContext);

    if (!ctx) {
        throw new Error("useGRBL must be used inside GRBLProvider");
    }

    return ctx;
}