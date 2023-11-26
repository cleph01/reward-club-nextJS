import { useEffect, useState } from "react";
import styles from "./keypad.module.css";

import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

import Snackbar from "../components/Snackbar";

// Ready firebase
import firebase_app from "../firebase/config";

import { getFirestore } from "firebase/firestore";

const db = getFirestore(firebase_app);

import {
    formatPhoneNumber,
    getUser,
    getRelationshipInfo,
    addPoint,
    addRelationship,
} from "./lib";

export default function Keypad({
    cellphone,
    setCellphone,
    businessInfo,
    parentBusinessId,
    childBusinessId,
}) {
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

    // control for spinner at sumit button
    const [processing, setProcessing] = useState(false);

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

        if (cellphone.length < 10) {
            setCellphone((prev) => prev + e.target.innerHTML);
        }
    };

    // logic to submit phone number and initiate check-in process
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (cellphone.length === 0) {
            // Customer Cell Number not found in Firestore
            setSnackbar({
                open: true,
                severity: "error",
                message: "Number Cannot Be Empty",
            });

            return;
        }

        if (cellphone.length === 10) {
            // activate spinner at submit button
            setProcessing(true);
            // Query users table for userInfo via cellphone
            let user = await getUser(cellphone, setUserInfo);

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
                        // clear cellphone field
                        setCellphone("");
                        // de-activate spinner at submit button
                        setProcessing(false);
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

                        // Open check in message modal
                        setOpenModal(true);
                        // Blank out cellphone in keypad
                        setCellphone("");
                    }
                } else {
                    // Number exists but no Relationship at this location
                    // Add new relationship to businessCustomerRelationship table
                    let newRelationshipInfo = await addRelationship(
                        user,
                        parentBusinessId,
                        childBusinessId,
                        businessInfo.rewardThreshold,
                        setSnackbar
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

                        // Open check in message modal
                        setOpenModal(true);
                        // Blank out cellphone in keypad
                        setCellphone("");

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

                // de-activate spinner at submit button
                setProcessing(false);
                return;
            }
        } else {
            // Opens snackbar for error message
            setSnackbar((prev) => ({
                ...prev,
                open: true,
                severity: "error",
                message: "Number is Incomplete",
            }));

            console.log("Number Incomplete");
        }

        // de-activate spinner at submit button
        setProcessing(false);
    };

    console.log("Keypaid userInfo: ", userInfo);
    return (
        <>
            <div className={styles.container}>
                <div className={styles.cellphoneDisplay}>
                    {formatPhoneNumber(cellphone)}
                </div>
                <div className={styles.row}>
                    <div onClick={handleButtonClick} className={styles.cell}>
                        1
                    </div>
                    <div onClick={handleButtonClick} className={styles.cell}>
                        2
                    </div>
                    <div onClick={handleButtonClick} className={styles.cell}>
                        3
                    </div>
                </div>
                <div className={styles.row}>
                    <div onClick={handleButtonClick} className={styles.cell}>
                        4
                    </div>
                    <div onClick={handleButtonClick} className={styles.cell}>
                        5
                    </div>
                    <div onClick={handleButtonClick} className={styles.cell}>
                        6
                    </div>
                </div>
                <div className={styles.row}>
                    <div onClick={handleButtonClick} className={styles.cell}>
                        7
                    </div>
                    <div onClick={handleButtonClick} className={styles.cell}>
                        8
                    </div>
                    <div onClick={handleButtonClick} className={styles.cell}>
                        9
                    </div>
                </div>
                <div className={styles.row}>
                    <div
                        onClick={() => setCellphone("")}
                        className={styles.cell}
                    >
                        X
                    </div>
                    <div onClick={handleButtonClick} className={styles.cell}>
                        0
                    </div>
                    <div
                        onClick={() =>
                            setCellphone((prev) => prev.slice(0, -1))
                        }
                        className={styles.cell}
                    >
                        {"<<"}
                    </div>
                </div>
                <div className={styles.row}>
                    <div className={styles.submitButton} onClick={handleSubmit}>
                        {processing ? (
                            <CircularProgress size={18} color="inherit" />
                        ) : (
                            "Submit"
                        )}
                        {/* <CircularProgress size={18} color="inherit" />
                        Submit */}
                    </div>
                </div>
                <CheckInModal
                    userInfo={userInfo}
                    openModal={openModal}
                    handleCloseModal={handleCloseModal}
                />
                <Snackbar snackbar={snackbar} setSnackbar={setSnackbar} />
            </div>
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
                        {userInfo?.data.checkInLog.length > 0 && (
                            <p>
                                Last Checked-In on:{" "}
                                <strong>
                                    {/* if checkInLog length === 2, it means relationship was just created,
                                   So display first record, which would be the last record from transferred CSV file  */}
                                    {userInfo?.data.checkInLog.length === 2
                                        ? userInfo?.data.checkInLog[0].timestamp
                                              .toDate()
                                              .toLocaleString()
                                        : userInfo?.data.checkInLog[
                                              userInfo?.data.checkInLog.length -
                                                  1
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
