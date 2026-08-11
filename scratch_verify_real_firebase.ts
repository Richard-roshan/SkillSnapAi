import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { INITIAL_COURSES } from './src/lib/mockCourses';
import * as fs from 'fs';
import * as path from 'path';

// Manual .env parser
const envPath = path.resolve(process.cwd(), '.env');
const envVars: Record<string, string> = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      envVars[key] = val;
    }
  });
}

const firebaseConfig = {
  apiKey: envVars.VITE_FIREBASE_API_KEY,
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.VITE_FIREBASE_APP_ID
};

console.log('🔥 Initializing Real Firebase Client for project:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function verifyRealFirestore() {
  console.log('🔑 Authenticating with Firebase Auth...');
  try {
    const userCred = await signInAnonymously(auth);
    console.log(`✅ Authenticated UID: ${userCred.user.uid}`);
  } catch (err: any) {
    console.warn('⚡ Anonymous auth failed (may be disabled in console):', err?.message);
  }

  console.log('====================================================');
  console.log(`🌱 Seeding ${INITIAL_COURSES.length} courses to real Cloud Firestore...`);
  for (const course of INITIAL_COURSES) {
    const docRef = doc(db, 'courses', course.id);
    await setDoc(docRef, course, { merge: true });
  }
  console.log('✅ Seeding setDoc calls completed!');

  console.log('----------------------------------------------------');
  console.log('🔍 Querying collection "courses" from real Cloud Firestore...');
  const coursesSnap = await getDocs(collection(db, 'courses'));
  console.log(`📊 REAL FIRESTORE DOCUMENT COUNT IN "courses": ${coursesSnap.size}`);
  coursesSnap.docs.forEach((d, idx) => {
    const data = d.data();
    console.log(`   ${idx + 1}. Doc ID: "${d.id}" | Name: "${data.name}" | Category: "${data.category}"`);
  });

  console.log('----------------------------------------------------');
  console.log('🌱 Seeding initial demo enrollment to real Cloud Firestore...');
  const demoEnrollment = {
    id: 'en_course-1_user-demo-123',
    userId: 'user-demo-123',
    courseId: 'course-1',
    progressPercent: 66,
    completedLessonIds: ['c1-l1', 'c1-l2'],
    lastAccessedAt: new Date().toISOString(),
    completionDate: null,
    certificateStatus: 'none'
  };
  await setDoc(doc(db, 'enrollments', demoEnrollment.id), demoEnrollment, { merge: true });

  console.log('🔍 Querying collection "enrollments" from real Cloud Firestore...');
  const enrollmentsSnap = await getDocs(collection(db, 'enrollments'));
  console.log(`📊 REAL FIRESTORE DOCUMENT COUNT IN "enrollments": ${enrollmentsSnap.size}`);
  enrollmentsSnap.docs.forEach((d, idx) => {
    const data = d.data();
    console.log(`   ${idx + 1}. Doc ID: "${d.id}" | courseId: "${data.courseId}" | userId: "${data.userId}" | progress: ${data.progressPercent}%`);
  });
  console.log('====================================================');
}

verifyRealFirestore().then(() => {
  console.log('🎉 REAL FIRESTORE VERIFICATION PASSED SUCCESSFULLY!');
  process.exit(0);
}).catch(err => {
  console.error('❌ REAL FIRESTORE VERIFICATION FAILED:', err);
  process.exit(1);
});
