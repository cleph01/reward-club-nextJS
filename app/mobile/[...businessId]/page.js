"use client";

import { useState, useEffect } from "react";

import styles from "./mobileCheckin.module.css";

import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";

import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";

import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import MobileKeypad from "../../../components/MobileKeypad";
import EmailCheckin from "../../../components/EmailCheckin";
import Register from "../../../components/Register";

// Ready firebase
import firebase_app from "../../../firebase/config";

import {
    getFirestore,
    doc,
    getDoc,
    collection,
    onSnapshot,
    query,
    where,
    orderBy,
} from "firebase/firestore";

const db = getFirestore(firebase_app);

function Copyright(props) {
    return (
        <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            {...props}
        >
            {"Copyright © "}
            <Link color="inherit" href="https://smartseed.agency/">
                Smartseed, LLC
            </Link>{" "}
            {new Date().getFullYear()}
            {"."}
        </Typography>
    );
}

const defaultTheme = createTheme();

export default function MobileCheckin({ params }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState();
    const [businessInfo, setBusinessInfo] = useState(null);
    // get parent businessId from dynamic route
    const [parentBusinessId, childBusinessId] = params.businessId;
    // check if subsidiary (child) businessId in query string
    // const searchParams = useSearchParams();
    // let childBusinessId = searchParams.get("b");
    // get full url from address bar in order to create QRcode
    const [showOption, setShowOption] = useState({
        keypad: false,
        email: false,
        register: false,
    });

    const handleOptionClick = (option) => {
        setShowOption((prev) => ({
            ...prev,
            [option]: !prev[option],
        }));
    };

    const resetShowOptions = () => {
        setShowOption({
            keypad: false,
            email: false,
            register: false,
        });
    };
    const handleSubmit = () => {};

    // trigger firestore query for businessInfo on componentDidMount
    useEffect(() => {
        // use subsidiary businessId, if included; else use parentBusinessId
        const businessId = !childBusinessId
            ? parentBusinessId
            : childBusinessId;
        // define collection
        const q = doc(db, "shops", businessId);
        // create real-time connection with onSnapshot
        const unsubscribe = onSnapshot(
            q,
            (docSnap) => {
                setBusinessInfo({ id: docSnap.id, ...docSnap.data() });
                setLoading(false);
            },
            (error) => {
                console.log("Error Getting Business Info: ", error);
                setError(error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    if (loading && !parentBusinessId) {
        return <div>...loading</div>;
    }

    console.log("ParentBusiness: ", parentBusinessId);
    console.log("childBusinessId: ", childBusinessId);

    console.log("businessInfo: ", businessInfo);

    return (
        <div className={styles.container}>
            {/* Show Welcome Options */}
            {!showOption.keypad &&
                !showOption.email &&
                !showOption.register && (
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
                                    sx={{ m: 1, bgcolor: "secondary.main" }}
                                >
                                    <img
                                        src={businessInfo?.logoUrl}
                                        alt="logo"
                                        style={{
                                            width: "50px",
                                            height: "auto",
                                        }}
                                    />
                                </Avatar>
                                <Typography component="h1" variant="h5">
                                    Mobile Check-In
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                    <p style={{ marginTop: "20px" }}>
                                        Signed Up With a Mobile Number?
                                    </p>
                                    <Button
                                        onClick={() =>
                                            handleOptionClick("keypad")
                                        }
                                        fullWidth
                                        variant="contained"
                                        sx={{ mt: 3, mb: 2 }}
                                    >
                                        Enter Mobile Number
                                    </Button>

                                    <div>
                                        Signed Up Using an E-mail Address?
                                    </div>

                                    <Button
                                        onClick={() =>
                                            handleOptionClick("email")
                                        }
                                        fullWidth
                                        variant="contained"
                                        sx={{ mt: 3, mb: 2 }}
                                    >
                                        Enter e-Mail
                                    </Button>
                                    <Grid container>
                                        <Grid item>
                                            <Typography
                                                component="p"
                                                variant="body2"
                                                onClick={() =>
                                                    handleOptionClick(
                                                        "register"
                                                    )
                                                }
                                            >
                                                <u>
                                                    {
                                                        "Don't have an account? Sign Up"
                                                    }
                                                </u>
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Box>
                        </Container>
                    </ThemeProvider>
                )}

            {/* Show Keypad */}
            {showOption.keypad && (
                <MobileKeypad
                    resetShowOptions={resetShowOptions}
                    parentBusinessId={parentBusinessId}
                    childBusinessId={childBusinessId}
                    businessInfo={businessInfo}
                />
            )}
            {/* Show Email checkin */}
            {showOption.email && (
                <EmailCheckin
                    resetShowOptions={resetShowOptions}
                    handleOptionClick={handleOptionClick}
                    businessInfo={businessInfo}
                    parentBusinessId={parentBusinessId}
                    childBusinessId={childBusinessId}
                />
            )}
            {/* Show Register */}
            {showOption.register && (
                <Register
                    resetShowOptions={resetShowOptions}
                    parentBusinessId={parentBusinessId}
                    childBusinessId={childBusinessId}
                    businessInfo={businessInfo}
                />
            )}
            {/* CopyRIght */}
            <Copyright sx={{ mt: 8, mb: 4 }} />
        </div>
    );
}
