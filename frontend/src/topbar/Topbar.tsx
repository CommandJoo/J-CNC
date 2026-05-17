import "./Topbar.css"
import {IoFileTray, IoSettings, IoLanguage, IoHelpCircleSharp} from "react-icons/io5";
import {IoMdMoon} from "react-icons/io";
import Dropdown from "./comp/Dropdown.tsx";
import DropdownButton from "./comp/DropdownButton.tsx";
import {useGRBL} from "../providers/GRBLContext.tsx";
import {useModal} from "../providers/ModalContext.tsx";

export default function Topbar() {
    const {setTheme} = useGRBL();
    const {showModal} = useModal();

    return <div id={"topbar"}>
        <Dropdown icon={<IoFileTray className="icon" size={20}/>} text={"File"} id={"file"}>
            <DropdownButton text={"Opt A"} onClick={() => {
                showModal(<div>Hello World</div>)
            }} closeOnClick/>
            <DropdownButton text={"Opt B"}/>
            <DropdownButton text={"Opt C"}/>
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
    </div>
}