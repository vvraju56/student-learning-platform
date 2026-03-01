const { initializeApp } = require('firebase/app');
const { getFirestore, getDocs, collection, doc, deleteDoc } = require('firebase/firestore');
const { getDatabase, ref, set, remove } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyDrR3hSIVVGqLqOtC3P2q-hT8qqV6hYq0",
  authDomain: "mega-learning-platform.firebaseapp.com",
  databaseURL: "https://mega-learning-platform-default-rtdb.firebaseio.com",
  projectId: "mega-learning-platform",
  storageBucket: "mega-learning-platform.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const rtdb = getDatabase(app);

async function resetAllProgress() {
  console.log('🗑️ Starting to reset all progress...\n');

  try {
    // 1. Reset Firestore profiles collection
    console.log('📊 Resetting Firestore profiles...');
    const profilesSnapshot = await getDocs(collection(db, 'profiles'));
    for (const profileDoc of profilesSnapshot.docs) {
      const profileRef = doc(db, 'profiles', profileDoc.id);
      await deleteDoc(profileRef);
    }
    console.log(`✅ Deleted ${profilesSnapshot.size} profiles from Firestore`);

    // 2. Reset Firestore video_progress collection
    console.log('🎬 Resetting Firestore video_progress...');
    const videoProgressSnapshot = await getDocs(collection(db, 'video_progress'));
    for (const vpDoc of videoProgressSnapshot.docs) {
      const vpRef = doc(db, 'video_progress', vpDoc.id);
      await deleteDoc(vpRef);
    }
    console.log(`✅ Deleted ${videoProgressSnapshot.size} video progress entries`);

    // 3. Reset Firestore email_verifications collection
    console.log('📧 Resetting Firestore email_verifications...');
    try {
      const emailVerifSnapshot = await getDocs(collection(db, 'email_verifications'));
      for (const evDoc of emailVerifSnapshot.docs) {
        const evRef = doc(db, 'email_verifications', evDoc.id);
        await deleteDoc(evRef);
      }
      console.log(`✅ Deleted ${emailVerifSnapshot.size} email verification entries`);
    } catch (e) {
      console.log('⚠️ email_verifications collection may not exist');
    }

    // 4. Reset Realtime Database
    console.log('🔥 Resetting Realtime Database...');
    const rtdbPaths = [
      'users',
      'video_progress'
    ];
    
    for (const path of rtdbPaths) {
      await remove(ref(rtdb, path));
      console.log(`✅ Removed ${path} from Realtime Database`);
    }

    console.log('\n🎉 All progress has been reset successfully!');
    console.log('📝 Note: Firebase Auth accounts still exist.');
    console.log('   To delete auth accounts, go to Firebase Console > Authentication');

  } catch (error) {
    console.error('❌ Error resetting progress:', error);
  }
}

resetAllProgress();
