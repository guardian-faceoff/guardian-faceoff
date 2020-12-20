import React, { useContext } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Menu, MenuItem, Badge, Button, Box } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import MenuIcon from '@material-ui/icons/Menu';
// import SearchIcon from '@material-ui/icons/Search';
// import AccountCircle from '@material-ui/icons/AccountCircle';
import NotificationsIcon from '@material-ui/icons/Notifications';
// import MoreIcon from '@material-ui/icons/MoreVert';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
import { getCurrentUser } from '../FirebaseHelper';
import { AppContext } from '../AppContext';

const useStyles = makeStyles((theme) => ({
    grow: {
        flexGrow: 1,
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    title: {
        fontWeight: 'bold',
        display: 'block',
        cursor: 'pointer',
    },
    search: {
        position: 'relative',
        borderRadius: theme.shape.borderRadius,
        backgroundColor: fade(theme.palette.common.white, 0.15),
        '&:hover': {
            backgroundColor: fade(theme.palette.common.white, 0.25),
        },
        marginRight: theme.spacing(2),
        marginLeft: 0,
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            marginLeft: theme.spacing(3),
            width: 'auto',
        },
    },
    searchIcon: {
        padding: theme.spacing(0, 2),
        height: '100%',
        position: 'absolute',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputRoot: {
        color: 'inherit',
    },
    inputInput: {
        padding: theme.spacing(1, 1, 1, 0),
        // vertical padding + font size from searchIcon
        paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            width: '20ch',
        },
    },
    sectionDesktop: {
        display: 'none',
        [theme.breakpoints.up('sm')]: {
            display: 'flex',
        },
    },
    sectionMobile: {
        display: 'flex',
        [theme.breakpoints.up('sm')]: {
            display: 'none',
        },
    },
    navButton: {
        marginLeft: theme.spacing(),
    },
}));

const Navigation = ({ history }) => {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const { login, logout, appState } = useContext(AppContext);

    const isMenuOpen = Boolean(anchorEl);

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const logUserOut = async () => {
        await logout();
        history.push('/');
    };

    const menuId = 'primary-search-account-menu';
    const renderMenu = (
        <Menu
            anchorEl={anchorEl}
            id={menuId}
            keepMounted
            open={isMenuOpen}
            onClose={handleMenuClose}
            getContentAnchorEl={null}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
            <MenuItem
                onClick={() => {
                    history.push('/');
                    handleMenuClose();
                }}
            >
                Home
            </MenuItem>
            {!getCurrentUser() && (
                <MenuItem
                    onClick={() => {
                        login();
                        handleMenuClose();
                    }}
                >
                    Login
                </MenuItem>
            )}
            {getCurrentUser() && (
                <MenuItem
                    onClick={() => {
                        history.push('/matches');
                        handleMenuClose();
                    }}
                >
                    Matches
                </MenuItem>
            )}
            {getCurrentUser() && (
                <MenuItem
                    onClick={() => {
                        history.push('/completedMatches');
                        handleMenuClose();
                    }}
                >
                    Completed Matches
                </MenuItem>
            )}
            {getCurrentUser() && (
                <MenuItem
                    onClick={() => {
                        history.push('/profile');
                        handleMenuClose();
                    }}
                >
                    Profile
                </MenuItem>
            )}
            {getCurrentUser() && (
                <MenuItem
                    onClick={() => {
                        logUserOut();
                        handleMenuClose();
                    }}
                >
                    Log Out
                </MenuItem>
            )}
        </Menu>
    );

    const getNavbarControls = () => {
        if (!getCurrentUser()) {
            if (!appState.loading) {
                return (
                    <Button
                        onClick={() => {
                            login();
                        }}
                        color="secondary"
                        variant="contained"
                        className={classes.navButton}
                    >
                        Login
                    </Button>
                );
            }
            return <Box />;
        }
        return (
            <>
                <IconButton aria-label="show 2 new notifications" color="inherit">
                    <Badge badgeContent={2} color="error">
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
                <IconButton edge="end" aria-label="account of current user" aria-controls={menuId} aria-haspopup="true" onClick={handleProfileMenuOpen} color="inherit">
                    <MenuIcon />
                </IconButton>
            </>
        );
    };

    return (
        <div className={classes.grow}>
            <AppBar position="static">
                <Toolbar>
                    <Typography
                        className={classes.title}
                        variant="h6"
                        noWrap
                        onClick={() => {
                            history.push('/');
                        }}
                    >
                        Guardian Faceoff
                    </Typography>
                    <div className={classes.grow} />
                    {getNavbarControls()}
                </Toolbar>
            </AppBar>
            {renderMenu}
        </div>
    );
};

Navigation.propTypes = {
    history: PropTypes.object,
};

export default withRouter(Navigation);
