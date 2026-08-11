import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { ApiKeyModal } from './components/layout/ApiKeyModal';

import { AuthPage } from './components/auth/AuthPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { MyCoursesPage } from './components/courses/MyCoursesPage';
import { CourseCatalogPage } from './components/courses/CourseCatalogPage';
import { LessonPlayerPage } from './components/lessons/LessonPlayerPage';

import { AiRecommendationsPage } from './components/ai/AiRecommendationsPage';
import { AiRoadmapPage } from './components/ai/AiRoadmapPage';
import { AiResumeAnalyzerPage } from './components/ai/AiResumeAnalyzerPage';
import { AiMockInterviewPage } from './components/ai/AiMockInterviewPage';

import { AnalyticsPage } from './components/analytics/AnalyticsPage';
import { ProfilePage } from './components/profile/ProfilePage';

import { useAppStore } from './store/useAppStore';

export function App() {
  const { user, setUser, initRealtimeSync } = useAppStore();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Selected Lesson State
  const [activeCourseId, setActiveCourseId] = useState<string>('course-1');
  const [activeLessonId, setActiveLessonId] = useState<string>('c1-l1');

  // Modals / Drawers
  const [showNotifications, setShowNotifications] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Attach Real Firebase Authentication State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        console.log('🔒 [Firebase Auth Listener] Signed in user UID:', firebaseUser.uid);
        const userProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'SkillSnap Learner',
          email: firebaseUser.email || 'learner@skillsnap.ai',
          careerGoal: 'Senior Full-Stack AI Engineer',
          targetRole: 'Full-Stack AI Engineer',
          skills: ['React 18', 'TypeScript', 'Node.js', 'Firebase'],
          resumeScore: 0,
          learningStreak: 1,
          weeklyGoalHours: 10,
          completedHours: 0,
          avatarUrl: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
          createdAt: new Date().toISOString()
        };
        setUser(userProfile);
        initRealtimeSync();
      } else {
        console.log('🔒 [Firebase Auth Listener] No user signed in');
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Auth Guard
  if (!user) {
    return <AuthPage />;
  }

  const handleSelectCourseLesson = (courseId: string, lessonId: string) => {
    setActiveCourseId(courseId);
    setActiveLessonId(lessonId);
    setActiveTab('lesson-player');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenApiKeyModal={() => setShowApiKeyModal(true)}
      />

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-8 min-w-0 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage
              setActiveTab={setActiveTab}
              onSelectCourseLesson={handleSelectCourseLesson}
            />
          )}

          {activeTab === 'my-courses' && (
            <MyCoursesPage
              onSelectCourseLesson={handleSelectCourseLesson}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'catalog' && (
            <CourseCatalogPage
              onSelectCourseLesson={handleSelectCourseLesson}
            />
          )}

          {activeTab === 'lesson-player' && (
            <LessonPlayerPage
              courseId={activeCourseId}
              lessonId={activeLessonId}
              onNavigateBack={() => setActiveTab('my-courses')}
              onSelectLesson={(lessonId) => setActiveLessonId(lessonId)}
            />
          )}

          {activeTab === 'ai-recommendations' && (
            <AiRecommendationsPage
              onSelectCourseLesson={handleSelectCourseLesson}
            />
          )}

          {activeTab === 'roadmap' && (
            <AiRoadmapPage
              onSelectCourseLesson={handleSelectCourseLesson}
            />
          )}

          {activeTab === 'resume-analyzer' && (
            <AiResumeAnalyzerPage
              onSelectCourseLesson={handleSelectCourseLesson}
            />
          )}

          {activeTab === 'mock-interview' && (
            <AiMockInterviewPage />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage />
          )}

          {activeTab === 'profile' && (
            <ProfilePage />
          )}
        </main>
      </div>

      {/* Drawers and Modals */}
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        setActiveTab={setActiveTab}
      />

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
      />
    </div>
  );
}

export default App;
