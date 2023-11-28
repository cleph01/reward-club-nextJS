"use client";

import { useState, useEffect } from "react";

import QRCode from "react-qr-code";

import styles from "./page.module.css";

import TextField from "@mui/material/TextField";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";

import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";

import SearchIcon from "@mui/icons-material/Search";

import Snackbar from "../../../components/Snackbar";

import { formatPhoneNumber, getCheckinRecord } from "../../../components/lib";

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
    // use subsidiary businessId, if included; else use parentBusinessId
    const businessId = !childBusinessId ? parentBusinessId : childBusinessId;
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
    // control for customer lookup window
    const [lookup, setLookup] = useState(false);

    console.log("lookup: ", lookup);
    // trigger firestore query for businessInfo on componentDidMount
    useEffect(() => {
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

    if (password !== businessInfo.tabletPassword) {
        return (
            <Password businessInfo={businessInfo} setPassword={setPassword} />
        );
    }

    if (lookup) {
        return (
            <CustomerLookup setLookup={setLookup} businessInfo={businessInfo} />
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
                        <div className={styles.lookupWrapper}>
                            <p className={styles.inputLabel}>
                                Previously a Member?
                            </p>
                            <p className={styles.inputLabel}>
                                <SearchIcon onClick={() => setLookup(true)} />
                            </p>
                        </div>

                        <p className={styles.inputLabel}>
                            Eneter Mobile Number Here
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
                        Checking-In with Mobile? Need to Sign Up? Click Here to
                        Register.
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

function CustomerLookup({ setLookup, businessInfo }) {
    const defaultTheme = createTheme();

    const [userData, setUserData] = useState({ cellphone: "", email: "" });
    const [checkinRecord, setCheckinRecord] = useState(null);

    // Snackbar controls
    const [snackbar, setSnackbar] = useState({
        open: false,
        severity: "",
        message: "",
    });

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.name === "cellphone") {
            setUserData({
                email: "",
                [e.target.name]: e.target.value,
            });
        } else if (e.target.name === "email") {
            setUserData({
                cellphone: "",
                [e.target.name]: e.target.value,
            });
        }
    };
    const handleClose = (e) => {
        e.preventDefault();
        setLookup(false);
    };

    const handleSearch = async (e) => {
        e.preventDefault();

        const checkinRecord = await getCheckinRecord(
            userData,
            businessInfo.id,
            setSnackbar
        );

        if (checkinRecord) {
            console.log("CheckinRecord: ", checkinRecord);
            setCheckinRecord(checkinRecord);
        }
    };

    return (
        <ThemeProvider theme={defaultTheme}>
            <Container component="main" maxWidth="500px">
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
                        Customer Lookup
                    </Typography>
                    {checkinRecord && (
                        <Box sx={{ mt: 1 }}>
                            <h2>Name: {checkinRecord.data.firstName}</h2>
                            <h3>
                                Current Points: {checkinRecord.currentPoints}
                            </h3>
                            <h3>
                                Last Check-In:{" "}
                                {checkinRecord.checkInLog[
                                    checkinRecord.checkInLog.length - 1
                                ].timestamp
                                    .toDate()
                                    .toLocaleString()}
                            </h3>
                            <h3>
                                Last Reward Won:{" "}
                                {checkinRecord.redemptionLog.length > 0
                                    ? checkinRecord.redemptionLog[
                                          checkinRecord.redemptionLog.length - 1
                                      ].timestamp
                                          .toDate()
                                          .toLocaleString()
                                    : "Only Has " +
                                      checkinRecord.checkInLog.length +
                                      " Check-Ins"}
                            </h3>
                        </Box>
                    )}
                    <Box
                        component="form"
                        noValidate
                        sx={{ mt: 1, width: "350px" }}
                    >
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="cellphone"
                            label="Cell Phone"
                            name="cellphone"
                            autoComplete="cellphone"
                            autoFocus
                            onChange={handleChange}
                            value={formatPhoneNumber(userData.cellphone)}
                        />
                        <div>- Or -</div>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email"
                            name="email"
                            autoComplete="email"
                            onChange={handleChange}
                            value={userData.email}
                        />
                        <div className={styles.lookupBtnWrapper}>
                            <Button variant="contained" onClick={handleSearch}>
                                Search
                            </Button>
                            <Button variant="contained" onClick={handleClose}>
                                Close
                            </Button>
                        </div>
                    </Box>
                </Box>
                <Snackbar snackbar={snackbar} setSnackbar={setSnackbar} />
            </Container>
        </ThemeProvider>
    );
}
