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
    // Default mock user for initial load if needed, or null
    const [currentUser, setCurrentUser] = useState({
        id: 'mock-admin-id',
        name: 'Tychique Esteve',
        email: 'tychique.estevepro@gmail.com',
        role: 'Admin',
        avatar: null
    });
    const [currentRole, setCurrentRole] = useState('Admin'); // Keep for backward compat
    const [activeModal, setActiveModal] = useState(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Sync role when user changes
    const setUser = (user) => {
        setCurrentUser(user);
        if (user?.role) {
            setCurrentRole(user.role.charAt(0).toUpperCase() + user.role.slice(1)); // Title case
        }
    };

    return (
        <RoleContext.Provider value={{ currentRole, setCurrentRole, currentUser, setCurrentUser: setUser }}>
            <ModalContext.Provider value={{ activeModal, setActiveModal }}>
                <SidebarContext.Provider value={{ isSidebarCollapsed, setIsSidebarCollapsed }}>
                    {children}
                </SidebarContext.Provider>
            </ModalContext.Provider>
        </RoleContext.Provider>
    );
}
