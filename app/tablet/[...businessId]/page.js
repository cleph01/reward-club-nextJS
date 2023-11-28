"use client";

import { useState, useEffect } from "react";

import { useSearchParams } from "next/navigation";

import { useUrl } from "nextjs-current-url";

import QRCode from "react-qr-code";

import Image from "next/image";
import styles from "./page.module.css";

import TextField from "@mui/material/TextField";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";

import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Avatar from "@mui/material/Avatar";

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

import Keypad from "@/components/Keypad";

export default function Checkin({ params }) {
    // get parent businessId from dynamic route
    const [parentBusinessId, childBusinessId] = params.businessId;
    // controls to prevent unathorized use at homes
    const [password, setPassword] = useState("");
    // get full url from address bar in order to create QRcode
    const url = window.location.href;
    // store phone number for display on keypad
    const [cellphone, setCellphone] = useState("");
    // store businessInfo from firestore query
    const [businessInfo, setBusinessInfo] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // set controls for QRcode modal
    const [openModal, setOpenModal] = useState(false);
    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => setOpenModal(false);

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

    useEffect(() => {
        let tabletPassword = localStorage.getItem("tabletPassword");
        if (tabletPassword) {
            setPassword(tabletPassword);
        }
    }, []);

    if (loading && !parentBusinessId) {
        return <div>...loading</div>;
    }

    console.log("ParentBusiness: ", parentBusinessId);
    console.log("childBusinessId: ", childBusinessId);
    console.log("url: ", url);
    console.log("url split: ", url.split("/"));
    console.log("businessInfo: ", businessInfo);
    console.log("password: ", password);

    if (password !== businessInfo.tabletPassword) {
        return (
            <Password businessInfo={businessInfo} setPassword={setPassword} />
        );
    }
    return (
        <main className={styles.main}>
            <div className={styles.container}>
                {/* client logo wrapper */}
                <div>
                    <img
                        src={businessInfo.tabletImage}
                        width={650}
                        height={390}
                        alt="Logo"
                        style={{ borderRadius: "8px" }}
                    />
                </div>
                {/* checkin functionality */}
                <div className={styles.inputWrapper}>
                    <div>
                        <p className={styles.inputLabel}>Already a Member?</p>
                        <p className={styles.inputLabel}>
                            Check-In with Mobile Number
                        </p>
                    </div>

                    <Keypad
                        cellphone={cellphone}
                        setCellphone={setCellphone}
                        businessInfo={businessInfo}
                        parentBusinessId={parentBusinessId}
                        childBusinessId={childBusinessId}
                    />

                    <p className={styles.inputLabel} onClick={handleOpenModal}>
                        Checking-In with Mobile? Need to Sign Up? Click Here.
                    </p>
                </div>
            </div>
            {url && (
                <QrCodeModal
                    openmodal={openModal}
                    handleCloseModal={handleCloseModal}
                    checkinPin={businessInfo.checkinPin}
                    url={url}
                    parentBusinessId={parentBusinessId}
                    childBusinessId={childBusinessId}
                />
            )}
        </main>
    );
}

function QrCodeModal({
    openmodal,
    handleCloseModal,
    checkinPin,
    url,
    parentBusinessId,
    childBusinessId,
}) {
    const style = {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 400,
        bgcolor: "background.paper",
        border: "2px solid #000",
        boxShadow: 24,
        p: 4,
    };
    return (
        <Modal
            open={openmodal}
            onClose={handleCloseModal}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                <div className={styles.qrCodeWrapper}>
                    <h5 className={styles.inputLabel}>
                        Scan QRcode to Signup and Check-in
                    </h5>

                    <p className={styles.verificationPin}>
                        Verification Pin: {checkinPin}
                    </p>
                    {/* Include logic to add childBusinssId to query string of QRcode */}

                    <QRCode
                        value={
                            childBusinessId
                                ? `http://${
                                      url.split("/")[2]
                                  }/mobile/${parentBusinessId}/${childBusinessId}`
                                : `http://${
                                      url.split("/")[2]
                                  }/mobile/${parentBusinessId}`
                        }
                    />
                </div>
            </Box>
        </Modal>
    );
}

function Password({ businessInfo, password, setPassword }) {
    const defaultTheme = createTheme();

    const handleChange = (e) => {
        e.preventDefault();
        setPassword(e.target.value);
    };

    useEffect(() => {
        if (password === businessInfo.tabletPassword) {
            localStorage.setItem("tabletPassword", password);
        }
    }, [password]);

    return (
        <ThemeProvider theme={defaultTheme}>
            <Container component="main" maxWidth="xs">
                <CssBaseline />
                <Box
                    sx={{
                        marginTop: 2,
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
                            src={businessInfo?.logoUrl}
                            alt="logo"
                            style={{ width: "100px", height: "auto" }}
                        />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Enter Password
                    </Typography>
                    <Box component="form" noValidate sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            type="password"
                            required
                            fullWidth
                            id="password"
                            label="Password"
                            name="password"
                            autoComplete="password"
                            autoFocus
                            onChange={handleChange}
                        />
                    </Box>
                </Box>
            </Container>
        </ThemeProvider>
    );
}
