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
    // check if subsidiary (child) businessId in query string
    // const searchParams = useSearchParams();
    // let childBusinessId = searchParams.get("b");
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

    if (loading && !parentBusinessId) {
        return <div>...loading</div>;
    }

    console.log("ParentBusiness: ", parentBusinessId);
    console.log("childBusinessId: ", childBusinessId);
    console.log("url: ", url);
    console.log("businessInfo: ", businessInfo);
    return (
        <main className={styles.main}>
            <div className={styles.container}>
                {/* client logo wrapper */}
                <div>
                    <img
                        src="http://chickenshack.rewardclub.us/background_new.jpg"
                        width={500}
                        height={300}
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
                                ? `${url}/barcode`
                                : `${url}/barcode/${childBusinessId}`
                        }
                    />
                </div>
            </Box>
        </Modal>
    );
}
// businessName: Chicken Shack
// address: 36-19 Broadway
// checkinPin: 3333
// checkinImage: http://chickenshack.rewardclub.us/background_new.jpg
// city: Astoria
// logoUrl: https://lirp.cdn-website.com/8e0f3f8d/dms3rep/multi/opt/Group+828%403x-1920w.png
// ownerId: Epuj5NNcOjTYu4lKcVBtEnLXttC3
// state: NY
// phoneNumber: 718-721-3035
// youtubeId: dINMey5wUuQ
