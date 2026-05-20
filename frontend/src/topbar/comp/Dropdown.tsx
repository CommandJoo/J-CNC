import "./Dropdown.css"
import {useDropdown} from "../../providers/DropdownMenuContext.tsx";
import type {ReactElement} from "react";

type DropdownProps = {
    icon: React.ReactNode;
    text: string;
    id: string;
    children: ReactElement[];
}

export default function Dropdown(props: DropdownProps) {
    const {current, setCurrent} = useDropdown();

    if(current === props.id) {
        return <button id={props.id} className={"topbar-button"}>
            <div id={"dropdown"}>
                {props.children}
            </div>
        </button>
    }

    return <button id={props.id} className={"topbar-button"} onClick={() => {setCurrent(props.id)}}>
        {props.icon}
        {props.text}
    </button>
}