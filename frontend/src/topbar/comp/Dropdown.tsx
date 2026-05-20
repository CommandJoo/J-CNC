import "./Dropdown.css";
import { useDropdown } from "../../providers/DropdownMenuContext.tsx";
import {
    forwardRef,
    type ReactElement,
    useImperativeHandle,
    useState,
} from "react";

type DropdownProps = {
    icon: React.ReactNode;
    text: string;
    id: string;
    children: ReactElement[];
};

export type DropdownRef<T> = {
    isOpen: () => boolean;
    selection: () => T | null;
    setSelection: (value: T | null) => void;
    setSelectionText: (txt: string) => void;
};

export const Dropdown = forwardRef(function Dropdown<T>(
    props: DropdownProps,
    ref: React.Ref<DropdownRef<T>>
) {
    const { current, setCurrent } = useDropdown();
    const [selected, setSelected] = useState<T | null>(null);
    const [selectionText, setSelectionText] = useState(props.text);

    const opened = current === props.id;

    useImperativeHandle(ref, () => ({
        isOpen: () => opened,
        selection: () => selected,
        setSelection: (value) => setSelected(value),
        setSelectionText: (txt: string) => setSelectionText(txt)
    }), [opened, selected]);

    if (opened) {
        return (
            <button id={props.id} className="topbar-button">
                <div id="dropdown">
                    {props.children}
                </div>
            </button>
        );
    }

    return (
        <button
            id={props.id}
            className="topbar-button"
            onClick={() => setCurrent(props.id)}
        >
            {props.icon}
            {selectionText}
        </button>
    );
}) as <T>(
    props: DropdownProps & { ref?: React.Ref<DropdownRef<T>> }
) => ReactElement;