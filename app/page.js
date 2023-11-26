"use client";

import { useState, useEffect } from "react";

import Image from "next/image";
import styles from "./page.module.css";

import TextField from "@mui/material/TextField";

// Ready firebase
import firebase_app from "../firebase/config";

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

export default function Home({ params }) {
    const [phoneNumber, setPhoneNumber] = useState("");

    const [businessInfo, setBusinessInfo] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBusinessInfo = async () => {
        const docRef = doc(db, "shops", "s2uLGFGXPiEcupbKefzW");

        try {
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                console.log("Document data:", docSnap.data());
                setBusinessInfo(docSnap.data());
            } else {
                // docSnap.data() will be undefined in this case
                console.log("No such document!");
                setError("No Such Document");
            }
        } catch {
            setError(e);
        }
    };
    useEffect(() => {
        // define collection
        const q = doc(db, "shops", "s2uLGFGXPiEcupbKefzW");
        // define function
        const unsubscribe = onSnapshot(
            q,
            (docSnap) => {
                console.log("businessInfo:", docSnap.data());
                setBusinessInfo(docSnap.data());
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

    // handle changing the number
    const handleChange = (e) => {
        setPhoneNumber(e.target.value);
    };

    console.log("phone number: ", phoneNumber);
    console.log("businessId: ", params.businessId);

    // if (loading) {
    //     return <div>...loading</div>;
    // }

    return (
        <main className={styles.main}>
            <div className={styles.container}>Incorrect URL</div>
        </main>
    );
}
