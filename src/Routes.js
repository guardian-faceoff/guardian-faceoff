import React, { useContext, useEffect } from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
import firebase from 'firebase/app';
import { Box } from '@material-ui/core';
import Home from './components/Home';
import Login from './components/Login';
import SignUp from './components/SignUp';
import { AppContext } from './AppContext';

const App = () => {
    const { appState, setAppState } = useContext(AppContext);

    useEffect(() => {
        firebase.auth().onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setAppState({
                    ...appState,
                    currentUser,
                    loading: false,
                });
            } else {
                setAppState({
                    ...appState,
                    currentUser: undefined,
                    loading: false,
                });
            }
        });
    }, []);

    if (appState.loading) {
        return <Box>Loading...</Box>;
    }
    return (
        <>
            {/* {JSON.stringify(appState)} */}
            <Switch>
                <Route exact path="/">
                    <Home />
                </Route>
                <Route exact path="/login">
                    <Login />
                </Route>
                <Route exact path="/signup">
                    <SignUp />
                </Route>
                <Redirect to="/" />
            </Switch>
        </>
    );
};

export default App;
