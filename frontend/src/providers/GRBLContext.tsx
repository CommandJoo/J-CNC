import {
    createContext,
    useCallback,
    useContext, useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import type {CNC, PortInfo} from "../types.ts";
import "./GRBLContext.css";

export type MachineStatus =
    | "disconnected"
    | "idle"
    | "run"
    | "hold"
    | "alarm"
    | "error";

export type JobState =
    | "idle"
    | "loaded"
    | "running"
    | "paused"
    | "finished"
    | "cancelled"
    | "error";

export type GCodeLine = {
    id: number;
    raw: string;
    type: "command" | "comment" | "empty";
    status: "pending" | "sent" | "ok" | "error" | "skipped";
};

export type ConsoleEntry = {
    id: number;
    direction: "in" | "out" | "system";
    text: string;
    time: number;
};

export type Position = {
    machine?: { x: number; y: number; z: number };
    work?: { x: number; y: number; z: number };
};

export type GRBLContextType = {
    cnc: CNC | null;

    ports: PortInfo[];
    selectedPort: string | null;
    setSelectedPort: (port: string | null) => void;
    baudrate: number;
    setBaudrate: (baudrate: number) => void;
    lastFile: string|null,
    setLastFile: (lastFile: string) => void;

    connected: boolean;

    status: MachineStatus;
    position: Position;

    buffer: GCodeLine[];
    currentLineIndex: number;
    jobState: JobState;
    running: boolean;
    paused: boolean;

    log: ConsoleEntry[];

    refreshPorts: () => void;
    connect: (path: string, rate: number) => void;
    disconnect: () => void;

    sendLine: (line: string) => void;
    loadGCode: (text: string) => void;
    clearBuffer: () => void;

    runBuffer: () => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;

    handleIncomingLine: (line: string) => void;
    clearLog: () => void;

    controlsDisabled: boolean,
};

const GRBLContext = createContext<GRBLContextType | null>(null);

function getCNC(): CNC | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((window as any).cnc as CNC | undefined) ?? null;
}

function classifyGCodeLine(raw: string): GCodeLine["type"] {
    const trimmed = raw.trim();

    if (trimmed.length === 0) return "empty";
    if (trimmed.startsWith(";") || trimmed.startsWith("(")) return "comment";

    return "command";
}

function parseGCode(text: string): GCodeLine[] {
    return text
        .split(/\r?\n/)
        .map((raw, index) => {
            const type = classifyGCodeLine(raw);

            return {
                id: index,
                raw,
                type,
                status: type === "command" ? "pending" : "skipped",
            };
        });
}

export function GRBLProvider({children}: { children: React.ReactNode }) {
    const accessBaudrate = () => {
        try {
            const item = localStorage.getItem("baudrate");
            return item ? (JSON.parse(item) as number) : 115200;
        } catch (error) {
            console.error("Error reading localStorage key:", "baudrate", error);
            return 115200;
        }
    }
    const accessPort = () => {
        try {
            const item = localStorage.getItem("port");
            return item ? (JSON.parse(item) as string) : null;
        } catch (error) {
            console.error("Error reading localStorage key:", "port", error);
            return null;
        }
    }
    const accessLastFile = () => {
        try {
            const item = localStorage.getItem("last_file");
            return item ? (JSON.parse(item) as string) : null;
        } catch (error) {
            console.error("Error reading localStorage key:", "last_file", error);
            return null;
        }
    }

    const cnc = getCNC();

    const [ports, setPorts] = useState<PortInfo[]>([]);
    const [selectedPort, setStoredSelectedPort] = useState<string | null>(accessPort());
    const [baudrate, setStoredBaudrate] = useState(accessBaudrate());
    const [lastFile, setStoredLastFile] = useState<string|null>(accessLastFile());
    const [connected, setConnected] = useState(false);

    const setSelectedPort = (value: string|null) => {
        try {
            const valueToStore = value;
            setStoredSelectedPort(valueToStore);
            localStorage.setItem("port", JSON.stringify(valueToStore));

        } catch (error) {
            console.error("Error setting localStorage key:", "port", error);
        }
    };

    const setBaudrate = (value: number) => {
        try {
            const valueToStore = value;
            setStoredBaudrate(valueToStore);
            localStorage.setItem("baudrate", JSON.stringify(valueToStore));

        } catch (error) {
            console.error("Error setting localStorage key:", "baudrate", error);
        }
    };

    const setLastFile = (value: string) => {
        try {
            const valueToStore = value;
            setStoredLastFile(valueToStore);
            localStorage.setItem("last_file", JSON.stringify(valueToStore));

        } catch (error) {
            console.error("Error setting localStorage key:", "last_file", error);
        }
    }

    const [status, setStatus] = useState<MachineStatus>("disconnected");
    const [position, setPosition] = useState<Position>({});

    const [buffer, setBuffer] = useState<GCodeLine[]>([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [jobState, setJobState] = useState<JobState>("idle");

    const [log, setLog] = useState<ConsoleEntry[]>([]);

    const bufferRef = useRef<GCodeLine[]>([]);
    const currentLineIndexRef = useRef(0);
    const jobStateRef = useRef<JobState>("idle");

    function parseAxis(value: string) {
        const [x, y, z] = value.split(",").map(Number);

        if ([x, y, z].some(Number.isNaN)) return undefined;

        return { x, y, z };
    }

    function parseStatusWord(value: string): MachineStatus {
        const status = value.toLowerCase();

        if (status.startsWith("idle")) return "idle";
        if (status.startsWith("run")) return "run";
        if (status.startsWith("hold")) return "hold";
        if (status.startsWith("alarm")) return "alarm";
        if (status.startsWith("door")) return "hold";
        if (status.startsWith("check")) return "idle";
        if (status.startsWith("home")) return "run";
        if (status.startsWith("sleep")) return "idle";

        return "idle";
    }

    const parseStatusLine = useCallback((line: string) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
            const content = trimmed.slice(1, -1);
            const parts = content.split("|");

            const statusWord = parts[0];
            const parsedStatus = parseStatusWord(statusWord);

            setStatus(parsedStatus);

            const nextPosition: Position = {};

            for (const part of parts.slice(1)) {
                const [key, value] = part.split(":");

                if (!key || !value) continue;

                switch (key) {
                    case "MPos": {
                        const machine = parseAxis(value);
                        if (machine) nextPosition.machine = machine;
                        break;
                    }

                    case "WPos": {
                        const work = parseAxis(value);
                        if (work) nextPosition.work = work;
                        break;
                    }

                    default:
                        break;
                }
            }

            setPosition(prev => ({
                machine: nextPosition.machine ?? prev.machine,
                work: nextPosition.work ?? prev.work,
            }));

            return;
        }
    }, []);

    const addLog = useCallback((direction: ConsoleEntry["direction"], text: string) => {
        setLog(prev => [
            ...prev,
            {
                id: Date.now() + Math.random(),
                direction,
                text,
                time: Date.now(),
            },
        ]);
    }, []);

    const setJobStateSafe = useCallback((state: JobState) => {
        jobStateRef.current = state;
        setJobState(state);
    }, []);

    const refreshPorts = useCallback(() => {
        const bridge = getCNC();

        if (!bridge) {
            addLog("system", "CNC bridge not available");
            return;
        }

        const rawPorts = Array.from(bridge.listPorts() ?? []);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedPorts = rawPorts.map((port: any) => ({
            name: typeof port.name === "function" ? port.name() : port.name,
            path: typeof port.path === "function" ? port.path() : port.path,
        }));

        setPorts(mappedPorts);
    }, [addLog]);

    const connect = useCallback((portOverride?: string, baudrateOverride?: number) => {
        const bridge = getCNC();

        if (!bridge) {
            addLog("system", "CNC bridge not available");
            return;
        }

        const portToUse = portOverride ?? selectedPort;
        const baudToUse = baudrateOverride ?? baudrate;

        if (!portToUse) {
            addLog("system", "No port selected");
            return;
        }

        bridge.connect(portToUse, baudToUse);

        setConnected(true);
        setStatus("idle");
        addLog("system", `Connected to ${portToUse} at ${baudToUse}`);
    }, [selectedPort, baudrate, addLog]);

    const disconnect = useCallback(() => {
        const bridge = getCNC();

        if (!bridge) return;

        bridge.disconnect();

        setConnected(false);
        setStatus("disconnected");
        setJobStateSafe("idle");
        addLog("system", "Disconnected");
    }, [addLog, setJobStateSafe]);

    const sendLine = useCallback((line: string) => {
        const bridge = getCNC();
        const consoleObj = bridge?.console();

        if (!consoleObj) {
            addLog("system", "Console not connected");
            return;
        }

        consoleObj.sendLine(line);
        addLog("out", line);
    }, [addLog]);

    const loadGCode = useCallback((text: string) => {
        const parsed = parseGCode(text);

        bufferRef.current = parsed;
        currentLineIndexRef.current = 0;

        setBuffer(parsed);
        setCurrentLineIndex(0);
        setJobStateSafe(parsed.some(line => line.type === "command") ? "loaded" : "idle");

        addLog("system", `Loaded ${parsed.length} lines`);
    }, [addLog, setJobStateSafe]);

    const clearBuffer = useCallback(() => {
        bufferRef.current = [];
        currentLineIndexRef.current = 0;

        setBuffer([]);
        setCurrentLineIndex(0);
        setJobStateSafe("idle");

        addLog("system", "Buffer cleared");
    }, [addLog, setJobStateSafe]);

    const sendNextBufferLine = useCallback(() => {
        const currentBuffer = bufferRef.current;

        if (jobStateRef.current !== "running") return;

        let index = currentLineIndexRef.current;

        while (index < currentBuffer.length) {
            const line = currentBuffer[index];

            if (line.type !== "command") {
                index++;
                continue;
            }

            currentLineIndexRef.current = index;
            setCurrentLineIndex(index);

            setBuffer(prev =>
                prev.map(item =>
                    item.id === line.id
                        ? {...item, status: "sent"}
                        : item
                )
            );

            sendLine(line.raw.trim());
            return;
        }

        setJobStateSafe("finished");
        addLog("system", "Job finished");
    }, [sendLine, addLog, setJobStateSafe]);

    const runBuffer = useCallback(() => {
        if (!connected) {
            addLog("system", "Not connected");
            return;
        }

        if (bufferRef.current.length === 0) {
            addLog("system", "No G-code loaded");
            return;
        }

        setJobStateSafe("running");
        addLog("system", "Job started");

        queueMicrotask(sendNextBufferLine);
    }, [connected, addLog, setJobStateSafe, sendNextBufferLine]);

    const pause = useCallback(() => {
        setJobStateSafe("paused");
        setStatus("hold");
        addLog("system", "Job paused");
    }, [addLog, setJobStateSafe]);

    const resume = useCallback(() => {
        setJobStateSafe("running");
        setStatus("run");
        addLog("system", "Job resumed");

        queueMicrotask(sendNextBufferLine);
    }, [addLog, setJobStateSafe, sendNextBufferLine]);

    const stop = useCallback(() => {
        setJobStateSafe("cancelled");
        setStatus("idle");
        addLog("system", "Job cancelled");
    }, [addLog, setJobStateSafe]);

    const handleIncomingLine = useCallback((line: string) => {
        const trimmed = line.trim();
        const normalized = trimmed.toLowerCase();

        // GRBL status report, for example:
        // <Idle|MPos:0.000,0.000,0.000|FS:0,0>
        parseStatusLine(trimmed);

        if(!(trimmed.startsWith("<") && trimmed.endsWith(">"))) {
            addLog("in", trimmed);
        }

        if (normalized === "ok") {
            const index = currentLineIndexRef.current;
            const sentLine = bufferRef.current[index];

            if (sentLine) {
                bufferRef.current = bufferRef.current.map(item =>
                    item.id === sentLine.id
                        ? { ...item, status: "ok" }
                        : item
                );

                setBuffer(bufferRef.current);
            }

            currentLineIndexRef.current = index + 1;
            setCurrentLineIndex(index + 1);

            sendNextBufferLine();
            return;
        }

        if (normalized.startsWith("error")) {
            setJobStateSafe("error");
            setStatus("error");
            addLog("system", `GRBL error: ${trimmed}`);
            return;
        }

        if (normalized.startsWith("alarm")) {
            setJobStateSafe("error");
            setStatus("alarm");
            addLog("system", `GRBL alarm: ${trimmed}`);
        }
    }, [addLog, parseStatusLine, sendNextBufferLine, setJobStateSafe]);

    const clearLog = useCallback(() => {
        setLog([]);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).onGrblResponse = (line: string) => {
            handleIncomingLine(line);
        };

        return () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (window as any).onGrblResponse;
        };
    }, [handleIncomingLine]);

    const controlsDisabled =
        jobState === "running" ||
        status === "run" ||
        status === "hold" ||
        status === "alarm" ||
        status === "error";

    const value = useMemo<GRBLContextType>(() => ({
        cnc,

        ports,
        selectedPort,
        setSelectedPort,
        baudrate,
        setBaudrate,
        lastFile,
        setLastFile,

        connected,

        status,
        position,

        buffer,
        currentLineIndex,
        jobState,
        running: jobState === "running",
        paused: jobState === "paused",

        log,

        refreshPorts,
        connect,
        disconnect,

        sendLine,
        loadGCode,
        clearBuffer,

        runBuffer,
        pause,
        resume,
        stop,

        handleIncomingLine,
        clearLog,

        controlsDisabled,
    }), [
        cnc,
        ports,
        selectedPort,
        baudrate,
        connected,
        lastFile,
        status,
        position,
        buffer,
        currentLineIndex,
        jobState,
        log,
        refreshPorts,
        connect,
        disconnect,
        sendLine,
        loadGCode,
        clearBuffer,
        runBuffer,
        pause,
        resume,
        stop,
        handleIncomingLine,
        clearLog,

        controlsDisabled,
    ]);

    return (
        <GRBLContext.Provider value={value}>
            <div id="grbl-context">
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