import React, { useState, useEffect, createContext, useRef, useContext } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
// import { getFirebaseCustomToken, loginWithCustomToken } from './FirebaseHelper';
import { getBungieAuthUrl } from './FirebaseHelper';
import { BUNGIE_APP_ID, BUNGIE_API_KEY, TOKEN_URL } from './Constants';

const alertMessages = [];
export const AppContext = createContext({ alertMessages: [] });

export const useAppContext = () => useContext(AppContext);
const createFormParams = (params) =>
    Object.keys(params)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');

const getToken = async () => {
    return await axios({
        url: TOKEN_URL,
        method: 'post',
        headers: {
            'X-API-Key': BUNGIE_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: createFormParams({
            grant_type: 'authorization_code',
            client_id: BUNGIE_APP_ID,
            code: localStorage.getItem('code'),
        }),
    });
};

const urlParams = new URLSearchParams(window.location.search);
let code = localStorage.getItem('code');
let state;
if (!code) {
    code = urlParams.get('code');
    [state] = decodeURIComponent(urlParams.get('state')).split('|');
}
if (window.location.search !== '') {
    window.history.pushState('d2-bounties', 'd2-bounties', window.location.origin + window.location.pathname);
}

export const AppContextWrapper = (props) => {
    const { darkMode, setDarkMode } = props;
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

    const login = async () => {
        setAppState({
            ...appState,
            loading: true,
        });
        try {
            const { data } = await getBungieAuthUrl();
            window.location = data;
        } catch (e) {
            console.error('Error logging in via Bungie', e);
        }
    };

    const logout = () => {
        localStorage.removeItem('code');
        localStorage.removeItem('access_token');
        setAppState({
            ...appState,
            loggedIn: false,
            loading: false,
        });
    };

    // useEffect(() => {
    //     // TODO: REMOVE THIS
    //     console.log('useEffect');
    //     const test = async () => {
    //         const { data } = await getFirebaseCustomToken('abcdefg123456');
    //         console.log(data);
    //         const res = await loginWithCustomToken(data);
    //         console.log(res);
    //     };
    //     test();
    // }, []);

    useEffect(() => {
        // //////
        // TODO: DEAL WITH STATE HERE
        // //////
        console.log(state);

        if (!code) {
            setAppState({
                ...appState,
                loading: false,
            });
        } else {
            localStorage.setItem('code', code);

            (async () => {
                try {
                    const { data } = await getToken();
                    setAppState({
                        ...appState,
                        access_token: JSON.stringify({ ...data }),
                        loading: false,
                        loggedIn: true,
                    });
                } catch (e) {
                    localStorage.removeItem('code');
                    localStorage.removeItem('access_token');
                    setAppState({
                        ...appState,
                        loading: false,
                    });
                }
            })();
        }
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
                    darkMode,
                    setDarkMode,
                    getSnackPack,
                    login,
                    logout,
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
