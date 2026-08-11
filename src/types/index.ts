export type CategoryType = 'Full-Stack Web' | 'AI & Data Science' | 'Cloud & DevOps' | 'Mobile & Cross-Platform' | 'UI/UX & Product Design';
export type LevelType = 'Beginner' | 'Intermediate' | 'Advanced';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  isOfflineEstimate?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  durationMinutes: number;
  videoUrl: string;
  summary: string;
  notes: string;
  downloadUrl?: string;
  quiz: QuizQuestion[];
}

export interface Course {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  instructor?: string;
  durationMinutes: number;
  category: CategoryType;
  level: LevelType;
  rating: number;
  studentsCount: number;
  skillsCovered: string[];
  lessons: Lesson[];
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  careerGoal: string;
  targetRole: string;
  skills: string[];
  resumeScore: number;
  learningStreak: number;
  weeklyGoalHours: number;
  completedHours: number;
  avatarUrl?: string;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progressPercent: number;
  completedLessonIds: string[];
  lastAccessedAt: string;
  completionDate: string | null;
  certificateStatus: 'none' | 'generated' | 'issued';
  certificateUrl?: string;
}

export interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'locked';
  recommendedCourseId?: string;
  skills: string[];
  estimatedWeeks: number;
}

export interface LearningRoadmap {
  id: string;
  userId: string;
  targetRole: string;
  createdAt: string;
  steps: RoadmapStep[];
  isOfflineEstimate?: boolean;
}

export interface ResumeAnalysis {
  id: string;
  userId: string;
  score: number;
  targetRole: string;
  strengths: string[];
  skillGaps: string[];
  recommendations: string[];
  recommendedCourseIds: string[];
  analyzedAt: string;
  isOfflineEstimate?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface MockInterviewQuestion {
  id: string;
  question: string;
  category: 'technical' | 'behavioral' | 'system_design';
  idealAnswerKey: string;
  userResponse?: string;
  feedback?: {
    score: number; // 0-100
    pros: string[];
    improvements: string[];
    sampleBetterResponse: string;
    isOfflineEstimate?: boolean;
  };
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'streak' | 'course' | 'quiz' | 'ai' | 'reminder';
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface RecommendationRequest {
  careerGoal: string;
  resumeText?: string;
  completedCourses: string[];
  interests: string[];
}

export interface CourseRecommendationResult {
  courseId: string;
  matchScore: number;
  reason: string;
  isOfflineEstimate?: boolean;
}
