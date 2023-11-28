// Ready firebase
import firebase_app from "../firebase/config";

import {
    getFirestore,
    collection,
    query,
    where,
    getDoc,
    getDocs,
    updateDoc,
    doc,
    runTransaction,
    arrayUnion,
    Timestamp,
    addDoc,
    writeBatch,
} from "firebase/firestore";

const db = getFirestore(firebase_app);

// define function to format phone number with parantheses and dashes
const formatPhoneNumber = (value) => {
    // if input value is falsy eg if the user deletes the input, then just return
    if (!value) return value;

    // clean the input for any non-digit values.
    const phoneNumber = value.replace(/[^\d]/g, "");

    // phoneNumberLength is used to know when to apply our formatting for the phone number
    const phoneNumberLength = phoneNumber.length;

    // we need to return the value with no formatting if its less then four digits
    // this is to avoid weird behavior that occurs if you  format the area code to early

    if (phoneNumberLength < 4) return phoneNumber;

    // if phoneNumberLength is greater than 4 and less the 7 we start to return
    // the formatted number
    if (phoneNumberLength < 7) {
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }

    // finally, if the phoneNumberLength is greater then seven, we add the last
    // bit of formatting and return it.
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(
        3,
        6
    )}-${phoneNumber.slice(6, 10)}`;
};

// Get user info during check-in
const getUser = async (cellphone, email) => {
    try {
        const userRef = collection(db, "users");
        //
        const q = query(
            userRef,
            where(
                cellphone ? "cellPhone" : "email",
                "==",
                cellphone ? `+1${cellphone}` : email
            )
        );
        //
        const userSnapshot = await getDocs(q);

        //
        if (userSnapshot.empty) {
            // return null value
            return null;
        } else {
            // Number is in User Table
            // Save UserInfo
            let user;
            userSnapshot.forEach((doc) => {
                // set userInfo.loading to false & save details
                user = {
                    userId: doc.id,
                    data: doc.data(),
                };
            });

            return user;
        }
    } catch (error) {
        console.log("Error Getting UserInfo: ", error);
    }
};

// Get user info during check-in
const getRelationshipInfo = async (userId, businessId, setSnackbar) => {
    try {
        // Create a query to get business relationship
        const relationshipRef = collection(db, "businessCustomerRelationships");
        //
        const q = query(
            relationshipRef,
            where("customerId", "==", userId),
            where("businessId", "==", businessId)
        );
        //
        const relationshipSnapshot = await getDocs(q);

        if (relationshipSnapshot.empty) {
            return null;
        } else {
            // Retrieve User Info
            let relationship;
            relationshipSnapshot.forEach((doc) => {
                relationship = {
                    relationshipId: doc.id,
                    ...doc.data(),
                };
            });

            return relationship;
        }
    } catch (error) {
        console.log("Error Getting Relationship: ", error);
    }
};

const addPoint = async (relationshipId, rewardThreshold) => {
    let relationshipDocRef = doc(
        db,
        "businessCustomerRelationships",
        relationshipId
    );

    try {
        let relationshipInfo;
        await runTransaction(db, async (transaction) => {
            const relationshipDoc = await transaction.get(relationshipDocRef);
            if (!relationshipDoc.exists()) {
                throw "Document does not exist!";
            }

            // check if newPoints === threshold
            let newPoints = relationshipDoc.data().currentPoints + 1;
            // create timestamp object to update firebase with
            let today = Timestamp.now();

            if (newPoints >= rewardThreshold) {
                newPoints = 0;
            }
            // setup relationship object to return from function
            relationshipInfo = {
                ...relationshipDoc.data(),
                newPoints,
            };
            // Update Current Points w. NewPoints
            transaction.update(relationshipDocRef, {
                currentPoints: newPoints,
            });
            // Add to CheckIn Log
            transaction.update(relationshipDocRef, {
                checkInLog: arrayUnion({
                    timestamp: today,
                    pointsAfterCheckIn: newPoints,
                }),
            });

            // hadle redemption logic
            if (newPoints === 0) {
                // Add to Redemtion Log
                transaction.update(relationshipDocRef, {
                    redemptionLog: arrayUnion({
                        timestamp: today,
                        pointsAtRedemption:
                            relationshipDoc.data().currentPoints,
                    }),
                });
            }
        });
        console.log("Transaction successfully committed!");
        // return relationship object
        return relationshipInfo;
    } catch (e) {
        console.log("Transaction failed: ", e);
    }
};

const addRelationship = async (
    user,
    parentBusinessId,
    childBusinessId,
    rewardThreshold,
    setSnackbar
) => {
    try {
        let businessId = !childBusinessId ? parentBusinessId : childBusinessId;

        let newPoints = user.data.currentPoints
            ? user.data.currentPoints + 1
            : 1;

        if (newPoints >= rewardThreshold) {
            newPoints = 0;
        }

        const relationshipData = {
            businessId,
            customerId: user.userId,
            parentBusinessId,
            currentPoints: newPoints,
            checkInLog: user.data.lastCheckIn
                ? [
                      {
                          timestamp: Timestamp.fromDate(
                              user.data.lastCheckIn.toDate()
                          ),
                          pointsAfterCheckIn: user.data.currentPoints,
                      },
                      {
                          timestamp: Timestamp.now(),
                          pointsAfterCheckIn: newPoints,
                      },
                  ]
                : [
                      {
                          timestamp: Timestamp.now(),
                          pointsAfterCheckIn: newPoints,
                      },
                  ],
            redemptionLog:
                newPoints === 0
                    ? [
                          {
                              pointsAtRedemption: user.data.currentPoints,
                              timestamp: Timestamp.now(),
                          },
                      ]
                    : [],
        };
        // Add a new document with a generated id.
        const docRef = await addDoc(
            collection(db, "businessCustomerRelationships"),
            relationshipData
        );

        // return the new relationshipInfo
        return {
            relationshipId: docRef.id,
            currentPoints: user.data.currentPoints
                ? user.data.currentPoints
                : 0,
            newPoints,
            checkInLog: user.data.lastCheckIn
                ? [
                      {
                          timestamp: Timestamp.fromDate(
                              user.data.lastCheckIn.toDate()
                          ),
                          pointsAfterCheckIn: user.data.currentPoints,
                      },
                      {
                          timestamp: Timestamp.now(),
                          pointsAfterCheckIn: newPoints,
                      },
                  ]
                : [
                      {
                          timestamp: Timestamp.now(),
                          pointsAfterCheckIn: newPoints,
                      },
                  ],
            redemptionLog:
                newPoints === 0
                    ? [
                          {
                              pointsAtRedemption: user.data.currentPoints,
                              timestamp: Timestamp.now(),
                          },
                      ]
                    : [],
        };
    } catch (error) {
        setSnackbar((prev) => ({
            ...prev,
            open: true,
            severity: "error",
            message: "Error Creating Relationship. Try Again",
        }));
    }
};

const registerNewUser = async (
    userData,
    setSnackbar,
    setOpenModal,
    parentBusinessId,
    childBusinessId
) => {
    try {
        // Create a query to get business relationship
        const userRef = collection(db, "users");
        //
        const q = query(userRef, where("email", "==", userData.email));
        //
        const userSnapshot = await getDocs(q);

        if (userSnapshot.empty) {
            // Get a new write batch
            const batch = writeBatch(db);

            // TODO: Add user
            // Generate firestore ID for new User
            const newUserRef = doc(collection(db, "users"));
            // Set userData to that id
            batch.set(newUserRef, {
                firstName: userData.name,
                email: userData.email,
            });

            // TODO: Add relationship
            // Generate firestore ID for new User
            const newRelationshipRef = doc(
                collection(db, "businessCustomerRelationships")
            );

            let businessId = !childBusinessId
                ? parentBusinessId
                : childBusinessId;

            const relationshipData = {
                businessId,
                parentBusinessId,
                currentPoints: 1,
                customerId: newUserRef.id,
                checkInLog: [
                    {
                        timestamp: Timestamp.now(),
                        pointsAfterCheckIn: 1,
                    },
                ],
                redemptionLog: [],
            };
            // Set relationshipData to that id
            batch.set(newRelationshipRef, relationshipData);

            // Commit the batch
            await batch.commit();

            // Open respone modal
            setOpenModal(true);
        } else {
            // User already exists. Return Error Snackbar
            setSnackbar((prev) => ({
                ...prev,
                open: true,
                severity: "error",
                message: "You've Already Signed Up With This Email",
            }));
        }
    } catch (error) {
        console.log("Error Registering with Email: ", error);
        setSnackbar((prev) => ({
            ...prev,
            open: true,
            severity: "error",
            message: "Error Registering with Email. Try Again.",
        }));
    }
};

const sendEmailVerification = async (
    userData,
    setSnackbar,
    setOpenModal,
    parentBusinessId,
    childBusinessId,
    businessInfo,
    url,
    setUserData
) => {
    let businessId = !childBusinessId ? parentBusinessId : childBusinessId;

    // activate loading spinner
    setUserData((prev) => ({
        ...prev,
        loading: true,
    }));

    try {
        // Create a query to get business relationship
        const userRef = collection(db, "users");
        //
        const q = query(userRef, where("email", "==", userData.email));
        //
        const userSnapshot = await getDocs(q);

        if (userSnapshot.empty) {
            // If no user exists, then check nonVerified User table
            // Create a query to get business relationship
            const nonVerifiedUserRef = collection(db, "nonVerifiedUsers");
            //
            const q = query(
                nonVerifiedUserRef,
                where("email", "==", userData.email)
            );
            //
            const nonVerifiedUserSnapshot = await getDocs(q);

            // If never previously sent a email verification mail
            if (nonVerifiedUserSnapshot.empty) {
                // If no nonVerifiedUser exists, then OK to add user to nonVerifiedUser collection and send verification email

                // Get a new write batch
                const batch = writeBatch(db);

                // TODO: Add user
                // Generate firestore ID for new User
                const newNonVerifiedUserRef = doc(
                    collection(db, "nonVerifiedUsers")
                );
                // Set userData to that id
                batch.set(newNonVerifiedUserRef, {
                    firstName: userData.name,
                    email: userData.email,
                    parentBusinessId,
                    businessId,
                    timestamp: Timestamp.now(),
                    businessName: businessInfo.businessName,
                    logoUrl: businessInfo.logoUrl,
                });

                // TODO: Add relationship
                // Generate firestore ID for new User
                const verifyEmailRef = doc(collection(db, "verifyEmails"));

                const emailData = {
                    to: [
                        {
                            email: userData.email,
                            name: userData.name,
                        },
                    ],
                    from: {
                        email: "info@rewardclub.us",
                        name: businessInfo.businessName,
                    },
                    subject: `Please Verify your Email - ${businessInfo.businessName} Rewards`,
                    html: `<p>Hi ${userData.name}, </p><br /> Please <a href="http://${url}/verify-email/${businessId}/${newNonVerifiedUserRef.id}">click this Link<a> to verify your email`,
                    text: "Please click link below.",
                    timestamp: Timestamp.now(),
                };

                // Add email data to verifyEmail collection to send email
                batch.set(verifyEmailRef, emailData);

                // Commit the batch
                await batch.commit();

                // Open respone modal
                setOpenModal(true);
                // clear out registration info
                setUserData((prev) => ({
                    ...prev,
                    loading: false,
                }));

                // nonVerified User exists RESEND verification email && DO NOT add to nonVerifiedUser table
            } else {
                // nonVerified User exists RESEND verification email && DO NOT add to nonVerifiedUser table
                let nonVerifiedUserData;
                // Save found record
                nonVerifiedUserSnapshot.forEach((doc) => {
                    nonVerifiedUserData = { id: doc.id, ...doc.data() };
                });

                // email data from previous record to be resent
                const emailData = {
                    to: [
                        {
                            email: nonVerifiedUserData.email,
                            name: nonVerifiedUserData.firstName,
                        },
                    ],
                    from: {
                        email: "info@rewardclub.us",
                        name: businessInfo.businessName,
                    },
                    subject: `Please Verify your Email - ${businessInfo.businessName} Rewards`,
                    html: `<p>Hi ${userData.name}, </p><br /> Please <a href="http://${url}/verify-email/${businessId}/${nonVerifiedUserData.id}">click this Link<a> to verify your email`,
                    text: "Please click link below.",
                    timestamp: Timestamp.now(),
                };

                // Add a new document with a generated id.
                const resendVerifyEmailRef = await addDoc(
                    collection(db, "verifyEmails"),
                    emailData
                );

                if (resendVerifyEmailRef.id) {
                    // Resend Successful. Return Success Snackbar
                    setSnackbar((prev) => ({
                        ...prev,
                        open: true,
                        severity: "success",
                        message: "Please Check Your Email to Complete Signup",
                    }));
                    // clear out registration info
                    setUserData((prev) => ({
                        ...prev,
                        loading: false,
                    }));
                } else {
                    // Failed to resend email verification by way of adding doc to verifyEmail collection
                    setSnackbar((prev) => ({
                        ...prev,
                        open: true,
                        severity: "error",
                        message:
                            "Verification Previously Sent. Error Resending.",
                    }));
                }
            }
        } else {
            // User already exists. Return Error Snackbar
            setSnackbar((prev) => ({
                ...prev,
                open: true,
                severity: "error",
                message: "You've Already Signed Up. Go Ahead and Login",
            }));
            setUserData((prev) => ({
                ...prev,
                loading: false,
            }));
        }
    } catch (error) {
        console.log("Error Registering with Email: ", error);
        setSnackbar((prev) => ({
            ...prev,
            open: true,
            severity: "error",
            message: "Error Registering with Email. Try Again.",
        }));
    }
};

const verifyUser = async (docId, setSnackbar) => {
    try {
        let recordData;
        const docRef = doc(db, "nonVerifiedUsers", docId);

        const docSnap = await getDoc(docRef);

        // If doc exists then batch write to create user, create business relationship, and delete
        // nonVerified user record
        if (docSnap.exists()) {
            recordData = docSnap.data();

            // Get a new write batch
            const batch = writeBatch(db);

            // Genereate Id for new user in Users table
            const newUserRef = doc(collection(db, "users"));

            // set the Doc with the users details
            batch.set(newUserRef, {
                firstName: recordData.firstName,
                email: recordData.email,
                timestamp: Timestamp.now(),
            });

            // Generate Id for new business relationship in businessCustomerRelationship table
            const newRelationshipRef = doc(
                collection(db, "businessCustomerRelationships")
            );
            // set relationship info
            let relationshipInfo = {
                businessId: recordData.businessId,
                parentBusinessId: recordData.parentBusinessId,
                checkInLog: [
                    { pointsAfterCheckIn: 1, timestamp: Timestamp.now() },
                ],
                currentPoints: 1,
                customerId: newUserRef.id,
                redemptionLog: [],
                timestamp: Timestamp.now(),
            };
            // set the Doc with the new relationship details
            batch.set(newRelationshipRef, relationshipInfo);

            // Delete the nonVerifiedUser Record
            const nonVerifiedUserRef = doc(db, "nonVerifiedUsers", docId);
            batch.delete(nonVerifiedUserRef);

            // Commit the batch
            await batch.commit();

            setSnackbar((prev) => ({
                ...prev,
                open: true,
                severity: "success",
                message: "Verification Successful.",
            }));
            return recordData;
        } else {
            // docSnap.data() will be undefined in this case

            setSnackbar((prev) => ({
                ...prev,
                open: true,
                severity: "error",
                message: "No Records Found. Try logging in with your Email.",
            }));

            return null;
        }
    } catch (error) {
        console.log("Error Getting Unverified User: ", error);
        setSnackbar((prev) => ({
            ...prev,
            open: true,
            severity: "error",
            message: "Error Verying New User.",
        }));
    }
};

const getBusinessInfo = async (businessId) => {
    const docRef = doc(db, "shops", businessId);

    try {
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { ...docSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.log("error getting business info at verify: ", error);
    }
};

const getCheckinRecord = async (userData, businessId, setSnackbar) => {
    const { cellphone, email } = userData;

    // clean the input for any non-digit values.
    const phoneNumber = cellphone.replace(/[^\d]/g, "");

    console.log("Eser data: ", phoneNumber, email);

    if (cellphone && cellphone.length < 10) {
        setSnackbar({
            open: true,
            severity: "error",
            message: "Cellphone Number Incomplete",
        });
        return;
    } else if (email && (!email.includes("@") || !email.includes("."))) {
        setSnackbar({
            open: true,
            severity: "error",
            message: "Invalid Email",
        });
        return;
    }

    try {
        const userRecord = await getUser(phoneNumber, userData.email);

        if (!userRecord) {
            setSnackbar({
                open: true,
                severity: "error",
                message: "No Customer Record Found",
            });
            return null;
        } else {
            const relationshipRecord = await getRelationshipInfo(
                userRecord.userId,
                businessId,
                setSnackbar
            );

            if (!relationshipRecord) {
                setSnackbar({
                    open: true,
                    severity: "error",
                    message: "Customer Has No Checkins Here",
                });

                return null;
            } else {
                console.log("relationship record at lib: ", relationshipRecord);
                return { ...userRecord, ...relationshipRecord };
            }
        }
    } catch (error) {
        console.log("Error Getting Checkin Record: ", error);
    }
};
export {
    formatPhoneNumber,
    getUser,
    getRelationshipInfo,
    addPoint,
    addRelationship,
    registerNewUser,
    sendEmailVerification,
    verifyUser,
    getBusinessInfo,
    getCheckinRecord,
};
