import {createContext, useContext, useState} from "react";

type DropdownMenuContextType = {
    current: string|null;
    setCurrent: (current: string|null) => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextType|null>(null);

export function DropdownProvider({ children }: { children: React.ReactNode })  {
    const [current, setCurrent] = useState<string|null>(null);
    return <DropdownMenuContext.Provider value={{current, setCurrent}}>
        {children}
    </DropdownMenuContext.Provider>
}

export function useDropdown() {
    const dd = useContext(DropdownMenuContext);

    if(!dd) {
        throw new Error('useDropdown() cannot be used outside of DropdownProvider');
    }

    return dd;
}