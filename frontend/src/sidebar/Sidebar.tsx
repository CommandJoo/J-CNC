import "./Sidebar.css"
import * as IoIcons from "react-icons/io";
import * as Io5Icons from "react-icons/io5";
import {Dropdown, type DropdownRef} from "../topbar/comp/Dropdown.tsx";
import DropdownButton from "../topbar/comp/DropdownButton.tsx";
import {useModal} from "../providers/ModalContext.tsx";
import {useEffect, useRef, useState} from "react";
import {useGRBL} from "../providers/GRBLContext.tsx";
import {useContextMenu} from "../providers/ContextMenuContext.tsx";
import {useUI} from "../providers/UIContext.tsx";
import type {ButtonType, PortInfo} from "../types.ts";
import {PiPlugsConnectedLight, PiPlugsLight} from "react-icons/pi";

const Icons = {
    ...IoIcons,
    ...Io5Icons
}

function AddButtonModal() {
    const {close} = useModal();
    const {addButton} = useUI();

    const [mode, setMode] = useState<boolean>(false);
    const [icon, setIcon] = useState<string>("");
    const [choosingIcon, setChoosingIcon] = useState(false);

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

        addButton({text, gcode1, gcode2, isToggle: mode, id: Math.random() * 10000, icon});
        close();
    }

    const entry = Object.entries(Icons).find(([name]) => icon === name);

    return <div id={"add-button"}>
        <div id={"content"}>
            <div id={"content-scrollable"}>
                <h1>Add Button</h1>
                <div id={"info"}>
                    <div id={"button-wrapper"}>
                        <button onClick={() => setChoosingIcon(!choosingIcon)}>
                            {entry && (() => {
                                const Component = entry[1] as React.ComponentType;
                                return <Component/>;
                            })()}
                        </button>
                    </div>
                    <div>
                        <h3>Button Text</h3>
                        <input ref={textRef} type={"text"} placeholder={"..."}/>
                    </div>
                </div>
                {choosingIcon && <div id={"icon-selection"}>
                    {Object.entries(Icons).map(([name, Icon], i) => {
                        const Component = Icon;

                        return <div key={i} className={"btn" + (icon === name ? " selected" : "")} onClick={() => {
                            setIcon(name);
                        }}>
                            <Component size={"5dvh"}/>
                        </div>;
                    })}
                </div>}
                <h3>Button GCode</h3>
                <div id={"areas"}>
                    <div>
                        <textarea ref={gcode1Ref} placeholder={"GCode"}/>
                    </div>
                    {mode && <div>
                        <textarea ref={gcode2Ref} placeholder={"Gcode Toggle off"}/>
                    </div>}
                </div>

                <h3>Mode</h3>
                <div id={"mode"}>
                    <button onClick={() => setMode(false)} className={!mode ? "selected" : ""}>Hold</button>
                    <button onClick={() => setMode(true)} className={mode ? "selected" : ""}>Toggle</button>
                </div>
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
    const {removeButton} = useUI();
    const [toggled, setToggled] = useState<boolean>(false);
    const {handleContextMenu, close} = useContextMenu();

    const entry = Object.entries(Icons).find(([name]) => props.type.icon === name);

    return <div onContextMenu={(e) => {
        handleContextMenu(e, <button onClick={() => {
            removeButton(props.type.id);
            close();
        }}>Delete</button>)
    }} className={"btn" + (toggled ? " toggled" : "")} onClick={() => {
        if (props.type.isToggle) {
            if (toggled && props.type.gcode2) {
                for (const line of props.type.gcode2.split("\n")) {
                    sendLine(line);
                }
            } else {
                for (const line of props.type.gcode1.split("\n")) {
                    sendLine(line);
                }
            }
            setToggled(!toggled);
        } else {
            for (const line of props.type.gcode1.split("\n")) {
                sendLine(line);
            }
        }
    }}>
        {entry && (() => {
            const Component = entry[1] as React.ComponentType;
            return <Component/>;
        })()}
        <div>{props.type.text}</div>
    </div>;
}

export default function Sidebar() {
    const portRef = useRef<DropdownRef<PortInfo> | null>(null);
    const baudRef = useRef<DropdownRef<number> | null>(null);

    const {showModal} = useModal();
    const {buttons} = useUI();
    const {handleContextMenu, close} = useContextMenu();

    const {ports, baudrate, selectedPort, refreshPorts, disconnect, connect, setBaudrate, setSelectedPort} = useGRBL();
    const [connected, setConnected] = useState(false);

    const baudrates = [110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200, 128000, 230400, 256000, 460800, 921600]

    useEffect(() => {
        refreshPorts();
    }, [refreshPorts]);

    const handleConnect = () => {
        if (connected) {
            disconnect();
            setConnected(false);
            return;
        }

        const rate = baudRef.current?.selection();
        const port = portRef.current?.selection();

        if (rate && port) {
            setBaudrate(rate);
            setSelectedPort(port.path);

            connect(port.path, rate);
            setConnected(true);
        }
    };

    return <div id={"sidebar"}>
        <div id={"sidebar-port-panel"}>
            <div id={"cnc-settings"}>
                <Dropdown<PortInfo>
                    ref={portRef}
                    icon={<></>}
                    text={selectedPort ?? "Select Port"}
                    id="port"
                >
                    {ports.map(port => (
                        <DropdownButton
                            key={port.path}
                            text={port.name}
                            closeOnClick
                            onClick={() => {
                                portRef.current?.setSelection(port);
                                portRef.current?.setSelectionText(port.name)
                                setSelectedPort(port.path);
                            }}
                        />
                    ))}
                </Dropdown>
                <Dropdown<number> ref={baudRef} icon={<></>} text={baudrate.toString()} id={"baud"}>
                    {baudrates.map((b, i) => {
                        return <DropdownButton
                            key={i}
                            text={b.toString()}
                            closeOnClick
                            onClick={() => {
                                baudRef.current?.setSelection(b);
                                baudRef.current?.setSelectionText(b.toString());
                                setBaudrate(b);
                            }}/>
                    })}
                </Dropdown>
                <button className={"btn"} onClick={() => handleConnect()}>
                    {!connected ? <PiPlugsLight/> : <PiPlugsConnectedLight/>}
                </button>
            </div>
        </div>
        <div id={"sidebar-buttons"} onContextMenu={(e) => {
            handleContextMenu(e,
                <button onClick={() => {
                    showModal(<AddButtonModal/>)
                    close();
                }}>Add Custom Button</button>
            )
        }}>
            {
                buttons.map((button, i) => {
                    return <ButtonEntry key={i} type={button}/>
                })
            }
        </div>
    </div>
}