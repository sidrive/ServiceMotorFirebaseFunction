/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
// admin.initializeApp(functions.config().firebase);
admin.initializeApp();
const rp = require('request-promise');
const promisePool = require('es6-promise-pool');
const PromisePool = promisePool.PromisePool;
const secureCompare = require('secure-compare');
// Maximum concurrent account deletions.
const MAX_CONCURRENT = 3;

// Keeps track of the length of the 'likes' child list in a separate property.
exports.countJumlahMotor = functions.database.ref('motors/{uid}/{motorid}').onWrite((change, context) => {
  // const collectionRef = change.data.adminRef.root;
  const uid    = context.params.uid;
  const countRef = admin.database().ref('users/'+uid+'/totalMotor');

  let increment;
  if (change.after.exists() && !change.before.exists()) {
    increment = 1;
  } else if (!change.after.exists() && change.before.exists()) {
    increment = -1;
  } else {
    return null;
  }

  // Return the promise from countRef.transaction() so our function
  // waits for this async event to complete before it exits.
  return countRef.transaction((current) => {
    return (current || 0) + increment;
  }).then(() => {
    return console.log('Jumlah Motor updated.');
  });
});

// exports.recountMotor = functions.database.ref('users/{uid}/totalMotor').onWrite(event => {
  
//   const collectionRef = event.data.adminRef.root;
//   const uid    = event.params.uid;
//   const countRef = collectionRef.child('users/'+uid+'/totalMotor');
//   const cRef = collectionRef.child('motors'+uid);

//   return cRef.once('value')
//         .then(messagesData => countRef.set(messagesData.numChildren())).then(() => {
//     console.log('Total Skill updated');
//   });
  
// });

// exports.recountMotor = functions.database.ref('users/{uid}/totalMotor').onWrite((change, context) => {
//   if (change.data.exists()) {
//     const collectionRef = change.data.adminRef.root;
//   const uid    = change.params.uid;
//   const countRef = collectionRef.child('users/'+uid+'/totalMotor');
//   const cRef = collectionRef.child('motors/'+uid);
    

//     // Return the promise from counterRef.set() so our function
//     // waits for this async event to complete before it exits.
//     return cRef.once('value')
//       .then((messagesData) => countRef.set(messagesData.numChildren())).then(() =>{ return console.log('Total update');});
      
//   }
//   return null;
// });

exports.recountMotor = functions.database.ref('users/{uid}/totalMotor').onWrite((change, context) => {
    
  const uid    = context.params.uid;
  const countRef = admin.database().ref('users/'+uid+'/totalMotor');
  const cRef = admin.database().ref('motors/'+uid);

  // Return the promise from counterRef.set() so our function
  // waits for this async event to complete before it exits.
  return cRef.once('value')
  .then((messagesData) => countRef.set(messagesData.numChildren())).then(() =>{ return console.log('Total Motor update');});
});


exports.kilometerMotor = functions.https.onRequest((req, res) => {
  const key = req.query.key;

  // Exit if the keys don't match
  if (!secureCompare(key, functions.config().cron.key)) {
    console.log('The key provided in the request does not match the key set in the environment. Check that', key,
      'matches the cron.key attribute in `firebase env:get`');
    res.status(403).send('Security key does not match. Make sure your "key" URL query parameter matches the ' +
      'cron.key environment variable.');
    return null;
  }
  var query = admin.database().ref("users").orderByKey();
  query.once("value")
  .then(snapshot => {
    snapshot.forEach(childSnapshot => {
      // key will be "ada" the first time and "alan" the second time
      var key = childSnapshot.key;
      // childData will be the actual contents of the child
      var childData = childSnapshot.val();
      
      getMotor(key);
      
    }); 
    return null;
  }).catch();
    
  return res.send('finish');
  // Fetch all user details.
  // return getUsers();
});

function getMotor(key){
  let motor, motors = [];
      const oldItemsQuery = admin.database().ref('/motors/'+key).orderByKey();
      oldItemsQuery.once('value').then(snapshot => {
        // create a map with all children that need to be removed
        
        snapshot.forEach((childSnapshot) => {
          motor = childSnapshot.val();
          console.log("Data motor : "+motor.idmotor);
          motors.push(motor);
          
          var kilometer = 2*(motor.km_ratarata) + motor.km_now;
        console.log("Km motor "+kilometer);
        const query = admin.database().ref('/motors/'+key+'/'+motor.idmotor).update({km_now: kilometer});
        });
        // console.log(motors.length + " motor retrieved");
        // console.log("ID Motor: "+motor.idmotor);
        

        return true;
        
  }).catch();
}



exports.notifServiceMotor = functions.https.onRequest((req, res) => {
  const key = req.query.key;

  // Exit if the keys don't match
  if (!secureCompare(key, functions.config().cron.key)) {
    console.log('The key provided in the request does not match the key set in the environment. Check that', key,
      'matches the cron.key attribute in `firebase env:get`');
    res.status(403).send('Security key does not match. Make sure your "key" URL query parameter matches the ' +
      'cron.key environment variable.');
    return null;
  }
  var query = admin.database().ref("users").orderByKey();
  query.once("value")
  .then(snapshot => {
    snapshot.forEach(childSnapshot => {
      // key will be "ada" the first time and "alan" the second time
      var key = childSnapshot.key;
      // childData will be the actual contents of the child
      var childData = childSnapshot.val();
      
      getDataMotor(childData,key);
      
    }); 
    return null;
  }).catch();
    
  return res.send('finish');
  // Fetch all user details.
  // return getUsers();
});


function getDataMotor(childData,key){
  let motor, motors = [];
      const oldItemsQuery = admin.database().ref('/motors/'+key).orderByKey();
      oldItemsQuery.once('value').then(snapshot => {
        // create a map with all children that need to be removed
        
        snapshot.forEach((childSnapshot) => {
          motor = childSnapshot.val();
          console.log("Data motor : "+motor.idmotor);
          console.log("Data User :"+childData.uid);
          console.log("Data U :"+motor.km_NextService+"-"+motor.km_now);
          var selisihKM = motor.km_NextService-motor.km_now;
          console.log("Data s :"+selisihKM);
          motors.push(motor);
          // sendNotif(motor,childData);
          if(selisihKM <=700){
            var status = "limitKm"
            sendNotif(motor,childData,status);
          }
        //   var kilometer = 2*(motor.km_ratarata) + motor.km_now;
        // console.log("Km motor "+kilometer);
        // const query = admin.database().ref('/motors/'+key+'/'+motor.idmotor).update({km_now: kilometer});
        });
        // console.log(motors.length + " motor retrieved");
        // console.log("ID Motor: "+motor.idmotor);     

        return true;
        
  }).catch();
}

function sendNotif(motor,childData,status) {

    const userID = childData.uid;
    // const orderID = order.oid;

  
      // Get the list of device notification tokens.
      const getUserTokensPromise = admin.database().ref(`users/${userID}/userTokens`).once('value');

      // Get the Siswa profile.
      const getUserProfilePromise = admin.auth().getUser(userID);

      return Promise.all([getUserTokensPromise, getUserProfilePromise]).then(results => {
      const tokensSnapshot = results[0];
      const user = results[1]; 

    // Check if there are any device tokens.
    if (!tokensSnapshot.hasChildren()) {
      return console.log('There are no notification tokens to send to.');
    }
    console.log('There are', tokensSnapshot.numChildren(), 'tokens to send notifications to.');
    console.log('User data', user);

    // Notification details.
    if (status === "limitPajak"){
      const titleNotifications = 'Jangan Lupa PAJAK !!';
      const bodyMessage = `${user.displayName} Jangan Lupa Bayar Pajak Motor Anda ${motor.merk} ${motor.plat},` || user.photoURL;  
      const payload = {
        data: {  
              orderid: motor.idmotor,            
          },
        notification: {
          title: titleNotifications,
          body: bodyMessage,
          sound: `default`,
          icon: `ic_add`,
          color: 'red',
          priority: `high`,
          vibrate: `[0,250,200,250]`,
          timeToLive: `60 * 60 * 24`
        }
      };
  
      
      // Listing all tokens.
      const tokens = Object.keys(tokensSnapshot.val());
  
      send(tokens,payload);
    }
    if (status === "limitKm"){
      const titleNotifications = 'Jangan Lupa SERVICE !!';
      const bodyMessage = `${user.displayName} Jangan Lupa Service Motor Anda ${motor.merk} ${motor.plat},` || user.photoURL;
      
      const payload = {
        data: {  
              orderid: motor.idmotor,            
          },
        notification: {
          title: titleNotifications,
          body: bodyMessage,
          sound: `default`,
          icon: `ic_add`,
          color: 'red',
          priority: `high`,
          vibrate: `[0,250,200,250]`,
          timeToLive: `60 * 60 * 24`
        }
      };
  
      
      // Listing all tokens.
      const tokens = Object.keys(tokensSnapshot.val());
  
      send(tokens,payload);
    }
    if (status === "limitTglservice"){
      const titleNotifications = 'Jangan Lupa SERVICE !!';
      const bodyMessage = `${user.displayName} Jangan Lupa Service Motor Anda ${motor.merk} ${motor.plat},` || user.photoURL;

      const payload = {
        data: {  
              orderid: motor.idmotor,            
          },
        notification: {
          title: titleNotifications,
          body: bodyMessage,
          sound: `default`,
          icon: `ic_add`,
          color: 'red',
          priority: `high`,
          vibrate: `[0,250,200,250]`,
          timeToLive: `60 * 60 * 24`
        }
      };
  
      
      // Listing all tokens.
      const tokens = Object.keys(tokensSnapshot.val());
  
      send(tokens,payload);
    }    
    
    return true;
  });  
    
  // Notification(pri=2 contentView=null vibrate=[0,250,200,250] sound=android.resource://com.facebook.katana/raw2/new_facebook_ringtone_7 tick defaults=0x0 flags=0x11 color=0xff4267b2 vis=PRIVATE)
  function send(tokens,payload){
    const options = {
        priority: 'high',
        vibrate: [0,250,200,250],
        timeToLive: 60 * 60 * 24,
        actions: [
          {action: 'explore', title: 'Explore this new world',
            icon: 'images/checkmark.png'},
          {action: 'close', title: 'Close notification',
            icon: 'images/xmark.png'},
        ]
};
  // Send notifications to all tokens.
    return admin.messaging().sendToDevice(tokens, payload, options).then(response => {
      // For each message check if there was an error.
      const tokensToRemove = [];
      response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
          console.error('Failure sending notification to', tokens[index], error);
          // Cleanup the tokens who are not registered anymore.
          if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
            tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
          }
        }
      });
      return Promise.all(tokensToRemove);
    });
  }
}


exports.notifBayarPajak = functions.https.onRequest((req, res) => {
  const key = req.query.key;

  // Exit if the keys don't match
  if (!secureCompare(key, functions.config().cron.key)) {
    console.log('The key provided in the request does not match the key set in the environment. Check that', key,
      'matches the cron.key attribute in `firebase env:get`');
    res.status(403).send('Security key does not match. Make sure your "key" URL query parameter matches the ' +
      'cron.key environment variable.');
    return null;
  }
  var query = admin.database().ref("users").orderByKey();
  query.once("value")
  .then(snapshot => {
    snapshot.forEach(childSnapshot => {
      // key will be "ada" the first time and "alan" the second time
      var key = childSnapshot.key;
      // childData will be the actual contents of the child
      var childData = childSnapshot.val();
      
      getTglPajak(childData,key);
      
    }); 
    return null;
  }).catch();
    
  return res.send('finish');
  // Fetch all user details.
  // return getUsers();
});

function getTglPajak(childData,key){
  let motor, motors = [];
      const oldItemsQuery = admin.database().ref('/motors/'+key).orderByKey();
      oldItemsQuery.once('value').then(snapshot => {
        // create a map with all children that need to be removed
        
        snapshot.forEach((childSnapshot) => {
          motor = childSnapshot.val();
          console.log("Data motor : "+motor.idmotor);
          console.log("Data User :"+childData.uid);

          var today = new Date().getTime();
          var difference = motor.tahun_pajak - today;
          var daysDifference = Math.floor(difference/1000/60/60/24);
          difference -= daysDifference*1000*60*60*24

          var d = new Date(today);
          var e = new Date(motor.tahun_pajak);
          
          console.log("Today : "+d);
          console.log("Tgl Pajak : "+e);
          console.log("Data tanggal1 :"+daysDifference);
          motors.push(motor);
          
          if(daysDifference <=15){
            var status = "limitPajak";
            sendNotif(motor,childData,status);
          }
        
        });
        // console.log(motors.length + " motor retrieved");
        // console.log("ID Motor: "+motor.idmotor);     

        return true;
        
  }).catch();
}