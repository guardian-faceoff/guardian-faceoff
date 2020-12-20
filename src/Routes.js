import React, { useContext } from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
import { Typography, LinearProgress, Container } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Home from './components/Home';
import Profile from './components/Profile';
import Matches from './components/Matches';
import CompletedMatches from './components/CompletedMatches';
import { AppContext } from './AppContext';

const useStyles = makeStyles((theme) => ({
    progressBar: {
        marginBottom: theme.spacing(),
    },
    loading: {
        textAlign: 'center',
        margin: theme.spacing(2),
    },
}));

const App = () => {
    const classes = useStyles();
    const { appState } = useContext(AppContext);

    if (appState.loading) {
        return (
            <>
                <LinearProgress className={classes.progressBar} color="secondary" />
                <Container>
                    <Typography className={classes.loading} variant="h4">
                        Loading...
                    </Typography>
                </Container>
            </>
        );
    }
    return (
        <>
            {/* {JSON.stringify(appState)} */}
            <Container>
                <Switch>
                    <Route exact path="/">
                        <Home />
                    </Route>
                    <Route exact path="/home">
                        <Home />
                    </Route>
                    <Route exact path="/profile">
                        <Profile />
                    </Route>
                    <Route exact path="/matches">
                        <Matches />
                    </Route>
                    <Route exact path="/completedMatches">
                        <CompletedMatches />
                    </Route>
                    <Redirect to="/" />
                </Switch>
            </Container>
        </>
    );
};
export default App;
