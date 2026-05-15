import "./Terminal.css"
import {useCallback, useEffect, useState} from "react";
import {useGRBL} from "../GRBLContext.tsx";

export default function Terminal() {
    const [lines, setLines] = useState<string[]>([])
    const grbl = useGRBL();
    const addLine = useCallback((line: string) => {
        setLines(prevState => {
            return [...prevState, line];
        });
    }, [])

    useEffect(() => {
        (window as any).onGrblResponse = (line: string) => {
            setLines(prev => [...prev, "< "+line]);
        };
        return () => { delete (window as any).onGrblResponse; };
    }, []);

    return <div id={"terminal"}>
        <div id={"output"}>
            {lines.map((line, i) => {
                return <div className={"line"} key={i}>{line}</div>
            })}
        </div>
        <input id={"command"} placeholder={"Type GCode..."} type={"text"} onKeyDown={(e) => {
            if(e.key === "Enter") {
                const line = e.currentTarget.value;
                addLine("> "+line)
                e.currentTarget.value = "";
                grbl.sendLine(line);
            }
        }}/>
    </div>
}