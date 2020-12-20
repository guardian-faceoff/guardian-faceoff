import React, { useState, useEffect, createContext, useRef, useContext } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import { getBungieAuthUrl, loginWithCustomToken, onAuthStateChanged, refreshLogin, logoutOfFirebase } from './FirebaseHelper';

const { VERSION, BUNGIE_APP_ID, BUNGIE_API_KEY } = window.RESOURCES;

const alertMessages = [];
export const AppContext = createContext({ alertMessages: [] });

export const useAppContext = () => useContext(AppContext);

const urlParams = new URLSearchParams(window.location.search);
let loginToken = urlParams.get('login_token') && decodeURIComponent(urlParams.get('login_token'));
console.log('window.location.search', window.location.search);
console.log('loginToken', loginToken);
const error = urlParams.get('error') && decodeURIComponent(urlParams.get('error'));

if (window.location.search !== '') {
    window.history.pushState('d2-bounties', 'd2-bounties', window.location.origin + window.location.pathname);
}

const AppContextWrapper = withRouter(({ children, history }) => {
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

    const logout = async () => {
        loginToken = undefined;
        logoutOfFirebase();
    };

    const login = async () => {
        setAppState({
            ...appState,
            loading: true,
        });
        try {
            const { data } = await getBungieAuthUrl();
            window.location = data;
        } catch (e) {
            setAppState({
                ...appState,
                loading: false,
            });
            showError('Error logging in. Please try again later.');
        }
    };

    useEffect(() => {
        if (error) {
            showError(error);
        }
        return onAuthStateChanged(async (user) => {
            if (user) {
                console.log('User is logged in');
                try {
                    await refreshLogin();
                    setAppState({
                        ...appState,
                        loading: false,
                    });
                } catch (e) {
                    logout();
                    setAppState({
                        ...appState,
                        loading: false,
                    });
                    history.push('/');
                    showError('Please login.');
                }
            } else {
                console.log('No User logged in');
                if (loginToken) {
                    try {
                        await loginWithCustomToken(loginToken);
                        setAppState({
                            ...appState,
                            loading: false,
                        });
                    } catch (e) {
                        logout();
                        setAppState({
                            ...appState,
                            loading: false,
                        });
                        showError('Error logging in. Please try again.');
                    }
                } else {
                    setAppState({
                        ...appState,
                        loading: false,
                    });
                }
            }
        });
    }, []);

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
                    getSnackPack,
                    login,
                    logout,
                    VERSION,
                    BUNGIE_APP_ID,
                    BUNGIE_API_KEY,
                }}
            >
                {children}
            </AppContext.Provider>
        </>
    );
});

AppContextWrapper.propTypes = {
    children: PropTypes.node,
    history: PropTypes.object,
};

export { AppContextWrapper };
