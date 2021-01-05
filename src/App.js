import React from 'react';
import { HashRouter } from 'react-router-dom';
import { createMuiTheme, ThemeProvider, makeStyles } from '@material-ui/core/styles';
import { Box, Toolbar, Typography } from '@material-ui/core';
import CssBaseline from '@material-ui/core/CssBaseline';
import { grey, teal } from '@material-ui/core/colors';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import Navigation from './components/Navigation';
import { AppContextWrapper } from './AppContext';
import Routes from './Routes';
import SnackBarManager from './SnackBarManager';
// import { getCurrentUser } from './FirebaseHelper';

const useStyles = makeStyles((theme) => {
    return {
        box: {
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '100vw',
        },
        boxSmall: {
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '100vw',
            marginLeft: 225,
        },
        container: {
            flex: '1 auto',
            overflow: 'auto',
            paddingTop: theme.spacing(),
            paddingBottom: theme.spacing(),
        },
        version: {
            position: 'fixed',
            left: 0,
            bottom: 0,
            paddingLeft: theme.spacing(),
            paddingRight: theme.spacing(),
            zIndex: 99999,
            background: theme.palette.secondary.main,
            color: theme.palette.secondary.contrastText,
        },
    };
});

const App = () => {
    const matches = useMediaQuery('(min-width:960px)');
    const classes = useStyles();

    const theme = React.useMemo(() => {
        return createMuiTheme({
            palette: {
                type: 'dark',
                primary: grey,
                secondary: teal,
            },
            typography: {
                fontFamily: '"Inter", sans-serif',
            },
            shape: {
                borderRadius: 0,
            },
        });
    }, []);

    return (
        <HashRouter>
            <AppContextWrapper
                renderContent={(currentUser) => {
                    return (
                        <ThemeProvider theme={theme}>
                            <CssBaseline />
                            <Navigation />
                            <Toolbar />
                            <Box className={matches && currentUser ? classes.boxSmall : classes.box}>
                                <Box className={classes.container}>
                                    <Routes />
                                    <SnackBarManager />
                                </Box>
                            </Box>
                            <Box className={classes.version}>
                                <Typography variant="overline">PRE-ALPHA</Typography>
                            </Box>
                        </ThemeProvider>
                    );
                }}
            />
        </HashRouter>
    );
};

export default App;
