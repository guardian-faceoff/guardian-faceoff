import React, { useContext, useEffect, useState } from 'react';
import { Grid, Paper, Box, CircularProgress, Typography, TableContainer, Table, TableCell, TableRow, TableBody, TableHead } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { AppContext } from '../AppContext';
import { getCurrentUser, getAllUserStatsData } from '../FirebaseHelper';

// import Constants from '../Constants.json';

const useStyles = makeStyles((theme) => {
    return {
        gridItem: {
            maxWidth: '100%',
        },
        title: {
            marginTop: theme.spacing(2),
            marginBottom: theme.spacing(2),
        },
        paper: {
            padding: theme.spacing(4),
            margin: theme.spacing(2),
            textAlign: 'left',
            [theme.breakpoints.down('xs')]: {
                width: `calc(100% - ${theme.spacing(4)}px)`,
            },
        },
        table: {
            marginTop: theme.spacing(),
            background: theme.palette.primary.dark,
            color: theme.palette.primary.contrastText,
        },
        wrapIcon: {
            verticalAlign: 'middle',
            display: 'inline-flex',
            horizontalAlign: 'middle',
        },
        rankColumn: {
            maxWidth: 10,
        },
    };
});

const Leaderboard = ({ history }) => {
    const classes = useStyles();
    const matches = useMediaQuery('(min-width:960px)');
    const [leaderboardState, setLeaderboardState] = useState();
    const [leaderboardloading, setLeaderboardloading] = useState(true);
    const { showError } = useContext(AppContext);

    const getLeaderboardData = async () => {
        try {
            const usersData = await getAllUserStatsData('kills');
            setLeaderboardState(usersData);
        } catch (e) {
            console.error(e);
            showError('Error getting leaderboard stats data.');
        }
        setLeaderboardloading(false);
    };

    useEffect(() => {
        if (getCurrentUser()) {
            getLeaderboardData();
        } else {
            history.push('/');
            showError('Please login.');
        }
    }, []);

    const renderTable = () => {
        return (
            <TableContainer component={Paper}>
                <Table className={classes.table} size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell className={classes.rankColumn} />
                            <TableCell align="center">Player</TableCell>
                            <TableCell align="center">Wins</TableCell>
                            <TableCell align="center">Losses</TableCell>
                            <TableCell align="center">Ties</TableCell>
                            <TableCell align="center">Kills</TableCell>
                            <TableCell align="center">Deaths</TableCell>
                            <TableCell align="center">Assists</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {leaderboardState.map((row, i) => (
                            <TableRow key={row.playerId}>
                                <TableCell className={classes.rankColumn} align="center">{`${i + 1}`}</TableCell>
                                <TableCell component="th" scope="row">
                                    <Typography variant="subtitle1" className={classes.wrapIcon}>
                                        {row.displayName}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">{row.wins ? row.wins : '0'}</TableCell>
                                <TableCell align="center">{row.losses ? row.losses : '0'}</TableCell>
                                <TableCell align="center">{row.ties ? row.ties : '0'}</TableCell>
                                <TableCell align="center">{row.kills ? row.kills : '0'}</TableCell>
                                <TableCell align="center">{row.deaths ? row.deaths : '0'}</TableCell>
                                <TableCell align="center">{row.assists ? row.assists : '0'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    // const renderCards = () => {
    //     return leaderboardState.map((row, i) => {
    //         return (
    //             <Paper className={classes.paper} key={row.playerId}>
    //                 <Box>
    //                     <Typography variant="h5" className={classes.wrapIcon}>
    //                         {`${i + 1} ${row.displayName}`}
    //                     </Typography>
    //                 </Box>
    //                 <Box>{`Wins: ${row.wins ? row.wins : '0'}`}</Box>
    //                 <Box>{`Losses: ${row.losses ? row.losses : '0'}`}</Box>
    //                 <Box>{`Ties: ${row.ties ? row.ties : '0'}`}</Box>
    //                 <Box>{`Kills: ${row.kills ? row.kills : '0'}`}</Box>
    //                 <Box>{`Deaths: ${row.deaths ? row.deaths : '0'}`}</Box>
    //                 <Box>{`Assists: ${row.assists ? row.assists : '0'}`}</Box>
    //             </Paper>
    //         );
    //     });
    // };

    return (
        <Grid container spacing={0} align="center" direction="column" className={classes.grid}>
            <Grid item className={classes.gridItem}>
                <Typography className={classes.title} variant="h4">
                    Leaderboard
                </Typography>

                {!leaderboardloading && getCurrentUser() && leaderboardState && matches && renderTable()}
                {!leaderboardloading && getCurrentUser() && leaderboardState && !matches && renderTable()}
                {leaderboardloading && (
                    <Box>
                        <CircularProgress color="secondary" />
                    </Box>
                )}
            </Grid>
        </Grid>
    );
};

Leaderboard.propTypes = {
    history: PropTypes.object,
};

export default withRouter(Leaderboard);
