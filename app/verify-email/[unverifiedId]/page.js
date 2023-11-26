"use client";

import { useState, useEffect } from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";

import Modal from "@mui/material/Modal";
import CircularProgress from "@mui/material/CircularProgress";

import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import Snackbar from "../../../components/Snackbar";

import { writeBatch, doc, collection } from "firebase/firestore";

import {
    registerNewUser,
    sendEmailVerification,
    getUnverifiedUser,
} from "../../../components/lib";

import styles from "./verifyEmail.module.css";

function Copyright(props) {
    return (
        <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            {...props}
        >
            {"Copyright © "}
            <Link color="inherit" href="https://mui.com/">
                Your Website
            </Link>{" "}
            {new Date().getFullYear()}
            {"."}
        </Typography>
    );
}

// TODO remove, this demo shouldn't need to reset the theme.

const defaultTheme = createTheme();

export default function VerifyEmail({ params }) {
    // get unverified user Doc Id from url
    const unverifiedUserId = params.unverifiedId;
    // State for UserInfo
    const [userInfo, setUserInfo] = useState();
    // Controls for Spinner
    const [loading, setLoading] = useState(true);

    // Snackbar controls
    const [snackbar, setSnackbar] = useState({
        open: false,
        severity: "",
        message: "",
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const unVerifiedUser = await getUnverifiedUser(
                    unverifiedUserId
                );

                if (unVerifiedUser) {
                    setLoading(false);
                    setUserInfo(unVerifiedUser);
                } else {
                    setLoading(false);
                    setUserInfo(null);
                }
            } catch (error) {
                console.log(
                    "error getting unverified user at useeffect: ",
                    error
                );
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div>... loading</div>;
    }

    if (!unverifiedUserId || !userInfo) {
        return (
            <ThemeProvider theme={defaultTheme}>
                <Container component="main" maxWidth="xs">
                    <CssBaseline />
                    <Box
                        sx={{
                            marginTop: 8,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >
                        <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
                            <img
                                src="http://chickenshack.rewardclub.us/background_new.jpg"
                                alt="logo"
                                style={{ width: "75px", height: "auto" }}
                            />
                        </Avatar>
                        <Typography component="h1" variant="h5">
                            No Records Found
                        </Typography>
                        <Box component="form" noValidate sx={{ mt: 1 }}>
                            <div className={styles.responseContainer}>
                                <h3>Please Register</h3>
                            </div>
                        </Box>
                    </Box>

                    <Snackbar snackbar={snackbar} setSnackbar={setSnackbar} />
                </Container>
            </ThemeProvider>
        );
    }

    console.log("UserINfo: ", userInfo);
    return (
        <ThemeProvider theme={defaultTheme}>
            <Container component="main" maxWidth="xs">
                <CssBaseline />
                <Box
                    sx={{
                        marginTop: 8,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
                        <img
                            src="http://chickenshack.rewardclub.us/background_new.jpg"
                            alt="logo"
                            style={{ width: "75px", height: "auto" }}
                        />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Verifying Your Email Address
                    </Typography>
                    <Box component="form" noValidate sx={{ mt: 1 }}>
                        {loading ? (
                            <CircularProgress size="2" />
                        ) : (
                            <div className={styles.responseContainer}>
                                <h3>Hi, {userInfo?.firstName}!</h3>
                                <p>Welcome to our Rewards Program 👍</p>

                                <h3 className={styles.inputLabel}>
                                    Current Points: 1
                                </h3>
                                <p>
                                    Remember to Check-In each time you Visit us
                                </p>
                                <p>to Earn Discounts and More!</p>
                            </div>
                        )}
                    </Box>
                </Box>

                <Snackbar snackbar={snackbar} setSnackbar={setSnackbar} />
            </Container>
        </ThemeProvider>
    );
}
