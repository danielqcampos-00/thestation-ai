// TODO: Preencher com as credenciais do projeto Firebase
// Obtidas em: Firebase Console → Configurações do projeto → Seus aplicativos → SDK

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const firebaseConfig = {
  apiKey:            'FIREBASE_API_KEY',
  authDomain:        'FIREBASE_PROJECT_ID.firebaseapp.com',
  projectId:         'FIREBASE_PROJECT_ID',
  storageBucket:     'FIREBASE_PROJECT_ID.appspot.com',
  messagingSenderId: 'FIREBASE_MESSAGING_SENDER_ID',
  appId:             'FIREBASE_APP_ID',
};

const app = initializeApp(firebaseConfig);
export const db  = getFirestore(app);
export const auth = getAuth(app);
