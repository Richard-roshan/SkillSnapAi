import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  onSnapshot,
  enableIndexedDbPersistence,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Course, Enrollment, UserProfile } from '../types';
import { INITIAL_COURSES } from './mockCourses';
import { useAppStore } from '../store/useAppStore';

export function getEnrollmentDocId(courseId: string, userId: string): string {
  return `en_${courseId}_${userId}`;
}

// Enable Firestore Offline Persistence
export async function setupOfflinePersistence(): Promise<void> {
  try {
    await enableIndexedDbPersistence(db);
    console.log('⚡ [Firestore] Offline persistence enabled!');
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.warn('⚡ [Firestore] Persistence warning: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('⚡ [Firestore] Persistence warning: Browser lacks IndexedDB support');
    }
  }
}

// Pure Real-Time Listener for User Enrollments via Firestore onSnapshot
export function subscribeToUserEnrollments(
  userId: string,
  onUpdate: (enrollments: Enrollment[]) => void
): Unsubscribe {
  const currentUid = auth.currentUser?.uid || userId;
  const allowedCourseIds = new Set(INITIAL_COURSES.map(c => c.id));
  console.log(`📡 [Firestore Listener] Subscribing to enrollments for userId: "${currentUid}"`);

  const q = query(collection(db, 'enrollments'), where('userId', '==', currentUid));
  
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      console.log(`📡 [Firestore Enrollment Snapshot] Received ${snapshot.size} doc(s)`, {
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites
      });

      if (!snapshot.empty) {
        const validEnrollments: Enrollment[] = [];

        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          const docId = docSnap.id;

          // Prune orphaned enrollment documents referencing deleted courses
          if (!allowedCourseIds.has(data.courseId)) {
            console.log(`🗑️ [Firestore Enrollment Pruning] Deleting orphaned doc: "${docId}" (courseId: ${data.courseId})`);
            try { deleteDoc(doc(db, 'enrollments', docId)); } catch (_) {}
          } else {
            validEnrollments.push({
              id: docId,
              userId: data.userId || currentUid,
              courseId: data.courseId,
              progressPercent: data.progressPercent ?? 0,
              completedLessonIds: data.completedLessonIds || [],
              lastAccessedAt: data.lastAccessedAt || new Date().toISOString(),
              completionDate: data.completionDate || null,
              certificateStatus: data.certificateStatus || 'none',
              certificateUrl: data.certificateUrl || undefined
            });
          }
        });

        console.log(`✅ [Firestore Enrollments] Retained ${validEnrollments.length} valid enrollment(s) matching 4 core courses!`);
        onUpdate(validEnrollments);
      }
    },
    (error) => {
      console.error('❌ [Firestore Enrollment Snapshot Error]:', error);
      useAppStore.getState().addNotification(
        '⚠️ Firestore Snapshot Error',
        `Failed to listen to live enrollments: ${error.message}`,
        'reminder'
      );
    }
  );
}

// Pure Real-Time Listener for Course Catalog via Firestore onSnapshot
export function subscribeToCourses(
  onUpdate: (courses: Course[]) => void
): Unsubscribe {
  const colRef = collection(db, 'courses');
  const allowedIds = new Set(INITIAL_COURSES.map(c => c.id));

  // Attempt initial seeding to Firestore
  seedCoursesToFirestore();

  return onSnapshot(
    colRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const courses: Course[] = snapshot.docs
          .filter(docSnap => allowedIds.has(docSnap.id))
          .map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: data.name,
              description: data.description,
              thumbnailUrl: data.thumbnailUrl,
              durationMinutes: data.durationMinutes,
              category: data.category,
              level: data.level,
              rating: data.rating,
              studentsCount: data.studentsCount,
              skillsCovered: data.skillsCovered || [],
              lessons: data.lessons || []
            } as Course;
          });

        console.log(`📚 [Firestore Courses Snapshot] Loaded ${courses.length} courses matching active catalog!`);
        onUpdate(courses.length > 0 ? courses : INITIAL_COURSES);
      } else {
        console.warn('⚠️ [Firestore Courses Snapshot] Collection empty in cloud. Seeding default courses...');
        seedCoursesToFirestore();
        onUpdate(INITIAL_COURSES);
      }
    },
    (error) => {
      console.error('❌ [Firestore Courses Snapshot Error]:', error);
      useAppStore.getState().addNotification(
        '⚠️ Firestore Courses Error',
        `Failed to load courses from Firestore: ${error.message}`,
        'reminder'
      );
      onUpdate(INITIAL_COURSES);
    }
  );
}

// Sync enrollment progress update directly to Firestore Cloud DB
export async function syncEnrollmentProgressToFirestore(enrollment: Enrollment): Promise<void> {
  const currentUid = auth.currentUser?.uid || enrollment.userId;
  const docId = getEnrollmentDocId(enrollment.courseId, currentUid);

  console.log(`✏️ [Firestore Write Init] Writing enrollment docId: "${docId}" for UID: "${currentUid}"`, {
    userId: currentUid,
    courseId: enrollment.courseId,
    progressPercent: enrollment.progressPercent,
    completedLessonIds: enrollment.completedLessonIds
  });

  try {
    const docRef = doc(db, 'enrollments', docId);
    await setDoc(docRef, {
      id: docId,
      userId: currentUid,
      courseId: enrollment.courseId,
      progressPercent: enrollment.progressPercent,
      completedLessonIds: enrollment.completedLessonIds,
      lastAccessedAt: new Date().toISOString(),
      completionDate: enrollment.completionDate || null,
      certificateStatus: enrollment.certificateStatus || 'none',
      certificateUrl: enrollment.certificateUrl || null
    }, { merge: true });

    console.log(`✅ [Firestore Write Success] Document "${docId}" updated in cloud!`);
  } catch (e: any) {
    console.error(`❌ [Firestore Write Error] Failed to write document "${docId}":`, e);
    useAppStore.getState().addNotification(
      '❌ Firestore Write Failed',
      `Could not sync enrollment to cloud database: ${e?.message || e}`,
      'reminder'
    );
  }
}

// Sync user profile directly to Firestore Cloud DB
export async function syncUserProfileToFirestore(user: UserProfile): Promise<void> {
  const currentUid = auth.currentUser?.uid || user.uid;
  try {
    const docRef = doc(db, 'users', currentUid);
    await setDoc(docRef, {
      name: user.name,
      email: user.email,
      careerGoal: user.careerGoal,
      targetRole: user.targetRole,
      skills: user.skills,
      resumeScore: user.resumeScore,
      learningStreak: user.learningStreak,
      weeklyGoalHours: user.weeklyGoalHours,
      completedHours: user.completedHours,
      avatarUrl: user.avatarUrl || null,
      createdAt: user.createdAt
    }, { merge: true });
    console.log(`✅ [Firestore User Sync] Profile synced for ${currentUid}`);
  } catch (e: any) {
    console.error('❌ [Firestore User Profile Error]:', e);
    useAppStore.getState().addNotification(
      '❌ Profile Sync Error',
      `Failed to sync user profile: ${e?.message || e}`,
      'reminder'
    );
  }
}

// Seed mock courses to Firestore & Prune Stale Docs
export async function seedCoursesToFirestore(): Promise<void> {
  try {
    const allowedIds = new Set(INITIAL_COURSES.map(c => c.id));
    const snapshot = await getDocs(collection(db, 'courses'));

    for (const docSnap of snapshot.docs) {
      if (!allowedIds.has(docSnap.id)) {
        console.log(`🗑️ [Firestore Pruning] Deleting stale course doc: "${docSnap.id}"`);
        await deleteDoc(doc(db, 'courses', docSnap.id));
      }
    }

    console.log(`🌱 [Firestore Seeding] Upserting ${INITIAL_COURSES.length} courses to live Firestore...`);
    for (const course of INITIAL_COURSES) {
      const docRef = doc(db, 'courses', course.id);
      await setDoc(docRef, course, { merge: true });
    }
    console.log(`✅ [Firestore Seeding Success] All ${INITIAL_COURSES.length} courses written to live Firestore!`);
  } catch (e: any) {
    console.error('❌ [Firestore Courses Seeding Error]:', e);
  }
}

// Seed initial user enrollments to Firestore
export async function seedInitialEnrollmentsToFirestore(
  userId: string,
  defaultEnrollments: Enrollment[]
): Promise<void> {
  // Fresh new-user state starts with 0 enrollments until explicitly enrolled
  return;
}

// ---------------------------------------------------------
// Roadmap Real-Time Firestore Sync
// ---------------------------------------------------------

export async function syncRoadmapToFirestore(userId: string, roadmap: any): Promise<void> {
  const currentUid = auth.currentUser?.uid || userId;
  if (!currentUid || !roadmap) return;
  try {
    const docRef = doc(db, 'users', currentUid, 'roadmap', 'active');
    const stepStatuses = roadmap.steps?.map((s: any) => `${s.id}:${s.status}`).join(', ');
    console.log(`🗺️ [Firestore Roadmap Sync WRITE] UID: "${currentUid}" | Path: "users/${currentUid}/roadmap/active" | Steps: [${stepStatuses}]`);
    await setDoc(docRef, {
      ...roadmap,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`✅ [Firestore Roadmap Sync SUCCESS] Successfully saved roadmap to cloud for UID "${currentUid}"`);
  } catch (e: any) {
    console.error('❌ [Firestore Roadmap Sync Error]:', e);
  }
}

export function subscribeToUserRoadmap(
  userId: string,
  onUpdate: (roadmap: any | null) => void
): Unsubscribe {
  const currentUid = auth.currentUser?.uid || userId;
  console.log(`📡 [Firestore Roadmap Listener INIT] Subscribing to "users/${currentUid}/roadmap/active"`);
  const docRef = doc(db, 'users', currentUid, 'roadmap', 'active');

  return onSnapshot(
    docRef,
    { includeMetadataChanges: true },
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const stepStatuses = data?.steps?.map((s: any) => `${s.id}:${s.status}`).join(', ');
        console.log(`📡 [Firestore Roadmap Snapshot RECEIVED] FromCache: ${snapshot.metadata.fromCache} | PendingWrites: ${snapshot.metadata.hasPendingWrites} | Steps: [${stepStatuses}]`);
        onUpdate(data);
      } else {
        console.log(`📡 [Firestore Roadmap Snapshot EMPTY] No active roadmap doc found for UID "${currentUid}"`);
        onUpdate(null);
      }
    },
    (error) => {
      console.error('❌ [Firestore Roadmap Listener Error]:', error);
    }
  );
}

// ---------------------------------------------------------
// Resume Analysis Real-Time Firestore Sync
// ---------------------------------------------------------

export async function syncResumeAnalysisToFirestore(userId: string, analysis: any): Promise<void> {
  const currentUid = auth.currentUser?.uid || userId;
  if (!currentUid) return;
  try {
    const docRef = doc(db, 'users', currentUid, 'resume_analysis', 'latest');
    await setDoc(docRef, {
      ...analysis,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Also update current resumeScore on user profile doc
    const userDocRef = doc(db, 'users', currentUid);
    await setDoc(userDocRef, {
      resumeScore: analysis.score,
      targetRole: analysis.targetRole,
      lastAnalyzedAt: new Date().toISOString()
    }, { merge: true });

    console.log(`📄 [Firestore Resume Sync] Updated latest resume analysis for UID "${currentUid}" (Score: ${analysis.score})`);
  } catch (e: any) {
    console.error('❌ [Firestore Resume Sync Error]:', e);
  }
}

export function subscribeToUserResumeAnalysis(
  userId: string,
  onUpdate: (analysis: any | null) => void
): Unsubscribe {
  const currentUid = auth.currentUser?.uid || userId;
  console.log(`📡 [Firestore Resume Listener] Listening to resume analysis for UID "${currentUid}"`);
  const docRef = doc(db, 'users', currentUid, 'resume_analysis', 'latest');

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        console.log(`📄 [Firestore Resume Snapshot] Loaded resume analysis (Score: ${data?.score})!`);
        onUpdate(data);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error('❌ [Firestore Resume Listener Error]:', error);
    }
  );
}

// ---------------------------------------------------------
// Activity Log & Dynamic Learning Streak Firestore Sync
// ---------------------------------------------------------

export async function logUserActivity(userId: string, activityType: string): Promise<void> {
  const currentUid = auth.currentUser?.uid || userId;
  if (!currentUid) return;
  const todayStr = new Date().toISOString().split('T')[0];
  try {
    const docRef = doc(db, 'users', currentUid, 'activity_logs', todayStr);
    await setDoc(docRef, {
      date: todayStr,
      lastActivityType: activityType,
      timestamp: new Date().toISOString()
    }, { merge: true });
    console.log(`🔥 [Firestore Activity Log] Recorded "${activityType}" for date ${todayStr}`);
  } catch (e: any) {
    console.warn('⚠️ [Firestore Activity Log Notice]: Could not sync activity log (offline/demo mode):', e?.message || e);
  }
}

export function subscribeToUserActivity(
  userId: string,
  onUpdate: (activityDates: string[]) => void
): Unsubscribe {
  const currentUid = auth.currentUser?.uid || userId;
  const colRef = collection(db, 'users', currentUid, 'activity_logs');

  // Also log today's activity on subscription
  logUserActivity(currentUid, 'app_login');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const dates: string[] = [];
      snapshot.docs.forEach(docSnap => {
        if (docSnap.id) dates.push(docSnap.id);
      });
      console.log(`🔥 [Firestore Activity Snapshot] Loaded ${dates.length} activity date(s) for streak calculation!`);
      onUpdate(dates);
    },
    (error) => {
      console.error('❌ [Firestore Activity Listener Error]:', error);
    }
  );
}

// ---------------------------------------------------------
// User Profile Real-Time Listener
// ---------------------------------------------------------

export function subscribeToUserProfile(
  userId: string,
  onUpdate: (profileData: any) => void
): Unsubscribe {
  const currentUid = auth.currentUser?.uid || userId;
  const docRef = doc(db, 'users', currentUid);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data());
      }
    },
    (error) => {
      console.error('❌ [Firestore User Profile Listener Error]:', error);
    }
  );
}

