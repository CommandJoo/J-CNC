import "./Topbar.css";
import {IoFileTray, IoSettings, IoLanguage, IoHelpCircleSharp} from "react-icons/io5";
import {IoMdMoon} from "react-icons/io";
import {Dropdown} from "./comp/Dropdown.tsx";
import DropdownButton from "./comp/DropdownButton.tsx";
import {useGRBL} from "../providers/GRBLContext.tsx";
import {useRef} from "react";
import {useUI} from "../providers/UIContext.tsx";

export default function Topbar() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {cnc, loadGCode} = useGRBL();
    const {setTheme} = useUI();

    return (
        <div id="topbar">
            <input
                type="file"
                ref={fileInputRef}
                style={{display: "none"}}
                accept=".gcode,.nc,.cnc,.tap,.svg"
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const text = await file.text();
                    const name = file.name.toLowerCase();

                    if (name.endsWith(".svg")) {
                        const converter = cnc?.converter();

                        if (!converter) {
                            console.warn("SVG converter not available");
                            return;
                        }

                        const gcode = converter.convert(text);
                        loadGCode(gcode);
                    } else {
                        loadGCode(text);
                    }

                    e.currentTarget.value = "";
                }}
            />

            <Dropdown icon={<IoFileTray className="icon" size={20}/>} text="File" id="file">
                <DropdownButton
                    text="Open File"
                    onClick={() => fileInputRef.current?.click()}
                    closeOnClick
                />
                <DropdownButton text="Reopen File"/>
                <DropdownButton text="Exit"/>
            </Dropdown>

            <Dropdown icon={<IoSettings className="icon" size={20}/>} text="Settings" id="settings">
                <DropdownButton text="Opt A"/>
                <DropdownButton text="Opt B"/>
                <DropdownButton text="Opt C"/>
            </Dropdown>

            <Dropdown icon={<IoMdMoon className="icon" size={20}/>} text="Themes" id="themes">
                <DropdownButton text="Dark" closeOnClick onClick={() => setTheme({name: "dark", darkMode: true})}/>
                <DropdownButton text="Light" closeOnClick onClick={() => setTheme({name: "light", darkMode: false})}/>
                <DropdownButton text="Dracula" closeOnClick
                                onClick={() => setTheme({name: "dracula", darkMode: true})}/>
                <DropdownButton text="Monokai" closeOnClick
                                onClick={() => setTheme({name: "monokai", darkMode: true})}/>
            </Dropdown>

            <Dropdown icon={<IoLanguage className="icon" size={20}/>} text="Language" id="language">
                <DropdownButton text="Opt A"/>
                <DropdownButton text="Opt B"/>
                <DropdownButton text="Opt C"/>
            </Dropdown>

            <Dropdown icon={<IoHelpCircleSharp className="icon" size={20}/>} text="Help" id="help">
                <DropdownButton text="Opt A"/>
                <DropdownButton text="Opt B"/>
                <DropdownButton text="Opt C"/>
            </Dropdown>
        </div>
    );
}