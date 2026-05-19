import {createContext, type ReactElement, useContext, useEffect, useState} from "react";
import type {ButtonType, Theme} from "../types.ts";

export type UIContextType = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    buttons: ButtonType[];
    addButton: (buttonType: ButtonType) => void;
    removeButton: (id: number) => void;
}

const UIContext = createContext<UIContextType | null>(null);

export function UIContextProvider({children}: { children: ReactElement }) {
    const accessTheme = () => {
        try {
            const item = localStorage.getItem("theme");
            return item ? (JSON.parse(item) as Theme) : {name: "light", darkMode: false};
        } catch (error) {
            console.error("Error reading localStorage key:", "theme", error);
            return {name: "light", darkMode: false};
        }
    }
    const accessButtons = () => {
        try {
            const item = localStorage.getItem("buttons");
            return item ? (JSON.parse(item) as ButtonType[]) : [];
        } catch (error) {
            console.error("Error reading localStorage key:", "buttons", error);
            return [];
        }
    }



    const [theme, setStoredTheme] = useState<Theme>(() => {return accessTheme();});
    const [buttons, setStoredButtons] = useState<ButtonType[]>(() => {return accessButtons();});


    const setTheme = (value: Theme) => {
        try {
            const valueToStore =
                value instanceof Function ? value(theme) : value;
            setStoredTheme(valueToStore);
            localStorage.setItem("theme", JSON.stringify(valueToStore));

        } catch (error) {
            console.error("Error setting localStorage key:", "theme", error);
        }
    };
    const setButtons = (value: ButtonType[]) => {
        try {
            const buttonsToStore = value instanceof Function ? value(buttons) : value;
            setStoredButtons(buttonsToStore);
            localStorage.setItem("buttons", JSON.stringify(buttonsToStore));
        } catch (error) {
            console.error("Error setting localStorage key:", "buttons", error);
        }
    };
    const addButton = (buttonType: ButtonType) => {
        setButtons([...buttons, buttonType])
    }
    const removeButton = (id: number) => {
        setButtons(buttons.filter((b) => b.id !== id))
    }


    useEffect(() => {
        document.documentElement.dataset.theme = theme.name;
    }, [theme]);

    return <UIContext.Provider value={{
        theme,
        setTheme,
        buttons,
        addButton,
        removeButton,
    }}>
        <div id={"ui-context"}>
            {children}
        </div>
    </UIContext.Provider>;
}

export function useUI() {
    const ctx = useContext(UIContext);

    if(!ctx) {
        throw new Error("useUI must be used within UIContextProvider");
    }

    return ctx;
}