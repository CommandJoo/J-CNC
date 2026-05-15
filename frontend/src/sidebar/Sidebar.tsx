import "./Sidebar.css"
import * as IoIcons from "react-icons/io";
import * as Io5Icons from "react-icons/io5";
import Dropdown from "../topbar/comp/Dropdown.tsx";
import DropdownButton from "../topbar/comp/DropdownButton.tsx";
import {useModal} from "../ModalContext.tsx";
import {useRef, useState} from "react";
import {useGRBL} from "../GRBLContext.tsx";

const Icons = {
    ...IoIcons,
    ...Io5Icons
}

export type ButtonType = {
    text: string;
    gcode1: string;
    gcode2?: string;
    isToggle: boolean;
}

function AddButtonModal() {
    const {close} = useModal();
    const [mode, setMode] = useState<boolean>(false);
    const {addButton} = useGRBL();

    const textRef = useRef<HTMLInputElement>(null);
    const gcode1Ref = useRef<HTMLTextAreaElement>(null);
    const gcode2Ref = useRef<HTMLTextAreaElement>(null);

    const submit = () => {
        if (!textRef.current || !textRef.current.value) return;
        if (!gcode1Ref.current) return;

        const text = textRef.current.value;
        textRef.current.value = "";
        const gcode1 = gcode1Ref.current.value;
        gcode1Ref.current.value = "";
        let gcode2 = undefined;
        if (gcode2Ref.current) {
            gcode2 = gcode2Ref.current.value;
            gcode2Ref.current.value = "";
        }

        addButton({text, gcode1, gcode2, isToggle: mode});
        close();
    }

    return <div id={"add-button"}>
        <div id={"content"}>
            <h1>Add Button</h1>
            <h3>Button Text</h3>
            <input ref={textRef} type={"text"} placeholder={"..."}/>
            <h3>Button GCode</h3>
            <div id={"areas"}>
                <div>
                    {mode ? <h4>Toggle</h4> : <h4></h4>}
                    <textarea ref={gcode1Ref} placeholder={"..."}/>
                </div>
                {mode && <div>
                    <h4>Untoggle</h4>
                    <textarea ref={gcode2Ref} placeholder={"..."}/>
                </div>}
            </div>

            <h3>Mode</h3>
            <div id={"mode"}>
                <button onClick={() => setMode(false)} className={!mode ? "selected" : ""}>Hold</button>
                <button onClick={() => setMode(true)} className={mode ? "selected" : ""}>Toggle</button>
            </div>
        </div>
        <div id={"submit"}>
            <button className={"cancel"} onClick={() => close()}>Cancel</button>
            <button onClick={() => submit()}>Create</button>
        </div>
    </div>
}

export function ButtonEntry(props: { type: ButtonType }) {
    const {sendLine} = useGRBL();
    const [toggled, setToggled] = useState<boolean>(false);

    return <div className={"btn"+(toggled ? " toggled" : "")} onClick={() => {
        if(props.type.isToggle) {
            if(toggled && props.type.gcode2) {
                for (const line of props.type.gcode2.split("\n")) {
                    sendLine(line);
                }
            }else {
                for (const line of props.type.gcode1.split("\n")) {
                    sendLine(line);
                }
            }
            setToggled(!toggled);
        }else {
            for (const line of props.type.gcode1.split("\n")) {
                sendLine(line);
            }
        }
    }}>
        <Icons.IoInformation/>
        <div>{props.type.text}</div>
    </div>;
}

export default function Sidebar() {
    const {showModal} = useModal();
    const {buttons} = useGRBL();
    return <div id={"sidebar"}>
        <div id={"sidebar-port-panel"}>
            <Dropdown icon={<></>} text={"Port"} id={"port"}>
                <DropdownButton text={"Port 1"} closeOnClick={true}/>
                <DropdownButton text={"Port 2"} closeOnClick={true}/>
            </Dropdown>
        </div>
        <div id={"sidebar-buttons"}>
            <div key={-1} className={"btn"} onClick={() => {
                showModal(
                    <AddButtonModal/>
                )
            }}>
                <Icons.IoAdd/>
            </div>
            {
                buttons.map((button, i) => {
                    return <ButtonEntry key={i} type={button}/>
                })
            }
            {
                // Object.entries(Icons).map(([name, Icon], i) => {
                //     const Component = Icon;
                //
                //     return <div key={i} className={"btn"}>
                //         <Component />
                //         <div>{name}</div>
                //     </div>;
                // })
            }
        </div>
    </div>
}