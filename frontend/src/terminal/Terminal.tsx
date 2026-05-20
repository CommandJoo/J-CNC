import "./Terminal.css";
import { useGRBL } from "../providers/GRBLContext.tsx";

export default function Terminal() {
    const grbl = useGRBL();

    return (
        <div id="terminal">
            <div id="output">
                {grbl.log.map(entry => {
                    return (
                        <div
                            className={`line ${entry.direction}`}
                            key={entry.id}
                        >
                            {entry.direction === "in" && "< "}
                            {entry.direction === "out" && "> "}
                            {entry.direction === "system" && "* "}

                            {entry.text}
                        </div>
                    );
                })}
            </div>

            <input
                disabled={grbl.controlsDisabled}
                id="command"
                placeholder="Type GCode..."
                type="text"
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        const line = e.currentTarget.value.trim();

                        if (line.length === 0) {
                            return;
                        }

                        e.currentTarget.value = "";

                        grbl.sendLine(line);
                    }
                }}
            />
        </div>
    );
}