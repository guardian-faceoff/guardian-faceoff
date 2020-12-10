import React, { useContext } from 'react';
import { Button, Grid, Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router';
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

const Home = () => {
    const classes = useStyles();
    // const [email, setEmail] = useState('');
    // const [password, setPassword] = useState('');
    const { login } = useContext(AppContext);

    return (
        <Grid container spacing={0} align="center" direction="column" className={classes.grid}>
            <Grid item>
                <Paper className={classes.paper}>
                    {/* <Box align="left" justify="left">
                        <TextField className={classes.input} label="Email" value={email} onChange={(e) => setEmail(e.target.value.trim())} />
                        <TextField className={classes.input} label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value.trim())} />
                    </Box> */}
                    <Button className={classes.button} size="large" color="secondary" variant="contained" onClick={() => login()}>
                        Login
                    </Button>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default withRouter(Home);
