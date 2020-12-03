import React, { useState, useContext } from 'react';
import { Button, Grid, Paper, TextField, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
import { loginWithEmail, registerWithEmail } from '../FirebaseHelper';
import { AppContext } from '../AppContext';

const useStyles = makeStyles((theme) => {
    return {
        grid: {
            height: '100vh',
        },
        paper: {
            width: '37em',
            padding: theme.spacing(4),
            margin: theme.spacing(2),
            [theme.breakpoints.down('xs')]: {
                width: `calc(100% - ${theme.spacing(4)}px)`,
            },
        },
        button: {
            marginTop: theme.spacing(4),
            marginBottom: theme.spacing(2),
        },
        input: {
            width: `calc(100% - ${theme.spacing(2)}px)`,
            margin: theme.spacing(),
        },
    };
});

const Login = ({ history }) => {
    const classes = useStyles();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { appState, setAppState, showError } = useContext(AppContext);

    const login = async () => {
        setAppState({
            ...appState,
            loading: true,
        });
        try {
            await loginWithEmail(email, password);
            history.push('/');
        } catch (e) {
            if (e.code === 'auth/user-not-found') {
                try {
                    await registerWithEmail(email, password);
                    history.push('/');
                } catch (e2) {
                    showError(e2.message || 'Error registering');
                }
            } else {
                showError(e.message || 'Error logging in');
            }
            setAppState({
                ...appState,
                loading: false,
            });
        }
    };

    return (
        <Grid
            container
            spacing={0}
            align="center"
            direction="column"
            className={classes.grid}
        >
            <Grid item>
                <Paper className={classes.paper}>
                    <Box align="left" justify="left">
                        <TextField
                            className={classes.input}
                            label="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value.trim())}
                        />
                        <TextField
                            className={classes.input}
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value.trim())}
                        />
                    </Box>
                    <Button
                        className={classes.button}
                        size="large"
                        color="secondary"
                        variant="contained"
                        onClick={() => login()}
                    >
                        Sign Up
                    </Button>
                </Paper>
            </Grid>
        </Grid>
    );
};

Login.propTypes = {
    history: PropTypes.object,
};

export default withRouter(Login);
