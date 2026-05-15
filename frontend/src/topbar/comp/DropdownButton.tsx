import "./DropdownButton.css"
import {useDropdown} from "./DropdownMenuContext.tsx";

type DropdownButtonProps = {
    text: string;
    onClick?: (e: React.MouseEvent) => void;
    closeOnClick?: boolean;
}

export default function DropdownButton(props: DropdownButtonProps) {
    const {setCurrent} = useDropdown();

    return <div className={"dropdown-button"} onClick={(e: React.MouseEvent) => {
        if(props.onClick) {
            props.onClick(e);
        }
        if(props.closeOnClick) {
            setCurrent(null);
        }
    }}>
        {props.text}
    </div>
}