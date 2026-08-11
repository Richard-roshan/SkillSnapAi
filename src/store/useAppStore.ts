import { create } from 'zustand';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { doc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Course, Enrollment, LearningRoadmap, ResumeAnalysis, AppNotification } from '../types';
import { INITIAL_COURSES } from '../lib/mockCourses';
import {
  syncEnrollmentProgressToFirestore,
  syncUserProfileToFirestore,
  subscribeToUserEnrollments,
  subscribeToCourses,
  setupOfflinePersistence,
  seedInitialEnrollmentsToFirestore,
  getEnrollmentDocId,
  syncRoadmapToFirestore,
  subscribeToUserRoadmap,
  syncResumeAnalysisToFirestore,
  subscribeToUserResumeAnalysis,
  logUserActivity,
  subscribeToUserActivity,
  subscribeToUserProfile
} from '../lib/firebaseService';

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: '🔥 Welcome to SkillSnap AI!',
    message: 'Your real-time e-learning tracker is connected to live Cloud Firestore via real Firebase Authentication.',
    type: 'streak',
    timestamp: new Date().toISOString(),
    read: false
  }
];

interface AppState {
  user: UserProfile | null;
  courses: Course[];
  enrollments: Enrollment[];
  roadmap: LearningRoadmap | null;
  resumeAnalysis: ResumeAnalysis | null;
  notifications: AppNotification[];
  apiKey: string;
  setApiKey: (key: string) => void;
  setUser: (user: UserProfile | null) => void;
  loginDemoUser: () => void;
  logout: () => void;
  enrollInCourse: (courseId: string) => void;
  markLessonComplete: (courseId: string, lessonId: string) => void;
  saveRoadmap: (roadmap: LearningRoadmap) => void;
  saveResumeAnalysis: (analysis: ResumeAnalysis) => void;
  addNotification: (title: string, message: string, type: AppNotification['type'], link?: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  issueCertificate: (courseId: string) => void;
  initRealtimeSync: () => void;
  resetAccountProgress: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null, // Start with null to require real Firebase Auth sign-in
  courses: INITIAL_COURSES,
  enrollments: [],
  roadmap: null,
  resumeAnalysis: null,
  notifications: DEFAULT_NOTIFICATIONS,
  apiKey: typeof localStorage !== 'undefined' ? localStorage.getItem('skillsnap_ai_api_key') || '' : '',

  setApiKey: (key: string) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('skillsnap_ai_api_key', key);
    set({ apiKey: key });
  },

  setUser: (user) => {
    set({ user });
    if (user) {
      syncUserProfileToFirestore(user);
    }
  },

  loginDemoUser: () => {
    // Handled by signInAnonymously in AuthPage
  },

  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null, enrollments: [] });
    } catch (e) {
      console.error('Logout error:', e);
      set({ user: null, enrollments: [] });
    }
  },

  initRealtimeSync: () => {
    const { user } = get();
    setupOfflinePersistence();

    // 1. Subscribe to course updates from live Firestore
    subscribeToCourses((updatedCourses) => {
      set({ courses: updatedCourses });
    });

    // 2. Subscribe to real-time enrollment updates from live Firestore
    if (user) {
      subscribeToUserEnrollments(user.uid, (firestoreEnrollments) => {
        console.log(`🔄 [Store Update] Received ${firestoreEnrollments.length} enrollments from Firestore for UID ${user.uid}`);
        set({ enrollments: firestoreEnrollments });
      });

      // 3. Subscribe to real-time Roadmap updates
      subscribeToUserRoadmap(user.uid, (firestoreRoadmap) => {
        if (firestoreRoadmap) {
          console.log(`🔄 [Store Update] Live Roadmap updated via Firestore snapshot!`);
          set({ roadmap: firestoreRoadmap });
        }
      });

      // 4. Subscribe to real-time Resume Analysis updates
      subscribeToUserResumeAnalysis(user.uid, (firestoreAnalysis) => {
        if (firestoreAnalysis) {
          console.log(`🔄 [Store Update] Live Resume Analysis updated via Firestore snapshot! Score: ${firestoreAnalysis.score}`);
          set({ resumeAnalysis: firestoreAnalysis });
          if (firestoreAnalysis.score) {
            set(state => ({
              user: state.user ? { ...state.user, resumeScore: firestoreAnalysis.score, targetRole: firestoreAnalysis.targetRole || state.user.targetRole } : null
            }));
          }
        }
      });

      // 5. Subscribe to Activity Logs & compute Learning Streak
      subscribeToUserActivity(user.uid, (dates) => {
        if (dates && dates.length > 0) {
          // Sort unique dates ascending
          const sorted = Array.from(new Set(dates)).sort();
          // Calculate consecutive daily streak ending today/yesterday
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          
          let streak = 0;
          let checkDate = sorted.includes(today) ? today : (sorted.includes(yesterday) ? yesterday : null);

          if (checkDate) {
            let cur = new Date(checkDate);
            while (true) {
              const curStr = cur.toISOString().split('T')[0];
              if (sorted.includes(curStr)) {
                streak++;
                cur.setDate(cur.getDate() - 1);
              } else {
                break;
              }
            }
          }

          console.log(`🔥 [Dynamic Streak Calculation] Computed active streak: ${streak} day(s) from ${sorted.length} activity date(s)`);
          set(state => ({
            user: state.user ? { ...state.user, learningStreak: Math.max(streak, 1) } : null
          }));
        }
      });

      // 6. Subscribe to live User Profile updates
      subscribeToUserProfile(user.uid, (profileData) => {
        set(state => ({
          user: state.user ? { ...state.user, ...profileData } : null
        }));
      });
    }
  },

  enrollInCourse: (courseId: string) => {
    const { user, enrollments, addNotification } = get();
    if (!user) return;

    const existing = enrollments.find(e => e.courseId === courseId);
    if (existing) return;

    const docId = getEnrollmentDocId(courseId, user.uid);
    const newEnrollment: Enrollment = {
      id: docId,
      userId: user.uid,
      courseId,
      progressPercent: 0,
      completedLessonIds: [],
      lastAccessedAt: new Date().toISOString(),
      completionDate: null,
      certificateStatus: 'none'
    };

    const course = get().courses.find(c => c.id === courseId);

    set({ enrollments: [...enrollments, newEnrollment] });
    syncEnrollmentProgressToFirestore(newEnrollment);

    addNotification(
      '🎉 Course Enrolled!',
      `You successfully enrolled in "${course?.name || 'New Course'}". Ready to learn!`,
      'course',
      `/courses/${courseId}/lessons/${course?.lessons[0]?.id || ''}`
    );
  },

  markLessonComplete: (courseId: string, lessonId: string) => {
    const { enrollments, courses, user, addNotification, issueCertificate } = get();
    const course = courses.find(c => c.id === courseId);
    if (!course || !user) return;

    let targetDocToSync: Enrollment | undefined = undefined;

    const updatedEnrollments = enrollments.map(en => {
      if (en.courseId !== courseId) return en;

      const completedSet = new Set([...en.completedLessonIds, lessonId]);
      const completedLessonIds = Array.from(completedSet);
      const progressPercent = Math.round((completedLessonIds.length / course.lessons.length) * 100);
      const isCompleted = progressPercent >= 100;

      const docId = en.id || getEnrollmentDocId(courseId, user.uid);

      const updatedEn: Enrollment = {
        ...en,
        id: docId,
        completedLessonIds,
        progressPercent,
        lastAccessedAt: new Date().toISOString(),
        completionDate: isCompleted ? (en.completionDate || new Date().toISOString()) : en.completionDate,
        certificateStatus: isCompleted ? (en.certificateStatus === 'none' ? 'generated' : en.certificateStatus) : en.certificateStatus
      };

      targetDocToSync = updatedEn;
      return updatedEn;
    });

    set({ enrollments: updatedEnrollments });

    if (user?.uid) {
      logUserActivity(user.uid, 'lesson_completed');
    }

    if (targetDocToSync) {
      const syncTarget: Enrollment = targetDocToSync;
      console.log(`⚡ [Mark Complete Action] Writing update to Firestore for docId: "${syncTarget.id}"`);
      syncEnrollmentProgressToFirestore(syncTarget);
    }

    const targetEn = updatedEnrollments.find(e => e.courseId === courseId);
    if (targetEn && targetEn.progressPercent >= 100 && targetEn.certificateStatus !== 'issued') {
      issueCertificate(courseId);
    } else {
      addNotification('✅ Lesson Marked Complete', `Progress updated to ${targetEn?.progressPercent}%`, 'course');
    }
  },

  issueCertificate: (courseId: string) => {
    const { enrollments, courses, user, addNotification } = get();
    const course = courses.find(c => c.id === courseId);
    if (!user) return;

    let targetDocToSync: Enrollment | undefined = undefined;

    const updatedEnrollments = enrollments.map(en => {
      if (en.courseId !== courseId) return en;
      const docId = en.id || getEnrollmentDocId(courseId, user.uid);
      const updatedEn: Enrollment = {
        ...en,
        id: docId,
        certificateStatus: 'issued' as const,
        certificateUrl: `https://skillsnap.ai/certificates/cert-${courseId}-${Date.now()}.png`
      };
      targetDocToSync = updatedEn;
      return updatedEn;
    });

    set({ enrollments: updatedEnrollments });

    if (targetDocToSync) {
      const syncTarget: Enrollment = targetDocToSync;
      syncEnrollmentProgressToFirestore(syncTarget);
    }

    addNotification(
      '🏆 Certificate Unlocked!',
      `Congratulations on graduating from "${course?.name}"! View and download your certificate now.`,
      'course',
      '/profile'
    );
  },

  saveRoadmap: (roadmap) => {
    set({ roadmap });
    const { user } = get();
    if (user) {
      syncRoadmapToFirestore(user.uid, roadmap);
    }
  },

  saveResumeAnalysis: (analysis) => {
    set({ resumeAnalysis: analysis });
    const { user } = get();
    if (user) {
      syncResumeAnalysisToFirestore(user.uid, analysis);
      logUserActivity(user.uid, 'resume_analyzed');
    }
  },

  addNotification: (title, message, type, link) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      link
    };
    set(state => ({ notifications: [newNotif, ...state.notifications] }));
  },

  markNotificationRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  },

  markAllNotificationsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    }));
  },

  updateUserProfile: (updates) => {
    set(state => {
      const updatedUser = state.user ? { ...state.user, ...updates } : null;
      if (updatedUser) {
        syncUserProfileToFirestore(updatedUser);
      }
      return { user: updatedUser };
    });
  },

  resetAccountProgress: async () => {
    const { user, addNotification } = get();
    const activeUid = auth.currentUser?.uid || user?.uid || 'YFWhaEpMmYP35N5RoNjOsuK9sdC3';

    console.log(`🧹 [Reset Progress Action] Starting account reset for active UID: ${activeUid}`);

    // 1. Query before count for activeUid
    let beforeCount = 0;
    try {
      const qBefore = query(collection(db, 'enrollments'), where('userId', '==', activeUid));
      const snapBefore = await getDocs(qBefore);
      beforeCount = snapBefore.docs.length;
      console.log(`📊 [Before Reset] Found ${beforeCount} enrollment docs in Firestore for UID "${activeUid}"`);
    } catch (e) {
      console.warn('Notice querying enrollments before reset:', e);
    }

    // 2. Delete all enrollments returned by query
    try {
      const enrollmentsRef = collection(db, 'enrollments');
      const q = query(enrollmentsRef, where('userId', '==', activeUid));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'enrollments', d.id));
        console.log(`  ✓ Deleted enrollment doc: "${d.id}"`);
      }
    } catch (e) {
      console.warn('Notice deleting enrollments:', e);
    }

    // 3. Direct deletion for known enrollment document IDs
    const directDocIds = [
      `en_course-1_${activeUid}`,
      `en_course-2_${activeUid}`,
      `en_course-3_${activeUid}`,
      `en_course-4_${activeUid}`,
      'en_course-1_YFWhaEpMmYP35N5RoNjOsuK9sdC3',
      'en_course-2_YFWhaEpMmYP35N5RoNjOsuK9sdC3',
      'en_course-3_YFWhaEpMmYP35N5RoNjOsuK9sdC3',
      'en_course-4_YFWhaEpMmYP35N5RoNjOsuK9sdC3'
    ];
    for (const docId of directDocIds) {
      try {
        await deleteDoc(doc(db, 'enrollments', docId));
        console.log(`  ✓ Direct deleted enrollment doc: "${docId}"`);
      } catch (e) {
        // Ignore if document did not exist or permissions differ
      }
    }

    // 4. Reset roadmap in Firestore to default initial state
    const freshRoadmap: LearningRoadmap = {
      id: 'roadmap-active',
      userId: activeUid,
      targetRole: user?.targetRole || 'Senior Full-Stack AI Engineer',
      createdAt: new Date().toISOString(),
      steps: [
        { id: 'step-1', title: 'React 18 & Modern TypeScript Architecture', description: 'Master component composition, Zustand state selectors, and TypeScript contracts.', status: 'in_progress', skills: ['React 18', 'TypeScript 5', 'Zustand'], estimatedWeeks: 2 },
        { id: 'step-2', title: 'Generative AI APIs & RAG Pipeline Engineering', description: 'Build retrieval augmented generation pipelines with Claude 3.5 API and Pinecone vector search.', status: 'locked', skills: ['Claude 3.5 API', 'Vector Embeddings', 'Pinecone'], estimatedWeeks: 3 },
        { id: 'step-3', title: 'Node.js Microservices & PostgreSQL Modeling', description: 'Design resilient REST microservices, Prisma ORM schemas, and relational database queries.', status: 'locked', skills: ['Express.js', 'PostgreSQL', 'Prisma ORM'], estimatedWeeks: 2 },
        { id: 'step-4', title: 'Cloud DevOps & Kubernetes Cluster Deployment', description: 'Containerize multi-stage builds and automate GitHub Actions CI/CD pipelines to K8s.', status: 'locked', skills: ['Docker', 'Kubernetes', 'GitHub Actions'], estimatedWeeks: 3 },
        { id: 'step-5', title: 'Enterprise System Architecture & AI Governance', description: 'Architect high-throughput scalable enterprise platforms with cost optimization.', status: 'locked', skills: ['System Design', 'Security', 'Cost Optimization'], estimatedWeeks: 2 }
      ]
    };

    try {
      const roadmapRef = doc(db, 'users', activeUid, 'roadmap', 'active');
      await setDoc(roadmapRef, freshRoadmap);
    } catch (e) {
      console.warn('Notice resetting roadmap:', e);
    }

    // 5. Reset User Profile progress fields in Firestore
    const updatedUser = user ? {
      ...user,
      completedHours: 0,
      learningStreak: 1,
      resumeScore: 0
    } : null;

    if (activeUid) {
      try {
        const userRef = doc(db, 'users', activeUid);
        await updateDoc(userRef, {
          completedHours: 0,
          learningStreak: 1,
          resumeScore: 0
        });
      } catch (e) {
        console.warn('Notice updating user doc:', e);
      }
    }

    // 6. Delete Activity logs from Firestore
    try {
      const activityRef = collection(db, 'users', activeUid, 'activity_logs');
      const snap = await getDocs(activityRef);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'users', activeUid, 'activity_logs', d.id));
      }
    } catch (e) {
      console.warn('Notice deleting activity logs:', e);
    }

    // 7. Clean up other subcollections in Firestore
    const subcollections = ['resume_analysis', 'ai_chats', 'ai_quizzes', 'ai_mock_interviews'];
    for (const sub of subcollections) {
      try {
        const colRef = collection(db, 'users', activeUid, sub);
        const snap = await getDocs(colRef);
        for (const d of snap.docs) {
          await deleteDoc(doc(db, 'users', activeUid, sub, d.id));
        }
      } catch (e) {
        console.warn(`Notice deleting ${sub}:`, e);
      }
    }

    // 8. Re-query after count for verification
    let afterCount = 0;
    try {
      const qAfter = query(collection(db, 'enrollments'), where('userId', '==', activeUid));
      const snapAfter = await getDocs(qAfter);
      afterCount = snapAfter.docs.length;
      console.log(`📊 [After Reset] Verified ${afterCount} enrollment docs remain in Firestore for UID "${activeUid}"`);
    } catch (e) {
      console.warn('Notice verifying enrollments after reset:', e);
    }

    // Update Zustand local state to fresh new-user state
    set({
      enrollments: [],
      roadmap: freshRoadmap,
      user: updatedUser,
      resumeAnalysis: null
    });

    addNotification(
      '🧹 Progress Reset Complete',
      `All course enrollments (Before: ${beforeCount}, After: ${afterCount}), roadmap progress, and study hours have been reset for UID ${activeUid}.`,
      'streak'
    );

    if (typeof window !== 'undefined') {
      alert(`✅ Reset Complete for UID: ${activeUid}\n\nFirestore Enrollments Before: ${beforeCount}\nFirestore Enrollments Remaining: ${afterCount}\nCompleted Hours: 0\nStreak: 1 Day`);
    }
  }
}));
