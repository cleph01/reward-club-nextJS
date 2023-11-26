const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.scheduledUpdatePin = functions.pubsub
    .schedule("*/2 * * * *")
    .onRun((context) => {
        db.collection("shops")
            .get()
            .then((snapshot) => {
                snapshot.forEach((docRef) => {
                    // Generate Random PIN to update Db

                    const randomPin = Math.floor(Math.random() * 9999);
                    db.collection("shops")
                        .doc(docRef.id)
                        .update({
                            checkinPin: randomPin,
                        })
                        .then(() => {
                            console.log("Successfully Updated Pin");
                        })
                        .catch((error) => {
                            console.log("Error Updating Pin: ", error);
                        });
                });
            })
            .catch((error) => {
                console.log("Error getting Shops: ", error);
            });

        return null;
    });
