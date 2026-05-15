import "./Sidebar.css"
import * as IoIcons from "react-icons/io";
import * as Io5Icons from "react-icons/io5";
import Dropdown from "../topbar/comp/Dropdown.tsx";
import DropdownButton from "../topbar/comp/DropdownButton.tsx";

const Icons = {
    ...IoIcons,
    ...Io5Icons
}

export default function Sidebar() {
    return <div id={"sidebar"}>
        <div id={"sidebar-port-panel"}>
            <Dropdown icon={<></>} text={"Port"} id={"port"}>
                <DropdownButton text={"Port 1"} closeOnClick={true}/>
                <DropdownButton text={"Port 2"} closeOnClick={true}/>
            </Dropdown>
        </div>
        <div id={"sidebar-buttons"}>
            {
                Object.entries(Icons).map(([name, Icon], i) => {
                    const Component = Icon;

                    return <div key={i} className={"btn"}>
                        <Component />
                        <div>{name}</div>
                    </div>;
                })
            }
        </div>
    </div>
}