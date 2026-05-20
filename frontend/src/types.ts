export type ButtonType = {
    text: string;
    gcode1: string;
    gcode2?: string;
    isToggle: boolean;
    id: number;
    icon: string;
}

export type Theme = {
    name: string;
    darkMode: boolean;
}

export type CNC = {
    console: () => Console|null;
    converter: () => SvgConverter;

    connect: (port: string, baudrate: number) => void;
    disconnect: () => void;
    listPorts: () => PortInfo[];
}

export type Console = {
    sendLine: (line: string) => void;
}

export type SvgConverter = {
    convert: (svg: string) => string;
}

export type PortInfo = {
    name: string;
    path: string;
}
