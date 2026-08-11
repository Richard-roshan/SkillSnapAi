import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { INITIAL_COURSES } from './src/lib/mockCourses';

const firebaseConfig = {
  apiKey: 'AIzaSyDemoPlaceholderKeySkillsSnapAI',
  authDomain: 'skillsnap-ai-demo.firebaseapp.com',
  projectId: 'skillsnap-ai-demo',
  storageBucket: 'skillsnap-ai-demo.appspot.com',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:abcdef123456'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runDirectVerification() {
  console.log('----------------------------------------------------');
  console.log('🔍 [Direct Firestore Read #1] Checking "courses" collection...');
  let snap = await getDocs(collection(db, 'courses'));
  console.log(`📊 Initial Document Count in Firestore: ${snap.size}`);
  snap.docs.forEach((d, idx) => {
    const data = d.data();
    console.log(`   ${idx + 1}. Doc ID: ${d.id} | Name: "${data.name}" | Category: "${data.category}"`);
  });

  console.log('----------------------------------------------------');
  console.log(`🌱 [Direct Firestore Seeding] Writing all ${INITIAL_COURSES.length} courses to Firestore...`);
  for (const course of INITIAL_COURSES) {
    await setDoc(doc(db, 'courses', course.id), course, { merge: true });
  }
  console.log(`✅ Finished setDoc calls for ${INITIAL_COURSES.length} courses.`);

  console.log('----------------------------------------------------');
  console.log('🔍 [Direct Firestore Read #2] Re-querying "courses" collection...');
  snap = await getDocs(collection(db, 'courses'));
  console.log(`🎉 VERIFIED DOCUMENT COUNT IN FIRESTORE: ${snap.size}`);
  
  const categoryCounts: Record<string, number> = {};
  snap.docs.forEach((d, idx) => {
    const data = d.data();
    const cat = data.category || 'Uncategorized';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    console.log(`   ${idx + 1}. Doc ID: ${d.id} | Name: "${data.name}" | Category: "${cat}"`);
  });

  console.log('----------------------------------------------------');
  console.log('📊 FIRESTORE CATEGORY BREAKDOWN:');
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    console.log(`   • ${cat}: ${count} course(s)`);
  });
  console.log('----------------------------------------------------');
}

runDirectVerification().then(() => {
  console.log('✅ DIRECT FIRESTORE VERIFICATION SUCCESSFUL!');
  process.exit(0);
}).catch(err => {
  console.error('❌ DIRECT FIRESTORE VERIFICATION FAILED:', err);
  process.exit(1);
});
