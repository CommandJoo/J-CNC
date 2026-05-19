import "./Terminal.css"
import {useEffect} from "react";
import {useGRBL} from "../providers/GRBLContext.tsx";

export default function Terminal() {
    const grbl = useGRBL();

    useEffect(() => {
        (window as any).onGrblResponse = (line: string) => {
            grbl.setLines([...grbl.lines, "< "+line]);
        };
        return () => { delete (window as any).onGrblResponse; };
    }, [grbl]);

    return <div id={"terminal"}>
        <div id={"output"}>
            {grbl.lines.map((line, i) => {
                return <div className={"line"} key={i}>{line}</div>
            })}
        </div>
        <input id={"command"} placeholder={"Type GCode..."} type={"text"} onKeyDown={(e) => {
            if(e.key === "Enter") {
                const line = e.currentTarget.value;
                e.currentTarget.value = "";
                grbl.sendLine(line);
            }
        }}/>
    </div>
}