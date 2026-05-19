import "./Topbar.css"
import {IoFileTray, IoSettings, IoLanguage, IoHelpCircleSharp} from "react-icons/io5";
import {IoMdMoon} from "react-icons/io";
import Dropdown from "./comp/Dropdown.tsx";
import DropdownButton from "./comp/DropdownButton.tsx";
import {useGRBL} from "../providers/GRBLContext.tsx";
import {useRef, useState} from "react";
import type {SvgConverter} from "../types.ts";

export default function Topbar() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [text] = useState("")
    const {setTheme, sendLine} = useGRBL();

    return <div id={"topbar"}>
        <input onChange={async (e) => {
            if(!e.target.files) return;
            const file = e.target.files[0];
            if(!file) return;


            const text = await file.text();

            if ("svg_converter" in window) {
                const converter = (window.svg_converter) as SvgConverter;
                const converted = converter.convert(text);
                converted.split("\n").forEach((line) => {
                    sendLine(line);
                })
            }

        }} type="file" ref={fileInputRef} style={{display: "none"}}/>

        <Dropdown icon={<IoFileTray className="icon" size={20}/>} text={"File"} id={"file"}>
            <DropdownButton text={"Open File"} onClick={() => {
                if(!fileInputRef.current) return;
                fileInputRef.current.click();
                // showModal(<div></div>)
            }} closeOnClick/>
            <DropdownButton text={"Reopen File"}/>
            <DropdownButton text={"Exit"}/>
        </Dropdown>
        <Dropdown icon={<IoSettings className="icon" size={20}/>} text={"Settings"} id={"settings"}>
            <DropdownButton text={"Opt A"}/>
            <DropdownButton text={"Opt B"}/>
            <DropdownButton text={"Opt C"}/>
        </Dropdown>
        <Dropdown icon={<IoMdMoon className={"icon"} size={20}/>} text={"Themes"} id={"themes"}>
            <DropdownButton text={"Dark"} closeOnClick={true} onClick={() => {
                setTheme({name: "dark", darkMode: true});
            }}/>
            <DropdownButton text={"Light"} closeOnClick={true} onClick={() => {
                setTheme({name: "light", darkMode: false});
            }}/>
            <DropdownButton text={"Dracula"} closeOnClick={true} onClick={() => {
                setTheme({name: "dracula", darkMode: true});
            }}/>
            <DropdownButton text={"Monokai"} closeOnClick={true} onClick={() => {
                setTheme({name: "monokai", darkMode: true});
            }}/>
        </Dropdown>
        <Dropdown icon={<IoLanguage className="icon" size={20}/>} text={"Language"} id={"language"}>
            <DropdownButton text={"Opt A"}/>
            <DropdownButton text={"Opt B"}/>
            <DropdownButton text={"Opt C"}/>
        </Dropdown>
        <Dropdown icon={<IoHelpCircleSharp className="icon" size={20}/>} text={"Help"} id={"help"}>
            <DropdownButton text={"Opt A"}/>
            <DropdownButton text={"Opt B"}/>
            <DropdownButton text={"Opt C"}/>
        </Dropdown>
        <div>
            {text}
        </div>
    </div>
}