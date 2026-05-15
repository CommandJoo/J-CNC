import {createContext, type ReactElement, useCallback, useContext, useState} from "react";

export type ModalContextType = {
    showModal: (modal: ReactElement) => void;
    close: () => void;
    isOpen: boolean;
}

const ModalContext = createContext<ModalContextType|null>(null);

export function ModalProvider({children}: {children: ReactElement}) {
    const [modal, setModal] = useState<ReactElement|null>();
    const showModal = useCallback((element: ReactElement) => {
        setModal(element);
    }, [])
    const close = useCallback(() => setModal(null), []);

    return <ModalContext.Provider value={{showModal, close, isOpen: modal != null}}>
        <dialog id={"modal"} open={modal != null}>
            {modal}
        </dialog>
        {children}
    </ModalContext.Provider>
}

export const useModal = () => {
    const modal = useContext(ModalContext);

    if(!modal) {
        throw new Error("useModal() should only be used within ModalProvider");
    }

    return modal;
};