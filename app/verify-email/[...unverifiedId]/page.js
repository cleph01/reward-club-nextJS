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

import { verifyUser, getBusinessInfo } from "../../../components/lib";

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
    const [businessId, unverifiedRefId] = params.unverifiedId;
    // State for UserInfo
    const [userInfo, setUserInfo] = useState(null);
    // State for businessInfo
    const [businessInfo, setBusinessInfo] = useState(null);

    const [loading, setLoading] = useState(false);

    // Snackbar controls
    const [snackbar, setSnackbar] = useState({
        open: false,
        severity: "",
        message: "",
    });

    const handleVerify = async (e) => {
        setLoading(true);
        e.preventDefault();
        const unVerifiedUserDoc = await verifyUser(
            unverifiedRefId,
            setSnackbar
        );

        if (unVerifiedUserDoc) {
            setLoading(false);
            setUserInfo(unVerifiedUserDoc);
        } else {
            setLoading(false);
            setUserInfo(null);
        }
    };

    useEffect(() => {
        const getBusiness = async () => {
            const businessDoc = await getBusinessInfo(businessId);

            if (businessDoc) {
                setBusinessInfo(businessDoc);
            } else {
                console.log("Error Getting Business at verify");
            }
        };

        getBusiness();
    }, []);

    if (loading) {
        return <div>... verifying</div>;
    }

    console.log("businessInfo at verify: ", businessInfo);
    if (!userInfo) {
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
                        <Avatar
                            sx={{
                                m: 1,
                                width: 100,
                                height: 100,
                                bgcolor: "#fff",
                            }}
                        >
                            <img
                                src={businessInfo?.logoUrl}
                                alt="logo"
                                style={{
                                    width: "100px",
                                    height: "auto",
                                }}
                            />
                        </Avatar>
                        <Typography component="h1" variant="h5">
                            Click Button To Verify
                        </Typography>
                        <Box component="form" noValidate sx={{ mt: 1 }}>
                            <Button
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                                onClick={handleVerify}
                            >
                                Verify Email
                            </Button>
                        </Box>
                    </Box>

                    <Snackbar snackbar={snackbar} setSnackbar={setSnackbar} />
                </Container>
            </ThemeProvider>
        );
    }

    console.log("UserINfo: ", userInfo);
    console.log("businessInfo at verify: ", businessInfo);
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
                    <Avatar
                        sx={{
                            m: 1,
                            width: 100,
                            height: 100,
                            bgcolor: "#fff",
                        }}
                    >
                        <img
                            src={businessInfo?.logoUrl}
                            alt="logo"
                            style={{
                                width: "100px",
                                height: "auto",
                            }}
                        />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Your Email Is Now Verified
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                        <div className={styles.responseContainer}>
                            <h3>Hi, {userInfo?.firstName}!</h3>
                            <p>Welcome to our Rewards Program 👍</p>

                            <h3 className={styles.inputLabel}>
                                Current Points: 1
                            </h3>
                            <p>Remember to Check-In each time you Visit us</p>
                            <p>to Earn Discounts and More!</p>
                        </div>
                    </Box>
                </Box>

                <Snackbar snackbar={snackbar} setSnackbar={setSnackbar} />
            </Container>
        </ThemeProvider>
    );
}
