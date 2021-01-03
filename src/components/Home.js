import React, { useContext } from 'react';
import { Button, Grid, Paper, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router';
import { AppContext } from '../AppContext';
import { getCurrentUser } from '../FirebaseHelper';

const useStyles = makeStyles((theme) => {
    return {
        grid: {},
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

const Home = () => {
    const classes = useStyles();
    const { login } = useContext(AppContext);

    return (
        <Grid container spacing={0} align="center" direction="column" className={classes.grid}>
            <Grid item>
                <Paper className={classes.paper}>
                    {!getCurrentUser() && (
                        <Button className={classes.button} size="large" color="secondary" variant="contained" onClick={() => login()}>
                            Login
                        </Button>
                    )}
                    {getCurrentUser() && (
                        <Box>
                            <Box>{`Welcome back ${getCurrentUser().displayName}!`}</Box>
                        </Box>
                    )}
                </Paper>
            </Grid>
        </Grid>
    );
};

export default withRouter(Home);
