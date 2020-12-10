import React, { useContext, useState, useEffect } from 'react';
import { Snackbar, SnackbarContent, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { makeStyles } from '@material-ui/core/styles';
import { AppContext } from './AppContext';

const useStyles = makeStyles((theme) => {
    return {
        'paper-success': {
            backgroundColor: theme.palette.success.main,
            color: theme.palette.success.contrastText,
        },
        'paper-info': {
            backgroundColor: theme.palette.info.main,
            color: theme.palette.info.contrastText,
        },
        'paper-warning': {
            backgroundColor: theme.palette.warning.main,
            color: theme.palette.warning.contrastText,
        },
        'paper-error': {
            backgroundColor: theme.palette.error.main,
            color: theme.palette.error.contrastText,
        },
    };
});
const SnackBarManager = () => {
    const classes = useStyles();
    const { snackPack, setSnackPack } = useContext(AppContext);
    const [open, setOpen] = useState(false);
    const [messageInfo, setMessageInfo] = React.useState(undefined);

    useEffect(() => {
        if (snackPack.length && !messageInfo) {
            // Set a new snack when we don't have an active one
            setMessageInfo({ ...snackPack[0] });
            setSnackPack((prev) => prev.slice(1));
            setOpen(true);
        } else if (snackPack.length && messageInfo && open) {
            // Close an active snack when a new one is added
            setOpen(false);
        }
    }, [snackPack, messageInfo, open]);

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    const handleExited = () => {
        setMessageInfo(undefined);
    };

    const getCloseAction = () => {
        return (
            <IconButton aria-label="close" color="inherit" onClick={handleClose}>
                <CloseIcon />
            </IconButton>
        );
    };

    return (
        <Snackbar key={messageInfo ? messageInfo.key : undefined} open={open} autoHideDuration={3000} onClose={handleClose} onExited={handleExited}>
            <SnackbarContent
                className={messageInfo && messageInfo.snackBar ? classes[`paper-${messageInfo.snackBar.severity}`] : ''}
                message={messageInfo && messageInfo.snackBar ? messageInfo.snackBar.message : ''}
                action={getCloseAction()}
            />
        </Snackbar>
    );
};

export default SnackBarManager;
