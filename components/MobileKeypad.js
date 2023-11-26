"use client";

import { useEffect, useState } from "react";
import styles from "./mobileKeypad.module.css";

import Modal from "@mui/material/Modal";
import CircularProgress from "@mui/material/CircularProgress";

import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";

import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";

import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import Snackbar from "../components/Snackbar";

// // Ready firebase
// import firebase_app from "../firebase/config";

// import { getFirestore } from "firebase/firestore";

// const db = getFirestore(firebase_app);

import {
    formatPhoneNumber,
    getUser,
    getRelationshipInfo,
    addPoint,
    addRelationship,
} from "./lib";

const defaultTheme = createTheme();

export default function Keypad({
    businessInfo,
    parentBusinessId,
    childBusinessId,
    resetShowOptions,
}) {
    const [cellphone, setCellphone] = useState("");
    const [pin, setPin] = useState("");
    const [showPin, setShowPin] = useState(false);
    // determine if checkin is at parent business or child business
    const businessId = !childBusinessId ? parentBusinessId : childBusinessId;

    // Save userInfo from onSubmit call
    const [userInfo, setUserInfo] = useState({
        loading: true,
        data: null,
    });

    // Snackbar controls
    const [snackbar, setSnackbar] = useState({
        open: false,
        severity: "",
        message: "",
    });

    // control for check-in modal
    const [openModal, setOpenModal] = useState(false);
    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => {
        setUserInfo((prev) => ({
            ...prev,
            loading: true,
        }));
        setOpenModal(false);
    };

    // Logic to handle keypress functionality
    const handleButtonClick = (e) => {
        e.preventDefault();

        if (!showPin) {
            if (cellphone.length < 10) {
                setCellphone((prev) => prev + e.target.innerHTML);
            }
        } else {
            setPin((prev) => prev + e.target.innerHTML);
        }
    };

    const handleShowPin = () => {
        if (cellphone.length < 10) {
            setSnackbar({
                open: true,
                severity: "error",
                message: "Number is Incomplete",
            });
            return;
        }
        setShowPin(true);
    };
    // logic to submit phone number and initiate check-in process
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (pin.length === 0) {
            setSnackbar({
                open: true,
                severity: "error",
                message: "Pin Can't Be Blank",
            });
            return;
        }

        // Query users table for userInfo via cellphone
        let user = await getUser(cellphone, null);

        // if user cellphone exists in user table
        if (user) {
            // save userInfo in state
            setUserInfo((prev) => ({
                ...prev,
                userId: user.userId,
                data: user.data,
            }));

            // Now, Query business-customer-relationship table for relationshipInfo
            let relationship = await getRelationshipInfo(
                user.userId,
                businessId,
                setUserInfo
            );

            // if customer has relationship with the business
            if (relationship) {
                // check if checkInLog is empty (first time checking in)
                // check if user already logged in today
                let lastCheckIn =
                    relationship.checkInLog.length > 0
                        ? relationship.checkInLog[
                              relationship.checkInLog.length - 1
                          ].timestamp
                              .toDate()
                              .toLocaleString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                              })
                        : null;

                let today = new Date().toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });

                // return if already checked in today
                if (lastCheckIn === today) {
                    setSnackbar({
                        open: true,
                        severity: "error",
                        message: "Already Checked In Today",
                    });

                    // Blank out cellphone and pin fields
                    setCellphone("");
                    setPin("");
                    setShowPin(false);

                    return;
                }

                // return if pin doesn't match
                if (pin !== businessInfo.checkinPin.toString()) {
                    setSnackbar({
                        open: true,
                        severity: "error",
                        message: "PIN is Incorrect. Try Again",
                    });
                    return;
                }

                //run AddPoint function  -> Open Modal
                let updatedRelationshipInfo = await addPoint(
                    relationship.relationshipId,
                    businessInfo.rewardThreshold
                );

                // if update current points successful
                if (updatedRelationshipInfo) {
                    console.log(
                        "UpdatedRelationshipInfo: ",
                        updatedRelationshipInfo
                    );

                    setUserInfo((prev) => ({
                        ...prev,
                        loading: false,
                        data: {
                            ...prev.data,
                            ...updatedRelationshipInfo,
                        },
                    }));

                    // Blank out cellphone and pin fields
                    setCellphone("");
                    setPin("");
                    setShowPin(false);

                    setOpenModal(true);
                }
            } else {
                // Number exists but no Relationship at this location

                // return if pin doesn't match
                if (pin !== businessInfo.checkinPin.toString()) {
                    console.log(
                        "Pin Match: ",
                        pin,
                        businessInfo.checkinPin,
                        pin === businessInfo.checkinPin
                    );
                    setSnackbar({
                        open: true,
                        severity: "error",
                        message: "PIN is Incorrect. Try Again",
                    });
                    return;
                }
                // Add new relationship to businessCustomerRelationship table
                let newRelationshipInfo = await addRelationship(
                    user,
                    parentBusinessId,
                    childBusinessId,
                    businessInfo.rewardThreshold
                );

                if (newRelationshipInfo) {
                    setUserInfo((prev) => ({
                        ...prev,
                        loading: false,
                        data: {
                            ...prev.data,
                            ...newRelationshipInfo,
                        },
                    }));

                    // Blank out cellphone and pin fields
                    setCellphone("");
                    setPin("");
                    setShowPin(false);

                    setOpenModal(true);

                    console.log("Relationship Created");
                } else {
                    console.log("New RelationshipInfo empty");
                }
            }
        } else {
            // Customer Cell Number not found in Firestore
            setSnackbar({
                open: true,
                severity: "error",
                message: "Number Not Found. Sign Up with QR Code",
            });
            return;
        }
    };

    console.log("cellphone: ", cellphone);
    console.log("pin: ", pin);
    console.log("businessInfo: ", businessInfo);
    console.log("userInfo: ", userInfo);

    return (
        <>
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
                                width: 100,
                                height: 100,
                                bgcolor: "#fff",
                            }}
                        >
                            <img
                                src={businessInfo.logoUrl}
                                alt="logo"
                                style={{ width: "100px", height: "auto" }}
                            />
                        </Avatar>
                        {!showPin && (
                            <Typography component="h1" variant="h5">
                                Enter Mobile Number
                            </Typography>
                        )}
                        {showPin && (
                            <Typography component="h1" variant="h5">
                                Enter Pin from Tablet
                            </Typography>
                        )}

                        <Box sx={{ mt: 3 }}>
                            <div className={styles.container}>
                                {!showPin && (
                                    <div className={styles.cellphoneDisplay}>
                                        {formatPhoneNumber(cellphone)}
                                    </div>
                                )}
                                {showPin && (
                                    <div className={styles.cellphoneDisplay}>
                                        {pin}
                                    </div>
                                )}
                                <div className={styles.row}>
                                    <div
                                        onClick={handleButtonClick}
                                        className={styles.cell}
                                    >
                                        1
                                    </div>
                                    <div
                                        onClick={handleButtonClick}
                                        className={styles.cell}
                                    >
                                        2
                                    </div>
                                    <div
                                        onClick={handleButtonClick}
                                        className={styles.cell}
                                    >
                                        3
                                    </div>
                                </div>
                                <div className={styles.row}>
                                    <div
                                        onClick={handleButtonClick}
                                        className={styles.cell}
                                    >
                                        4
                                    </div>
                                    <div
                                        onClick={handleButtonClick}
                                        className={styles.cell}
                                    >
                                        5
                                    </div>
                                    <div
                                        onClick={handleButtonClick}
                                        className={styles.cell}
                                    >
                                        6
                                    </div>
                                </div>
                                <div className={styles.row}>
                                    <div
                                        onClick={handleButtonClick}
                                        className={styles.cell}
                                    >
                                        7
                                    </div>
                                    <div
                                        onClick={handleButtonClick}
                                        className={styles.cell}
                                    >
                                        8
                                    </div>
                                    <div
                                        onClick={handleButtonClick}
                                        className={styles.cell}
                                    >
                                        9
                                    </div>
                                </div>
                                <div className={styles.row}>
                                    <div
                                        onClick={() => {
                                            if (!showPin) {
                                                setCellphone("");
                                            } else {
                                                setPin("");
                                            }
                                        }}
                                        className={styles.cell}
                                    >
                                        X
                                    </div>
                                    <div
                                        onClick={handleButtonClick}
                                        className={styles.cell}
                                    >
                                        0
                                    </div>
                                    <div
                                        onClick={() => {
                                            if (!showPin) {
                                                setCellphone((prev) =>
                                                    prev.slice(0, -1)
                                                );
                                            } else {
                                                setPin((prev) =>
                                                    prev.slice(0, -1)
                                                );
                                            }
                                        }}
                                        className={styles.cell}
                                    >
                                        {"<<"}
                                    </div>
                                </div>
                                <div className={styles.row}>
                                    {!showPin && (
                                        <div
                                            className={styles.submitButton}
                                            onClick={handleShowPin}
                                        >
                                            Enter
                                        </div>
                                    )}
                                    {showPin && (
                                        <div
                                            className={styles.submitButton}
                                            onClick={handleSubmit}
                                        >
                                            Submit
                                        </div>
                                    )}
                                </div>
                                <div className={styles.footer}>
                                    <div onClick={resetShowOptions}>
                                        <u>{"👈 Back to Main Menu"}</u>
                                    </div>
                                    {showPin && (
                                        <div onClick={() => setShowPin(false)}>
                                            <u>{"Redo Mobile Number"}</u>
                                        </div>
                                    )}
                                </div>
                                <CheckInModal
                                    userInfo={userInfo}
                                    openModal={openModal}
                                    handleCloseModal={handleCloseModal}
                                />
                                <Snackbar
                                    snackbar={snackbar}
                                    setSnackbar={setSnackbar}
                                />
                            </div>
                        </Box>
                    </Box>
                </Container>
            </ThemeProvider>
        </>
    );
}

// Response Modal for Checkin Process
function CheckInModal({ userInfo, openModal, handleCloseModal }) {
    const style = {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 450,
        height: 250,
        bgcolor: "background.paper",
        border: "2px solid #000",
        boxShadow: 24,
        p: 4,
    };

    return (
        <Modal
            open={openModal}
            onClose={handleCloseModal}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            {userInfo?.loading ? (
                <Box sx={{ display: "flex" }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={style}>
                    <div className={styles.responseContainer}>
                        <h3>Hi, {userInfo?.data.firstName}!</h3>
                        <p>Welcome Back 👍</p>
                        {/* Show Last Checked-In date only if not first check in */}
                        {userInfo?.data.checkInLog.length > 1 && (
                            <p>
                                Last Checked-In on:{" "}
                                <strong>
                                    {userInfo?.data.checkInLog[
                                        userInfo?.data.checkInLog.length - 1
                                    ].timestamp
                                        .toDate()
                                        .toLocaleString()}
                                </strong>
                            </p>
                        )}

                        <h4 className={styles.inputLabel}>
                            Previous Points: {userInfo?.data.currentPoints}
                        </h4>

                        {/* Show Redemption language or Current Points language */}
                        {userInfo.data.newPoints === 0 ? (
                            <div className={styles.redeemMessage}>
                                <h3>Congratulations! 🥳 You Earned 20% OFF</h3>

                                <p>
                                    {new Date().toLocaleString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "numeric",
                                        minute: "numeric",
                                        hour12: true,
                                    })}
                                </p>
                            </div>
                        ) : (
                            <h3 className={styles.inputLabel}>
                                Current Points: {userInfo?.data.newPoints}
                            </h3>
                        )}
                    </div>
                </Box>
            )}
        </Modal>
    );
}
