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
admin.initializeApp(functions.config().firebase);
const rp = require('request-promise');
const promisePool = require('es6-promise-pool');
const PromisePool = promisePool.PromisePool;
const secureCompare = require('secure-compare');
// Maximum concurrent account deletions.
const MAX_CONCURRENT = 3;

// Keeps track of the length of the 'likes' child list in a separate property.
exports.countJumlahMotor = functions.database.ref('motors/{uid}/{motorid}').onWrite((event) => {
  const collectionRef = event.data.adminRef.root;
  const uid    = event.params.uid;
  const countRef = collectionRef.child('users/'+uid+'/totalMotor');

  let increment;
  if (event.data.exists() && !event.data.previous.exists()) {
    increment = 1;
  } else if (!event.data.exists() && event.data.previous.exists()) {
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

exports.recountMotor = functions.database.ref('users/{uid}/totalMotor').onWrite((event) => {
  if (event.data.exists()) {
    const collectionRef = event.data.adminRef.root;
  const uid    = event.params.uid;
  const countRef = collectionRef.child('users/'+uid+'/totalMotor');
  const cRef = collectionRef.child('motors/'+uid);
    

    // Return the promise from counterRef.set() so our function
    // waits for this async event to complete before it exits.
    return cRef.once('value')
      .then((messagesData) => countRef.set(messagesData.numChildren())).then(() =>{ return console.log('Total update');});
      
  }
  return null;
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
