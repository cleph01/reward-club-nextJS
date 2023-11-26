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
                cellphone ? "cellphone" : "email",
                "==",
                cellphone ? `+1${cellphone}` : email
            )
        );
        //
        const userSnapshot = await getDocs(q);

        //
        if (userSnapshot.empty) {
            console.log("UserInfo Not Found");
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
            // Open snack bar with error message for Relationshipt Not existing
            setSnackbar((prev) => ({
                ...prev,
                open: true,
                severity: "error",
                message: "You've Not Signed Up Here",
            }));

            console.log("Relationship Not Found");
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

        let newPoints = user.data.currentPoints + 1;

        if (newPoints >= rewardThreshold) {
            newPoints = 0;
        }

        const relationshipData = {
            businessId,
            customerId: user.userId,
            parentBusinessId,
            currentPoints: newPoints,
            checkInLog: [
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

        console.log("Document written with ID: ", docRef.id);

        // return the new relationshipInfo
        return {
            relationshipId: docRef.id,
            currentPoints: user.data.currentPoints,
            newPoints,
            checkInLog: [
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
        console.log("Error Creating Relationship: ", error);
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
    businessInfo
) => {
    try {
        // Create a query to get business relationship
        const userRef = collection(db, "users");
        //
        const q = query(userRef, where("email", "==", userData.email));
        //
        const userSnapshot = await getDocs(q);

        if (userSnapshot.empty) {
            // If no user exists, then add user to tempUser collection and send verification email

            // Get a new write batch
            const batch = writeBatch(db);

            // TODO: Add user
            // Generate firestore ID for new User
            const newUserRef = doc(collection(db, "nonVerifiedUsers"));
            // Set userData to that id
            batch.set(newUserRef, {
                firstName: userData.name,
                email: userData.email,
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
                    email: "from@example.com",
                    name: "From name",
                },
                subject: `Please Verify your Email - ${businessInfo.businessName} Rewards`,
                html: `Please <a href="http://localhost:3000/verify-email/${verifyEmailRef.id}">click this Link<a> to verify your email`,
                text: "Please click link below.",
                parentBusinessId,
                childBusinessId,
            };

            // Add email data to verifyEmail collection to send
            batch.set(verifyEmailRef, emailData);

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

const getUnverifiedUser = async (docId) => {
    try {
        let userInfo;
        const docRef = doc(db, "nonVerifiedUsers", docId);

        const docSnap = await getDoc(docRef);

        console.log("docSnap: ", docSnap);
        if (docSnap.exists()) {
            userInfo = docSnap.data();

            return userInfo;
        } else {
            // docSnap.data() will be undefined in this case
            console.log("No such document!");

            return null;
        }
    } catch (error) {
        console.log("Error Getting Unverified User: ", error);
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
    getUnverifiedUser,
};
