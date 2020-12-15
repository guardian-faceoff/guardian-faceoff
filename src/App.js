import React from 'react';
import { HashRouter } from 'react-router-dom';
import { createMuiTheme, ThemeProvider, makeStyles } from '@material-ui/core/styles';
import { Box } from '@material-ui/core';
import CssBaseline from '@material-ui/core/CssBaseline';
import { grey, teal } from '@material-ui/core/colors';
import Navigation from './components/Navigation';
import { AppContextWrapper } from './AppContext';
import Routes from './Routes';
import SnackBarManager from './SnackBarManager';

const useStyles = makeStyles((theme) => {
    return {
        box: {
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            maWidth: '100vw',
        },
        container: {
            flex: '1 auto',
            overflow: 'auto',
            marginTop: theme.spacing(),
            marginBottom: theme.spacing(),
        },
    };
});

const App = () => {
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
            <AppContextWrapper>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <Box className={classes.box}>
                        <Box className={classes.navigation}>
                            <Navigation />
                        </Box>
                        <Box className={classes.container}>
                            <Routes />
                            <SnackBarManager />
                        </Box>
                    </Box>
                </ThemeProvider>
            </AppContextWrapper>
        </HashRouter>
    );
};

export default App;
