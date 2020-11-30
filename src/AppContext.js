import React, { useState, createContext, useRef, useContext } from 'react';
import PropTypes from 'prop-types';

const alertMessages = [];
export const AppContext = createContext({ alertMessages: [] });

export const useAppContext = () => useContext(AppContext);

export const AppContextWrapper = (props) => {
    const [appState, setAppState] = useState({
        loading: true,
    });
    const appStateRef = useRef();
    appStateRef.current = appState;
    const [snackPack, setSnackPack] = React.useState([]);
    const addSnack = (message, severity) => {
        if (['error', 'warning'].includes(severity)) {
            alertMessages.push({
                ...appState,
                snackBar: {
                    message,
                    severity,
                },
            });
        }
        setSnackPack((prev) => [
            ...prev,
            {
                ...appState,
                snackBar: {
                    message,
                    severity,
                },
            },
        ]);
    };
    const showSuccess = (message) => addSnack(message, 'success');
    const showInfo = (message) => addSnack(message, 'info');
    const showWarning = (message) => addSnack(message, 'warning');
    const showError = (message) => addSnack(message, 'error');

    const getSnackPack = () => {
        return snackPack;
    };

    const { darkMode, setDarkMode } = props;

    return (
        <>
            <AppContext.Provider
                value={{
                    alertMessages,
                    appState,
                    setAppState,
                    snackPack,
                    setSnackPack,
                    showSuccess,
                    showInfo,
                    showWarning,
                    showError,
                    darkMode,
                    setDarkMode,
                    getSnackPack,
                }}
            >
                {props.children}
            </AppContext.Provider>
        </>
    );
};

AppContextWrapper.propTypes = {
    children: PropTypes.node,
    darkMode: PropTypes.bool,
    setDarkMode: PropTypes.func,
};
