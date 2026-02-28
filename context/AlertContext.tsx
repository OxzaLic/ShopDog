import React, { createContext, useContext, useState } from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'confirm' | 'info';

interface AlertOptions {
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface AlertState {
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    options?: AlertOptions;
}

interface AlertContextType {
    showAlert: (title: string, message: string, type?: AlertType, options?: AlertOptions) => void;
    hideAlert: () => void;
    alertState: AlertState;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [alertState, setAlertState] = useState<AlertState>({
        visible: false,
        title: '',
        message: '',
        type: 'info',
    });

    const showAlert = (title: string, message: string, type: AlertType = 'info', options?: AlertOptions) => {
        setAlertState({
            visible: true,
            title,
            message,
            type,
            options,
        });
    };

    const hideAlert = () => {
        setAlertState(prev => ({ ...prev, visible: false }));
    };

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert, alertState }}>
            {children}
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};
