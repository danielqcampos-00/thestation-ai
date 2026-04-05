// TODO: Preencher com as credenciais do projeto Firebase
// Obtidas em: Firebase Console → Configurações do projeto → Seus aplicativos → SDK

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const firebaseConfig = {
  apiKey:            'AIzaSyCwv3wVD_LcgZG1TQGrQzjV9hcpnk_NCi4',
  authDomain:        'thestation-ai.firebaseapp.com',
  projectId:         'thestation-ai',
  storageBucket:     'thestation-ai.firebasestorage.app',
  messagingSenderId: '202965955584',
  appId:             '1:202965955584:web:a198785bfdc25188d454e5',
};

const app = initializeApp(firebaseConfig);
export const db  = getFirestore(app);
export const auth = getAuth(app);
