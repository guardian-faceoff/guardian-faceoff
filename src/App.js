import React, { useState, useEffect } from "react";
// import { VERSION, DEFAULT_STATE, BUNGIE_APP_ID, API_KEY, TOKEN_URL, AUTHORIZE_URL, LOCATIONS, ACTIVITIES, WEAPONS, ELEMENTS, ENEMIES, ALL_KEYS } from './Constants';
import {
    HashRouter,
    Route,
    Redirect,
    Switch
} from "react-router-dom";
import { Button, LinearProgress, Grid, Paper, Typography } from '@material-ui/core';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { makeStyles } from '@material-ui/core/styles';


// const createFormParams = (params) => Object.keys(params).map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&');

// const getToken = async () => {
//     return await axios({
//         url: TOKEN_URL,
//         method: 'post',
//         headers: {
//             'X-API-Key': API_KEY,
//             'Content-Type': 'application/x-www-form-urlencoded'
//         },
//         data: createFormParams({
//             grant_type: 'authorization_code',
//             client_id: BUNGIE_APP_ID,
//             code: localStorage.getItem('code')
//         })
//     })
// };

// const urlParams = new URLSearchParams(window.location.search);
// let code = localStorage.getItem('code');
// if(!code){
//     code = urlParams.get('code');
// };
// if(window.location.search !== ""){
//     window.history.pushState('d2-bounties', 'd2-bounties', window.location.origin + window.location.pathname);
// }

const useStyles = makeStyles((theme) => {
    return {
        grid: {
            height: '100vh'
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
            margin: theme.spacing(4)
        }
    };
});

const App = () => {
    const classes = useStyles();
    // const [ state, setState ] = useState({ ...DEFAULT_STATE, loggedIn: false });
    const [ state, setState ] = useState({ loading: false, loggedIn: false });


    const theme = React.useMemo(() => {
        return createMuiTheme({
            shape: {
                borderRadius: 10,
            }, 
            palette: {
                type: 'dark',
            },
        });
    }, []);

    // const login = () => { 
    //     window.location = AUTHORIZE_URL;
    // };

    // const logout = () => {
    //     localStorage.removeItem('code');
    //     localStorage.removeItem('access_token');
    //     setState({
    //         ...state,
    //         loggedIn: false,
    //         loading: false
    //     });
    // };

    // useEffect(() => {
    //     if(!code) {
    //         setState({
    //             ...state,
    //             loading: false
    //         });
    //     } else {
    //         localStorage.setItem('code', code);
    //         (async () => {
    //             try {
    //                 if(!localStorage.getItem('access_token')){
    //                     const { data } = await getToken();
    //                     localStorage.setItem('access_token', JSON.stringify({ ...data }));
    //                 }
    //                 setState({
    //                     ...state,
    //                     loading: false,
    //                     loggedIn: true
    //                 });
    //             } catch (e) {
    //                 console.dir(e);
    //                 localStorage.removeItem('code');
    //                 localStorage.removeItem('access_token');
    //                 setState({
    //                     ...state,
    //                     loading: false
    //                 });
    //                 return;
    //             }
    //         })();
    //     }
    // }, []);

    const getContentJsx = () => {
        if(state.loading){
            return <LinearProgress variant="determinate" value={10}/>;
        } else {
            if (state.loggedIn) {
                return <ListView logout={logout}></ListView>;
            } else {
                return (
                    <Grid
                        container
                        spacing={0}
                        align="center"
                        justify="center"
                        direction="column"
                        className={classes.grid}
                    >
                        <Grid item>
                            <Paper className={classes.paper}>
                                <Typography variant="h2">Guardian Faceoff</Typography>
                                <Button className={classes.button} size="large" color="primary" variant="contained" onClick={() => login()}>Login</Button>
                                {/* <Typography variant="body2">d2-bounties requires you securely authenticate with Bungie.net every 30 minutes</Typography> */}
                            </Paper>
                        </Grid>
                    </Grid>
                )
            }
        }  
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <HashRouter>
                <Switch>
                    <Route exact path={"/"}>
                        { getContentJsx() }
                    </Route>
                    <Redirect to='/' />
                </Switch>
            </HashRouter>
        </ThemeProvider>
    );
};

export default App;