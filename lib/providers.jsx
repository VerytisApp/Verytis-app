'use client';

import { createContext, useContext, useState } from 'react';

const RoleContext = createContext();
const ModalContext = createContext();
const SidebarContext = createContext();

export function useRole() {
    return useContext(RoleContext);
}

export function useModal() {
    return useContext(ModalContext);
}

export function useSidebar() {
    return useContext(SidebarContext);
}

export function Providers({ children }) {
    const [currentRole, setCurrentRole] = useState('Admin');
    const [activeModal, setActiveModal] = useState(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <RoleContext.Provider value={{ currentRole, setCurrentRole }}>
            <ModalContext.Provider value={{ activeModal, setActiveModal }}>
                <SidebarContext.Provider value={{ isSidebarCollapsed, setIsSidebarCollapsed }}>
                    {children}
                </SidebarContext.Provider>
            </ModalContext.Provider>
        </RoleContext.Provider>
    );
}
