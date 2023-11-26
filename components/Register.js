import { useState } from "react";
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

import Snackbar from "../components/Snackbar";

import { writeBatch, doc, collection } from "firebase/firestore";

import { registerNewUser, sendEmailVerification } from "./lib";

import styles from "./register.module.css";

// TODO remove, this demo shouldn't need to reset the theme.

const defaultTheme = createTheme();

export default function Register({
    resetShowOptions,
    parentBusinessId,
    childBusinessId,
    businessInfo,
}) {
    // User input state
    const [userData, setUserData] = useState({
        name: "",
        email: "",
        loading: true,
    });

    // Controls for updating user input
    const handleChange = (e) => {
        e.preventDefault();
        setUserData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

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
        setOpenModal(false);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (userData.name.length === 0) {
            setSnackbar({
                open: true,
                severity: "error",
                message: "Please Enter a Name",
            });

            return;
        }

        if (!userData.email.includes("@") || !userData.email.includes(".com")) {
            setSnackbar({
                open: true,
                severity: "error",
                message: "Invalid Email",
            });

            return;
        }

        sendEmailVerification(
            userData,
            setSnackbar,
            setOpenModal,
            parentBusinessId,
            childBusinessId,
            businessInfo
        );
    };

    console.log("userData: ", userData);

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
                            src={businessInfo.logoUrl}
                            alt="logo"
                            style={{ width: "100px", height: "auto" }}
                        />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Register with Email Address
                    </Typography>
                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        noValidate
                        sx={{ mt: 1 }}
                    >
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="name"
                            label="First Name"
                            name="name"
                            autoComplete="email"
                            autoFocus
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            onChange={handleChange}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Register
                        </Button>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                            }}
                        >
                            <p onClick={resetShowOptions}>
                                <u>{"👈 Back to Main Menu"}</u>
                            </p>
                        </div>
                    </Box>
                </Box>
                <CheckInModal
                    openModal={openModal}
                    handleCloseModal={handleCloseModal}
                    userData={userData}
                />
                <Snackbar snackbar={snackbar} setSnackbar={setSnackbar} />
            </Container>
        </ThemeProvider>
    );
}

// Response Modal for Checkin Process
function CheckInModal({ userData, openModal, handleCloseModal }) {
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
            <Box sx={style}>
                <div className={styles.responseContainer}>
                    <h3>Hi, {userData.name}!</h3>
                    <p>One Last Step 👍</p>
                    <p>Please Check Your Email from Us.</p>
                    <p>And Click the Link to Complete the Signup</p>
                </div>
            </Box>
        </Modal>
    );
}
