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