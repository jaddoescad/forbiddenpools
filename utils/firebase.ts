// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: 'AIzaSyCURTsD4EwmHxGRXlTF7xftLMEjCq6BChA',
    authDomain: 'tracer-dao.firebaseapp.com',
    projectId: 'tracer-dao',
    storageBucket: 'tracer-dao.appspot.com',
    messagingSenderId: '824988599017',
    appId: '1:824988599017:web:5a921e78ed788a0862a678',
    measurementId: 'G-ZB697MP6FJ',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
