import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { CourseRecommendationResult, LearningRoadmap, ResumeAnalysis, QuizQuestion, MockInterviewQuestion } from '../types';
import { INITIAL_COURSES } from './mockCourses';
import { useAppStore } from '../store/useAppStore';

const getApiKey = (): string => {
  return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AI_API_KEY)
    ? import.meta.env.VITE_AI_API_KEY
    : (typeof localStorage !== 'undefined' ? localStorage.getItem('skillsnap_ai_api_key') : '') || '';
};

// ---------------------------------------------------------
// Firestore Caching Helpers
// ---------------------------------------------------------

export async function saveAiChatToFirestore(lessonId: string, messages: any[]): Promise<void> {
  const uid = auth.currentUser?.uid || useAppStore.getState().user?.uid || 'anon-user';
  const localKey = `skillsnap_chat_${uid}_${lessonId}`;

  // Local Storage immediate caching
  try {
    localStorage.setItem(localKey, JSON.stringify(messages));
    console.log(`💾 [Local Chat Cache] Saved ${messages.length} msgs to localStorage key: "${localKey}"`);
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }

  // Cloud Firestore sync
  try {
    const docRef = doc(db, 'users', uid, 'ai_chats', lessonId);
    await setDoc(docRef, {
      lessonId,
      messages,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`☁️ [Firestore Chat Cache] Saved ${messages.length} msgs to Firestore path: "users/${uid}/ai_chats/${lessonId}"`);
  } catch (e) {
    console.error('Failed to cache AI chat to Firestore:', e);
  }
}

export async function fetchAiChatFromFirestore(lessonId: string): Promise<any[] | null> {
  const uid = auth.currentUser?.uid || useAppStore.getState().user?.uid || 'anon-user';
  const localKey = `skillsnap_chat_${uid}_${lessonId}`;

  // 1. Try Local Storage first for instant response
  try {
    const localData = localStorage.getItem(localKey);
    if (localData) {
      const parsed = JSON.parse(localData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`📖 [Local Chat Cache] Retained ${parsed.length} msgs from localStorage key: "${localKey}"`);
        return parsed;
      }
    }
  } catch (e) {
    console.warn('LocalStorage fetch failed:', e);
  }

  // 2. Try Firestore Cloud DB
  try {
    const docRef = doc(db, 'users', uid, 'ai_chats', lessonId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const msgs = snap.data().messages || null;
      console.log(`📖 [Firestore Chat Cache] Retained ${msgs?.length || 0} msgs from Firestore path: "users/${uid}/ai_chats/${lessonId}"`);
      if (msgs && msgs.length > 0) {
        try { localStorage.setItem(localKey, JSON.stringify(msgs)); } catch (_) {}
      }
      return msgs;
    }
  } catch (e) {
    console.error('Failed to fetch AI chat from Firestore:', e);
  }
  return null;
}

export async function saveAiQuizToFirestore(lessonId: string, quiz: QuizQuestion[]): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    const docRef = doc(db, 'users', uid, 'ai_quizzes', lessonId);
    await setDoc(docRef, {
      lessonId,
      quiz,
      generatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`💾 [Firestore AI Quiz Cache] Saved ${quiz.length} question(s) for lesson ${lessonId}`);
  } catch (e) {
    console.error('Failed to cache AI quiz to Firestore:', e);
  }
}

export async function fetchAiQuizFromFirestore(lessonId: string): Promise<QuizQuestion[] | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  try {
    const docRef = doc(db, 'users', uid, 'ai_quizzes', lessonId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().quiz || null;
    }
  } catch (e) {
    console.error('Failed to fetch AI quiz from Firestore:', e);
  }
  return null;
}

// ---------------------------------------------------------
// 1. Course Recommendation Engine
// ---------------------------------------------------------

export async function generateCourseRecommendations(
  careerGoal: string,
  resumeText: string = '',
  completedCourses: string[] = [],
  interests: string[] = []
): Promise<CourseRecommendationResult[]> {
  const apiKey = getApiKey();
  const validCourseIds = new Set(INITIAL_COURSES.map(c => c.id));
  
  if (apiKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `You are an AI Career Advisor for SkillSnap AI.
Analyze the user details:
- Career Goal: ${careerGoal}
- Resume Summary: ${resumeText}
- Technical Interests: ${interests.join(', ')}
- Already Completed Course IDs: ${completedCourses.join(', ')}

AVAILABLE CATALOG (YOU MUST ONLY SELECT FROM THIS LIST — DO NOT INVENT COURSES):
${INITIAL_COURSES.map(c => `ID: "${c.id}" | Name: "${c.name}" | Category: "${c.category}" | Skills: ${c.skillsCovered.join(', ')}`).join('\n')}

CRITICAL RULE: Return ONLY a valid JSON array of objects. Do NOT invent new course names or IDs. The "courseId" property MUST strictly match one of the exact catalog IDs listed above (e.g. "course-1", "course-2", ..., "course-18").

JSON Schema format:
[
  {
    "courseId": "course-2",
    "matchScore": 95,
    "reason": "One line explanation why this fits their career goal."
  }
]`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.content?.[0]?.text || '';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const filtered = parsed
            .filter((rec: any) => validCourseIds.has(rec.courseId))
            .map((rec: any) => ({ ...rec, isOfflineEstimate: false }));
          if (filtered.length > 0) {
            return filtered;
          }
        }
      }
    } catch (e) {
      console.warn('AI API call failed, using intelligent recommendation synthesis:');
    }
  }

  // Smart Context-Aware Fallback Engine (Disclosed Offline Mode)
  const goalLower = (careerGoal + ' ' + interests.join(' ')).toLowerCase();
  
  const uncompleted = INITIAL_COURSES.filter(course => !completedCourses.includes(course.id));
  const pool = uncompleted.length > 0 ? uncompleted : INITIAL_COURSES;
  const isAllCompleted = uncompleted.length === 0;

  return pool
    .map(course => {
      let score = 65;
      const matchesSkill = course.skillsCovered.some(s => goalLower.includes(s.toLowerCase()));
      const matchesCat = goalLower.includes(course.category.toLowerCase()) || 
                         (goalLower.includes('web') && course.category === 'Full-Stack Web') ||
                         (goalLower.includes('ai') && course.category === 'AI & Data Science') ||
                         (goalLower.includes('cloud') && course.category === 'Cloud & DevOps');
      
      if (matchesSkill) score += 20;
      if (matchesCat) score += 12;

      score = Math.min(98, Math.max(60, score));

      const reasonPrefix = isAllCompleted ? '[Completed • Recommended Refresher] ' : '';

      return {
        courseId: course.id,
        matchScore: score,
        reason: `${reasonPrefix}Directly targets ${course.skillsCovered.slice(0, 2).join(' & ')} essential for ${careerGoal || 'your target career path'}.`,
        isOfflineEstimate: true
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

// ---------------------------------------------------------
// 2. AI Study Assistant Chat
// ---------------------------------------------------------

export async function askStudyAssistant(
  lessonTitle: string,
  lessonSummary: string,
  userQuestion: string,
  chatHistory: { role: string; content: string }[] = []
): Promise<string> {
  const apiKey = getApiKey();
  
  if (apiKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 800,
          system: `You are SkillSnap AI Tutor, an encouraging expert teacher assisting a student watching "${lessonTitle}". 
Context summary: ${lessonSummary}
Provide clear, concise answers formatted in markdown with code snippets or bullet points where appropriate.`,
          messages: [
            ...chatHistory.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
            { role: 'user', content: userQuestion }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.content?.[0]?.text || 'I am ready to help you learn!';
      }
    } catch (e) {
      console.warn('AI Chat call failed, returning intelligent assistant response:', e);
    }
  }

  // Disclosed Offline Technical Concept Assistant Engine (32 Pre-Cached Topics across 4 Catalog Courses)
  const header = `> ⚠️ **Offline Assistant Mode** *(Set your API Key in Settings for live Claude AI tutoring)*\n\n`;
  const cleanQ = userQuestion.toLowerCase().replace(/[^a-z0-9\s\-\._]/g, ' ');

  const topics = [
    // ---------------------------------------------------------
    // COURSE 1: Full-Stack React & TypeScript
    // ---------------------------------------------------------
    {
      id: 'c1-usememo-usecallback',
      matches: () => (cleanQ.includes('usememo') || cleanQ.includes('memoize')) && (cleanQ.includes('usecallback') || cleanQ.includes('callback')),
      response: `### **Difference Between \`useMemo\` and \`useCallback\`**

Both hooks optimize React re-rendering performance by preventing unnecessary recalculations or function recreations:

- **\`useMemo\` memoizes a CALCULATED VALUE**:
  Executes a function and caches its **result**. Recalculates only when dependencies change.
  \`\`\`typescript
  // Caches calculated result value
  const memoizedValue = useMemo(() => computeExpensiveCalculation(data), [data]);
  \`\`\`

- **\`useCallback\` memoizes a FUNCTION REFERENCE**:
  Caches the **function instance** itself so child components (\`React.memo\`) don't re-render due to new function references.
  \`\`\`typescript
  // Caches function reference
  const memoizedCallback = useCallback(() => {
    handleItemClick(itemId);
  }, [itemId]);
  \`\`\`

**Rule of Thumb:**
- Use \`useMemo\` to cache a **value** (e.g. filtered array, complex data transforms).
- Use \`useCallback\` to pass a **stable callback function** to memoized child components.`
    },
    {
      id: 'c1-usestate-usereducer',
      matches: () => (cleanQ.includes('usestate') && cleanQ.includes('usereducer')) || (cleanQ.includes('state') && cleanQ.includes('reducer')),
      response: `### **\`useState\` vs. \`useReducer\` in React**

- **\`useState\`**:
  Best for simple, independent state values (e.g. \`isOpen\`, \`searchQuery\`).
  \`\`\`typescript
  const [count, setCount] = useState(0);
  \`\`\`

- **\`useReducer\`**:
  Best for complex state logic with multiple sub-values, or when the next state depends on the previous state via dispatched actions (\`{ type, payload }\`).
  \`\`\`typescript
  const [state, dispatch] = useReducer(reducer, initialState);
  dispatch({ type: 'INCREMENT_SCORE', payload: 10 });
  \`\`\``
    },
    {
      id: 'c1-useeffect-cleanup',
      matches: () => cleanQ.includes('useeffect') || (cleanQ.includes('effect') && (cleanQ.includes('cleanup') || cleanQ.includes('dependency'))),
      response: `### **\`useEffect\` Dependency Array & Cleanup Functions**

- **Cleanup Function**:
  Return a cleanup closure to unsubscribe from event listeners, clear timers, or abort HTTP requests before re-running or unmounting:
  \`\`\`typescript
  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 500);
    return () => clearTimeout(timer); // Prevent memory leak
  }, [fetchData]);
  \`\`\`

- **Dependency Array Rules**:
  - \`[]\`: Runs **once** on component mount.
  - \`[dep1, dep2]\`: Runs on mount and whenever specified dependencies update.`
    },
    {
      id: 'c1-type-interface',
      matches: () => (cleanQ.includes('type') && cleanQ.includes('interface')) || cleanQ.includes('type vs interface'),
      response: `### **\`type\` vs. \`interface\` in TypeScript**

- **\`interface\`**:
  Ideal for defining object shapes and contract APIs. Supports **declaration merging**:
  \`\`\`typescript
  interface User { id: string; name: string; }
  \`\`\`

- **\`type\` (Type Alias)**:
  Can represent objects, primitives, union types, tuples, and mapped types:
  \`\`\`typescript
  type Role = 'admin' | 'editor' | 'viewer';
  type UserWithRole = User & { role: Role };
  \`\`\``
    },
    {
      id: 'c1-generics',
      matches: () => cleanQ.includes('generic') || cleanQ.includes('generics') || cleanQ.includes('<t>'),
      response: `### **TypeScript Generics (\`<T>\`)**

Generics allow creating reusable components and functions that operate over a variety of types while preserving strict type safety:

\`\`\`typescript
// Generic API response interface
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// Generic helper function
function getFirstElement<T>(items: T[]): T | undefined {
  return items[0];
}
\`\`\``
    },
    {
      id: 'c1-zustand-context',
      matches: () => (cleanQ.includes('zustand') || cleanQ.includes('redux')) || (cleanQ.includes('context') && cleanQ.includes('state')),
      response: `### **Zustand vs. React Context API**

- **React Context API**:
  Built into React. **Drawback**: Updating context forces **all consuming components to re-render**, even if they only read an unchanged property.

- **Zustand**:
  Lightweight global state store supporting **atomic selectors**:
  \`\`\`typescript
  // Component ONLY re-renders when user.name changes
  const userName = useAppStore(state => state.user?.name);
  \`\`\`
  Prevents unnecessary re-renders across deep component trees.`
    },
    {
      id: 'c1-tailwind-glassmorphism',
      matches: () => cleanQ.includes('tailwind') || cleanQ.includes('glassmorphism') || cleanQ.includes('backdrop-blur'),
      response: `### **Tailwind CSS Utility Design & Glassmorphism**

Glassmorphism achieves a frosted glass UI using backdrop blur and subtle border opacity:

\`\`\`html
<div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-2xl">
  <h3 className="text-white font-bold">Glassmorphic Card</h3>
</div>
\`\`\`

**Key Classes:**
- \`backdrop-blur-md\`: Applies \`backdrop-filter: blur(12px)\`.
- \`bg-slate-900/80\`: Semi-transparent background token.`
    },
    {
      id: 'c1-react-memo',
      matches: () => cleanQ.includes('react.memo') || cleanQ.includes('react memo') || (cleanQ.includes('re-render') && cleanQ.includes('optimize')),
      response: `### **Component Memoization with \`React.memo\`**

\`React.memo\` is a Higher-Order Component (HOC) that skips rendering a component if its props haven't changed:

\`\`\`typescript
export const UserAvatar = React.memo(({ name, avatarUrl }: { name: string; avatarUrl: string }) => {
  return <img src={avatarUrl} alt={name} className="w-8 h-8 rounded-full" />;
});
\`\`\`
**Note:** Always pair with \`useCallback\` when passing function props to memoized components.`
    },

    // ---------------------------------------------------------
    // COURSE 2: Generative AI & LLM Application Engineering
    // ---------------------------------------------------------
    {
      id: 'c2-transformers-attention',
      matches: () => cleanQ.includes('transformer') || cleanQ.includes('attention') || cleanQ.includes('how llm works'),
      response: `### **Transformer Architecture & Self-Attention**

Transformers process text sequences in parallel rather than sequentially (like RNNs):

1. **Tokenization**: Input text is converted into numeric token IDs.
2. **Positional Encoding**: Adds word position vectors to retain sequence order.
3. **Self-Attention Mechanism**: Calculates mathematical attention weights between every token pair simultaneously, enabling models to grasp long-range context dependencies.`
    },
    {
      id: 'c2-rag-pipelines',
      matches: () => cleanQ.includes('rag') || cleanQ.includes('retrieval') || cleanQ.includes('grounding'),
      response: `### **Retrieval-Augmented Generation (RAG)**

RAG connects LLMs with private enterprise documents to prevent hallucinations:

1. **Chunk & Embed**: Documents are broken into text chunks and converted to vector embeddings.
2. **Vector DB Search**: User questions query a vector DB (e.g. Pinecone) using similarity search.
3. **Context Injection**: Relevant document chunks are injected into the system prompt before LLM inference.`
    },
    {
      id: 'c2-vector-embeddings',
      matches: () => cleanQ.includes('embedding') || cleanQ.includes('embeddings') || cleanQ.includes('dense vector'),
      response: `### **Vector Embeddings**

Embeddings map text into dense floating-point vector arrays in high-dimensional continuous vector space:

\`\`\`json
"king" -> [0.24, -0.81, 0.45, ...]
"queen" -> [0.25, -0.79, 0.48, ...]
\`\`\`
Semantically similar terms land close together in vector space, allowing computers to measure conceptual similarity.`
    },
    {
      id: 'c2-vector-db-hnsw',
      matches: () => cleanQ.includes('vector db') || cleanQ.includes('vector database') || cleanQ.includes('pinecone') || cleanQ.includes('hnsw') || cleanQ.includes('cosine'),
      response: `### **Vector Databases & HNSW Indexing**

Vector DBs store high-dimensional embeddings and execute Approximate Nearest Neighbor (ANN) search:

- **HNSW (Hierarchical Navigable Small World)**:
  Graph-based multi-layer index structure enabling sub-millisecond vector lookups across millions of records.
- **Cosine Similarity**:
  Measures the angle cosine between vectors (\`cos(θ) = A · B / (||A|| ||B||)\`).`
    },
    {
      id: 'c2-prompt-engineering',
      matches: () => cleanQ.includes('prompt') || cleanQ.includes('few-shot') || cleanQ.includes('chain of thought'),
      response: `### **Prompt Engineering Techniques**

- **System Prompt**: Sets global role boundaries, output JSON schemas, and safety guidelines.
- **Few-Shot Prompting**: Provides 2-3 input/output examples inside the prompt to guide formatting.
- **Chain-of-Thought (CoT)**: Instructs the model to *"think step-by-step"* before producing a final answer, improving math and reasoning accuracy.`
    },
    {
      id: 'c2-temperature-sampling',
      matches: () => cleanQ.includes('temperature') || cleanQ.includes('top-p') || cleanQ.includes('sampling'),
      response: `### **Temperature & Top-P Sampling**

- **Temperature (0.0 to 1.0)**:
  Controls token probability distribution randomness. Lower values (0.0 - 0.2) produce deterministic, factual outputs; higher values (0.7 - 1.0) increase creativity.
- **Top-P (Nucleus Sampling)**:
  Limits candidate token choices to the cumulative top $P$ probability percentage pool (e.g. top 90%).`
    },
    {
      id: 'c2-tokenization-context',
      matches: () => cleanQ.includes('token') || cleanQ.includes('context window') || cleanQ.includes('tiktoken'),
      response: `### **Tokenization & Context Window Limits**

- **Tokens**:
  LLMs process text in word chunks called tokens (roughly 1 token ≈ 4 characters or 0.75 words in English).
- **Context Window**:
  Maximum total tokens (prompt + completion) an LLM can hold in memory during a single inference call (e.g. 200k tokens for Claude 3.5 Sonnet).`
    },
    {
      id: 'c2-finetuning-vs-rag',
      matches: () => (cleanQ.includes('fine-tuning') || cleanQ.includes('fine tuning')) && cleanQ.includes('rag'),
      response: `### **Fine-Tuning vs. RAG**

- **RAG (Retrieval-Augmented Generation)**:
  Best for dynamic, frequently changing knowledge bases. Fast to deploy without model training costs.
- **Fine-Tuning**:
  Best for teaching a model a specialized tone, domain vocabulary, or custom output format by updating model weights.`
    },

    // ---------------------------------------------------------
    // COURSE 3: Cloud-Native DevOps & Kubernetes
    // ---------------------------------------------------------
    {
      id: 'c3-docker-vs-vm',
      matches: () => (cleanQ.includes('docker') || cleanQ.includes('container')) && (cleanQ.includes('vm') || cleanQ.includes('virtual machine')),
      response: `### **Docker Containers vs. Virtual Machines (VMs)**

| Feature | Docker Containers | Virtual Machines (VMs) |
| :--- | :--- | :--- |
| **Virtualization Layer** | OS Kernel sharing | Hardware Hypervisor |
| **Size** | Megabytes (MB) | Gigabytes (GB) |
| **Startup Time** | Sub-seconds | Minutes |
| **Overhead** | Minimal CPU/RAM overhead | Runs dedicated Guest OS |`
    },
    {
      id: 'c3-multistage-docker',
      matches: () => cleanQ.includes('multi-stage') || cleanQ.includes('multistage') || (cleanQ.includes('docker') && cleanQ.includes('build')),
      response: `### **Multi-Stage Docker Builds**

Multi-stage builds allow separating build-time dependencies from final production runtime images:

\`\`\`dockerfile
# Stage 1: Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm run build

# Stage 2: Final lightweight runner
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
\`\`\`
Yields small, secure production images free of compiler tools.`
    },
    {
      id: 'c3-kubernetes-pod-deployment',
      matches: () => (cleanQ.includes('pod') && cleanQ.includes('deployment')) || cleanQ.includes('k8s pod') || cleanQ.includes('what is a pod'),
      response: `### **Kubernetes Pods vs. Deployments**

- **Pod**:
  The smallest deployable computing unit in Kubernetes, wrapping one or more co-located containers sharing networking and storage.
- **Deployment**:
  Higher-level controller managing Pod replicas, rolling updates, self-healing restarts, and automated rollbacks.`
    },
    {
      id: 'c3-kubernetes-ingress-service',
      matches: () => cleanQ.includes('ingress') || cleanQ.includes('clusterip') || cleanQ.includes('loadbalancer'),
      response: `### **Kubernetes Ingress & Service Routing**

- **ClusterIP Service**: Exposes Pods internally within the Kubernetes cluster.
- **LoadBalancer Service**: Provisions a cloud load balancer with an external IP address.
- **Ingress Controller**: Manages HTTP/HTTPS routing, SSL termination, and host-based path routing to internal services.`
    },
    {
      id: 'c3-cicd-github-actions',
      matches: () => cleanQ.includes('ci/cd') || cleanQ.includes('cicd') || cleanQ.includes('github actions') || cleanQ.includes('pipeline'),
      response: `### **CI/CD Pipelines & GitHub Actions**

CI/CD automates testing, linting, building, and deployment workflows on code pushes:

\`\`\`yaml
name: Production CI/CD
on:
  push:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci && npm run test && npm run build
\`\`\``
    },
    {
      id: 'c3-terraform-iac',
      matches: () => cleanQ.includes('terraform') || cleanQ.includes('iac') || cleanQ.includes('infrastructure as code'),
      response: `### **Terraform Infrastructure as Code (IaC)**

Terraform provisions cloud infrastructure declaratively using HashiCorp Configuration Language (HCL):

\`\`\`hcl
resource "aws_s3_bucket" "prod_assets" {
  bucket = "my-company-prod-assets-2026"
}
\`\`\`
- **State File (\`terraform.tfstate\`)**: Tracks real-world infrastructure bindings to match configuration specs.`
    },
    {
      id: 'c3-container-security',
      matches: () => cleanQ.includes('security') && (cleanQ.includes('container') || cleanQ.includes('non-root') || cleanQ.includes('docker')),
      response: `### **Container Security Best Practices**

1. **Run as Non-Root**: Add \`USER node\` or \`USER 10001\` in Dockerfiles to limit privilege escalation.
2. **Scan Base Images**: Use tools like Trivy or Clair to catch OS vulnerabilities.
3. **Read-Only File Systems**: Mount container root filesystems as read-only where possible.`
    },
    {
      id: 'c3-ml-cross-validation',
      matches: () => cleanQ.includes('cross-validation') || cleanQ.includes('cross validation') || (cleanQ.includes('ml') && cleanQ.includes('pipeline')),
      response: `### **Machine Learning Cross-Validation Pipelines**

Cross-validation (e.g. K-Fold CV) splits dataset samples into $K$ subsets to evaluate model performance reliably:

1. Trains on $K-1$ folds and tests on the remaining 1 fold.
2. Rotates the test fold $K$ times to compute an averaged performance metric (Accuracy, F1-Score), preventing overfitting on a single train/test split.`
    },

    // ---------------------------------------------------------
    // COURSE 4: Backend Microservices with Node.js & PostgreSQL
    // ---------------------------------------------------------
    {
      id: 'c4-jwt-cookies',
      matches: () => (cleanQ.includes('jwt') || cleanQ.includes('json web token')) || (cleanQ.includes('auth') && cleanQ.includes('cookie')),
      response: `### **JWT Security & HTTP-Only Cookies**

- **JSON Web Token (JWT)**:
  Stateless, digitally signed payload string (\`header.payload.signature\`).
- **Storage Best Practice**:
  Store JWTs in **HTTP-Only, Secure cookies** instead of \`localStorage\` to prevent Cross-Site Scripting (XSS) token theft.`
    },
    {
      id: 'c4-bcrypt-hashing',
      matches: () => cleanQ.includes('bcrypt') || cleanQ.includes('hash') || cleanQ.includes('salt factor'),
      response: `### **Password Hashing with Bcrypt**

Never store plain-text passwords. Use bcrypt with a salt cost factor $\ge 10$:

\`\`\`typescript
import bcrypt from 'bcrypt';

const saltRounds = 10;
const hashedPassword = await bcrypt.hash(rawPassword, saltRounds);

// Verify during login
const isMatch = await bcrypt.compare(candidatePassword, hashedPassword);
\`\`\``
    },
    {
      id: 'c4-sql-foreign-keys',
      matches: () => cleanQ.includes('foreign key') || cleanQ.includes('referential integrity') || cleanQ.includes('schema'),
      response: `### **SQL Relational Schemas & Foreign Keys**

Foreign Keys enforce **referential integrity** between parent and child tables:

\`\`\`sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  total_amount NUMERIC(10, 2)
);
\`ON DELETE CASCADE\` automatically removes child orders when a parent user is deleted.`
    },
    {
      id: 'c4-sql-joins',
      matches: () => cleanQ.includes('join') || cleanQ.includes('inner join') || cleanQ.includes('left join'),
      response: `### **SQL JOIN Types**

- **INNER JOIN**: Returns rows where matching keys exist in **both** tables.
- **LEFT JOIN**: Returns **all** rows from the left table and matching rows from the right table.
- **RIGHT JOIN**: Returns all rows from the right table and matching rows from the left.
- **FULL OUTER JOIN**: Returns all rows when a match exists in either table.`
    },
    {
      id: 'c4-explain-analyze',
      matches: () => cleanQ.includes('explain analyze') || cleanQ.includes('execution plan') || cleanQ.includes('slow query'),
      response: `### **PostgreSQL \`EXPLAIN ANALYZE\` Query Profiling**

Prepend \`EXPLAIN ANALYZE\` to inspect exact query execution timing and index usage:

\`\`\`sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'alex@example.com';
\`\`\`
Look for **Seq Scan** (slow full table scan) vs. **Index Scan** (fast B-Tree lookup).`
    },
    {
      id: 'c4-sql-btree-indexes',
      matches: () => cleanQ.includes('b-tree') || cleanQ.includes('btree') || cleanQ.includes('sql index'),
      response: `### **SQL B-Tree Database Indexes**

Indexes maintain a self-balancing B-Tree search structure on column values:

\`\`\`sql
CREATE INDEX idx_users_email ON users(email);
\`\`\`
- **Performance Impact**: Reduces query lookup time from $O(N)$ full-table scan to $O(\log N)$ logarithmic search.`
    },
    {
      id: 'c4-connection-pooling',
      matches: () => cleanQ.includes('connection pool') || cleanQ.includes('connection pooling') || cleanQ.includes('pg pool'),
      response: `### **Database Connection Pooling**

Opening fresh PostgreSQL TCP connections per API request is expensive. Connection pools maintain reusable warm DB connections:

\`\`\`typescript
import { Pool } from 'pg';
export const pool = new Pool({
  max: 20, // Reuse up to 20 connections
  idleTimeoutMillis: 30000
});
\`\`\``
    },
    {
      id: 'c4-rest-vs-graphql',
      matches: () => (cleanQ.includes('rest') && cleanQ.includes('graphql')) || cleanQ.includes('over-fetching'),
      response: `### **REST APIs vs. GraphQL**

- **REST**:
  Resource endpoints (\`/api/users\`, \`/api/posts\`). Prone to **over-fetching** or **under-fetching**.
- **GraphQL**:
  Single POST endpoint (\`/graphql\`). Clients query exact required JSON fields:
  \`\`\`graphql
  query { user(id: "1") { name email } }
  \`\`\``
    }
  ];

  // Search for matching pre-cached topic
  const matchedTopic = topics.find(t => t.matches());

  if (matchedTopic) {
    return `${header}${matchedTopic.response}`;
  }

  // Generic Code / How-To Fallback
  if (cleanQ.includes('example') || cleanQ.includes('code') || cleanQ.includes('how to')) {
    return `${header}Great question regarding **${lessonTitle}**!\n\nHere is a practical code example illustrating the concept:\n\n\`\`\`typescript\n// Practical example for ${lessonTitle}\nfunction executeLearningConcept(input: string) {\n  console.log("Processing concept:", input);\n  return { status: "success", topic: "${lessonTitle}" };\n}\n\`\`\`\n\n**Key Takeaway:** Always ensure clean input validation and type safety when applying this in your production code.`;
  }

  // Unmatched Fallback Disclosure
  return `${header}I don't have a pre-cached offline answer for that specific question — here is a summary breakdown of **${lessonTitle}** to help guide you:\n\nIn **${lessonTitle}**, the core principle focuses on **${lessonSummary.slice(0, 120)}...**\n\n- **Key Step 1:** Define clear architectural interfaces and type contracts.\n- **Key Step 2:** Isolate component responsibilities to minimize side effects.\n- **Key Step 3:** Validate changes with automated unit tests and logging.\n\nLet me know if you would like a code sample or quiz breakdown!`;
}

// ---------------------------------------------------------
// 3. AI Quiz Generator
// ---------------------------------------------------------

export async function generateLessonQuiz(
  lessonTitle: string,
  lessonSummary: string
): Promise<QuizQuestion[]> {
  const apiKey = getApiKey();

  if (apiKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `Generate a 4-question multiple choice quiz testing comprehension of: "${lessonTitle}".
Summary: ${lessonSummary}

Return ONLY valid JSON matching this schema:
[
  {
    "id": "ai-q1",
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 1,
    "explanation": "Short explanation of correct answer."
  }
]`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.content?.[0]?.text || '';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const questions: QuizQuestion[] = JSON.parse(jsonMatch[0]);
          return questions.map(q => ({ ...q, isOfflineEstimate: false }));
        }
      }
    } catch (e) {
      console.warn('AI Quiz generation failed, returning synthetic quiz:', e);
    }
  }

  // Content-Specific Offline Quiz Generator
  const summarySnippet = lessonSummary.length > 80 ? lessonSummary.slice(0, 80) + '...' : lessonSummary;
  const keywords = lessonTitle.split(' ').filter(w => w.length > 3);
  const mainTopic = keywords[0] || lessonTitle;

  return [
    {
      id: `ai-q-${Date.now()}-1`,
      question: `What is the core concept covered in "${lessonTitle}"?`,
      options: [
        `Understanding ${summarySnippet}`,
        `Bypassing security protocols in production`,
        `Directly mutating global database instances`,
        `Disabling client-side logging`
      ],
      correctIndex: 0,
      explanation: `"${lessonTitle}" primarily focuses on: ${lessonSummary}`,
      isOfflineEstimate: true
    },
    {
      id: `ai-q-${Date.now()}-2`,
      question: `Which best practice is emphasized when applying ${mainTopic}?`,
      options: [
        'Hardcoding secrets in source files',
        'Writing clean, testable code contracts and handling edge cases',
        'Skipping error handling in async functions',
        'Ignoring component re-render performance'
      ],
      correctIndex: 1,
      explanation: `Applying ${mainTopic} requires robust error handling and clear architectural contracts.`,
      isOfflineEstimate: true
    },
    {
      id: `ai-q-${Date.now()}-3`,
      question: `How does mastering "${lessonTitle}" improve application quality?`,
      options: [
        'By reducing latency and maintaining reliable, scalable performance',
        'By forcing full page reloads on every user interaction',
        'By increasing initial bundle size',
        'By eliminating the need for automated testing'
      ],
      correctIndex: 0,
      explanation: `Mastering ${lessonTitle} ensures optimized execution speed and system stability.`,
      isOfflineEstimate: true
    },
    {
      id: `ai-q-${Date.now()}-4`,
      question: `What is a key pitfall to avoid when working with ${mainTopic}?`,
      options: [
        'Failing to isolate state and unhandled side effects',
        'Using structured logging in production',
        'Validating user input schemas',
        'Configuring automated build pipelines'
      ],
      correctIndex: 0,
      explanation: `Unisolated side effects can cause difficult-to-trace bugs and performance regressions.`,
      isOfflineEstimate: true
    }
  ];
}

// ---------------------------------------------------------
// 4. AI Learning Roadmap Generator
// ---------------------------------------------------------

export async function generateLearningRoadmap(
  careerGoal: string,
  currentSkills: string[] = []
): Promise<LearningRoadmap> {
  const apiKey = getApiKey();
  const userId = auth.currentUser?.uid || 'user-current';

  if (apiKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1200,
          messages: [
            {
              role: 'user',
              content: `Generate a 5-step learning roadmap sequence for someone wanting to become a "${careerGoal}".
Current Known Skills: ${currentSkills.join(', ')}

Available platform course IDs: ${INITIAL_COURSES.map(c => `${c.id} (${c.name})`).join(', ')}

Return ONLY valid JSON matching this schema:
{
  "targetRole": "${careerGoal}",
  "steps": [
    {
      "id": "step-1",
      "title": "Step Title",
      "description": "Short step overview",
      "status": "in_progress",
      "recommendedCourseId": "course-1",
      "skills": ["Skill1", "Skill2"],
      "estimatedWeeks": 2
    }
  ]
}`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.content?.[0]?.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            id: `roadmap-${Date.now()}`,
            userId,
            targetRole: parsed.targetRole || careerGoal,
            createdAt: new Date().toISOString(),
            steps: parsed.steps || [],
            isOfflineEstimate: false
          };
        }
      }
    } catch (e) {
      console.warn('AI Roadmap call failed, building default roadmap:', e);
    }
  }

  // Domain-Sensitive Fallback Generator (Disclosed Offline Mode)
  const roleLower = careerGoal.toLowerCase().trim();

  let steps = [
    {
      id: 'step-1',
      title: '1. Frontend Architecture & React Mastery',
      description: 'Master modern component design, TypeScript types, and Tailwind CSS design tokens.',
      status: 'completed' as const,
      recommendedCourseId: 'course-1',
      skills: ['React 18', 'TypeScript', 'Tailwind CSS'],
      estimatedWeeks: 3
    },
    {
      id: 'step-2',
      title: '2. Backend API Design & PostgreSQL SQL',
      description: 'Build REST APIs with JWT auth, Node.js, and relational database schema design.',
      status: 'in_progress' as const,
      recommendedCourseId: 'course-4',
      skills: ['Node.js', 'PostgreSQL', 'Express API'],
      estimatedWeeks: 4
    },
    {
      id: 'step-3',
      title: '3. LLM Integration & RAG Pipelines',
      description: 'Integrate Anthropic Claude API, construct RAG pipelines with vector embeddings.',
      status: 'locked' as const,
      recommendedCourseId: 'course-2',
      skills: ['LLM APIs', 'Vector DBs', 'RAG Pipelines'],
      estimatedWeeks: 4
    },
    {
      id: 'step-4',
      title: '4. Cloud Infrastructure & Kubernetes',
      description: 'Containerize microservices with Docker and deploy to Kubernetes with automated workflows.',
      status: 'locked' as const,
      recommendedCourseId: 'course-3',
      skills: ['Docker', 'Kubernetes', 'CI/CD Pipelines'],
      estimatedWeeks: 3
    },
    {
      id: 'step-5',
      title: '5. Advanced AI Systems & Evaluation',
      description: 'Develop multi-agent tools, state graph loops, and automated benchmark evaluations.',
      status: 'locked' as const,
      recommendedCourseId: 'course-2',
      skills: ['LangGraph', 'Agentic Workflows', 'Model Evaluation'],
      estimatedWeeks: 3
    }
  ];

  if (/frontend/i.test(roleLower)) {
    steps = [
      { id: 'step-1', title: '1. HTML5, CSS3 & Responsive Layouts', description: 'Master semantic HTML, CSS Grid, Flexbox, and mobile-first design.', status: 'completed', recommendedCourseId: 'course-1', skills: ['HTML5', 'CSS Grid', 'Flexbox'], estimatedWeeks: 3 },
      { id: 'step-2', title: '2. Modern JavaScript ES6+ & DOM Manipulation', description: 'Master closures, async/await, DOM events, and fetch API.', status: 'in_progress', recommendedCourseId: 'course-1', skills: ['JavaScript ES6+', 'Promises', 'DOM'], estimatedWeeks: 4 },
      { id: 'step-3', title: '3. React 18 & State Management', description: 'Build component trees with Hooks, Context API, and Zustand atomic state.', status: 'locked', recommendedCourseId: 'course-1', skills: ['React 18', 'Zustand', 'React Hooks'], estimatedWeeks: 4 },
      { id: 'step-4', title: '4. TypeScript & Web Vitals Performance', description: 'Enforce strict type safety and optimize rendering performance (LCP, CLS).', status: 'locked', recommendedCourseId: 'course-1', skills: ['TypeScript', 'Web Vitals', 'Memoization'], estimatedWeeks: 3 },
      { id: 'step-5', title: '5. Next.js App Router & Server Components', description: 'Build full-stack SSR web applications with Next.js and Tailwind CSS.', status: 'locked', recommendedCourseId: 'course-1', skills: ['Next.js', 'SSR', 'Tailwind CSS'], estimatedWeeks: 4 }
    ];
  } else if (/backend/i.test(roleLower)) {
    steps = [
      { id: 'step-1', title: '1. Node.js Runtime & Async Execution', description: 'Understand Event Loop, streams, buffers, and non-blocking I/O.', status: 'completed', recommendedCourseId: 'course-4', skills: ['Node.js', 'Event Loop', 'Async I/O'], estimatedWeeks: 3 },
      { id: 'step-2', title: '2. PostgreSQL & Relational Schema Design', description: 'Design normalized SQL databases, indexes, transactions, and foreign keys.', status: 'in_progress', recommendedCourseId: 'course-4', skills: ['PostgreSQL', 'SQL Indexing', 'Transactions'], estimatedWeeks: 4 },
      { id: 'step-3', title: '3. RESTful Microservices & GraphQL APIs', description: 'Construct secure APIs with JWT authentication, rate limiting, and OpenAPI specs.', status: 'locked', recommendedCourseId: 'course-4', skills: ['Express.js', 'REST APIs', 'JWT Auth'], estimatedWeeks: 4 },
      { id: 'step-4', title: '4. Caching & Message Queues', description: 'Implement Redis in-memory caching and BullMQ async worker queues.', status: 'locked', recommendedCourseId: 'course-4', skills: ['Redis', 'BullMQ', 'Async Queues'], estimatedWeeks: 3 },
      { id: 'step-5', title: '5. Containerization & System Architecture', description: 'Package services in Docker containers and deploy resilient microservices.', status: 'locked', recommendedCourseId: 'course-4', skills: ['Docker', 'Microservices', 'System Design'], estimatedWeeks: 4 }
    ];
  } else if (/data analyst|bi analyst|business intelligence/i.test(roleLower)) {
    steps = [
      { id: 'step-1', title: '1. Advanced SQL & Data Extraction', description: 'Master CTEs, window functions (RANK, LEAD/LAG), and complex joins.', status: 'completed', recommendedCourseId: 'course-4', skills: ['SQL Window Functions', 'CTEs', 'Data Wrangling'], estimatedWeeks: 3 },
      { id: 'step-2', title: '2. Python for Data Analytics (Pandas/NumPy)', description: 'Clean, transform, and aggregate structured datasets using Pandas dataframes.', status: 'in_progress', recommendedCourseId: 'course-2', skills: ['Python', 'Pandas', 'NumPy'], estimatedWeeks: 4 },
      { id: 'step-3', title: '3. Data Visualization & Dashboarding', description: 'Build interactive dashboards in Tableau or PowerBI for business metrics.', status: 'locked', recommendedCourseId: 'course-2', skills: ['Tableau', 'PowerBI', 'Data Viz'], estimatedWeeks: 3 },
      { id: 'step-4', title: '4. Statistical Analysis & A/B Testing', description: 'Conduct hypothesis testing, p-value analysis, and conversion funnel analytics.', status: 'locked', recommendedCourseId: 'course-2', skills: ['Statistics', 'A/B Testing', 'Hypothesis Testing'], estimatedWeeks: 4 },
      { id: 'step-5', title: '5. Executive Presentation & Data Storytelling', description: 'Translate complex analytics into actionable executive summaries.', status: 'locked', recommendedCourseId: 'course-2', skills: ['Data Storytelling', 'KPI Tracking'], estimatedWeeks: 3 }
    ];
  } else if (/graphic designer|ui\/ux|visual designer/i.test(roleLower)) {
    steps = [
      { id: 'step-1', title: '1. Design Principles & Color Theory', description: 'Master composition, visual hierarchy, grid systems, and color harmony.', status: 'completed', recommendedCourseId: 'course-1', skills: ['Color Theory', 'Visual Hierarchy', 'Grid Systems'], estimatedWeeks: 3 },
      { id: 'step-2', title: '2. Vector Graphics & Adobe Illustrator', description: 'Create scalable logos, icons, and vector illustrations.', status: 'in_progress', recommendedCourseId: 'course-1', skills: ['Adobe Illustrator', 'Vector Design', 'Branding'], estimatedWeeks: 4 },
      { id: 'step-3', title: '3. Raster Editing & Adobe Photoshop', description: 'Master photo manipulation, compositing, and visual assets.', status: 'locked', recommendedCourseId: 'course-1', skills: ['Adobe Photoshop', 'Photo Editing', 'Compositing'], estimatedWeeks: 3 },
      { id: 'step-4', title: '4. Typography & Design Systems', description: 'Build brand identity guidelines and responsive design component libraries.', status: 'locked', recommendedCourseId: 'course-1', skills: ['Typography', 'Design Systems', 'Figma'], estimatedWeeks: 4 },
      { id: 'step-5', title: '5. Portfolio Development & Client Handoff', description: 'Curate a professional design portfolio and export production-ready assets.', status: 'locked', recommendedCourseId: 'course-1', skills: ['Portfolio Curation', 'Asset Export'], estimatedWeeks: 3 }
    ];
  } else if (/nurse|doctor|medical|healthcare|clinical/i.test(roleLower)) {
    steps = [
      { id: 'step-1', title: '1. Anatomy, Physiology & Fundamentals', description: 'Master foundational medical concepts and patient care protocols.', status: 'completed', recommendedCourseId: 'course-1', skills: ['Anatomy', 'Patient Assessment', 'Vital Signs'], estimatedWeeks: 4 },
      { id: 'step-2', title: '2. Pharmacology & Medication Administration', description: 'Learn drug interactions, dosage calculations, and safe administration.', status: 'in_progress', recommendedCourseId: 'course-4', skills: ['Pharmacology', 'Dosage Calculation', 'EHR Entry'], estimatedWeeks: 4 },
      { id: 'step-3', title: '3. Medical Terminology & EHR Systems', description: 'Gain proficiency in Epic/Cerner systems and clinical documentation.', status: 'locked', recommendedCourseId: 'course-2', skills: ['Epic EHR', 'HIPAA Compliance', 'Clinical Coding'], estimatedWeeks: 3 },
      { id: 'step-4', title: '4. Emergency Triage & Acute Care', description: 'Develop rapid triage assessment skills for critical emergency care.', status: 'locked', recommendedCourseId: 'course-3', skills: ['Triage', 'Emergency Care', 'CPR/BLS'], estimatedWeeks: 3 },
      { id: 'step-5', title: '5. Advanced Nursing Specialization & NCLEX', description: 'Prepare for nursing board licensing and clinical rotations.', status: 'locked', recommendedCourseId: 'course-2', skills: ['NCLEX-RN Prep', 'Clinical Rotations', 'Patient Care'], estimatedWeeks: 4 }
    ];
  } else if (/teacher|professor|education|educator/i.test(roleLower)) {
    steps = [
      { id: 'step-1', title: '1. Pedagogical Foundations & Educational Psychology', description: 'Understand learning styles, cognitive development, and classroom dynamics.', status: 'completed', recommendedCourseId: 'course-1', skills: ['Pedagogy', 'Learning Theory', 'Student Psychology'], estimatedWeeks: 3 },
      { id: 'step-2', title: '2. Curriculum Design & Lesson Planning', description: 'Build structured curriculum modules aligned with educational standards.', status: 'in_progress', recommendedCourseId: 'course-4', skills: ['Curriculum Planning', 'Rubrics', 'Educational Tech'], estimatedWeeks: 4 },
      { id: 'step-3', title: '3. Classroom Management & Engagement', description: 'Master proactive engagement strategies and positive behavior reinforcement.', status: 'locked', recommendedCourseId: 'course-2', skills: ['Classroom Management', 'Student Engagement'], estimatedWeeks: 3 },
      { id: 'step-4', title: '4. Differentiated Learning & Special Needs', description: 'Adapt instructional strategies for diverse student learning needs.', status: 'locked', recommendedCourseId: 'course-3', skills: ['IEP Planning', 'Inclusive Teaching', 'Assessment'], estimatedWeeks: 3 },
      { id: 'step-5', title: '5. Educational Assessment & Teacher Licensing', description: 'Formulate summative tests and complete state teaching certification.', status: 'locked', recommendedCourseId: 'course-2', skills: ['Certification Prep', 'State Licensing', 'Student Evaluation'], estimatedWeeks: 4 }
    ];
  }

  return {
    id: `roadmap-${Date.now()}`,
    userId,
    targetRole: careerGoal || 'Senior Full-Stack AI Engineer',
    createdAt: new Date().toISOString(),
    steps,
    isOfflineEstimate: true
  };
}

// ---------------------------------------------------------
// 5. AI Resume ATS Analyzer & Skill-Gap Detector
// ---------------------------------------------------------

export async function analyzeResume(
  resumeText: string,
  targetRole: string = 'Full-Stack Software Engineer'
): Promise<ResumeAnalysis> {
  const apiKey = getApiKey();
  const userId = auth.currentUser?.uid || 'user-current';

  if (apiKey && resumeText.length > 50) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `Strictly analyze this candidate resume specifically for the TARGET JOB ROLE: "${targetRole}".

CRITICAL INSTRUCTIONS FOR TARGET ROLE MATCHING:
- First, evaluate the core competencies, skills, and industry terms required for the position "${targetRole}".
- Second, compare the candidate's resume content against "${targetRole}".
- IF THE RESUME IS FOR A DIFFERENT PROFESSION OR FIELD (e.g. Software Engineer resume applying for "${targetRole}" like "Marketing Manager", "Registered Nurse", "Chief Financial Officer", "Sales Representative"):
  - The ATS Score MUST BE VERY LOW (15 - 35 out of 100) due to low skill relevance.
  - The "skillGaps" array MUST list the key missing competencies required for "${targetRole}" (e.g. for Marketing Manager: Digital Campaign Strategy, SEO/SEM, Google Analytics, Lead Generation, Copywriting, Brand Management).
  - Do NOT reward irrelevant software engineering skills (React, Node.js, SQL) if they are irrelevant to "${targetRole}".
- IF THE RESUME IS HIGHLY RELEVANT to "${targetRole}":
  - Score appropriately high (75 - 95).
  - Highlight relevant strengths and key technical/domain gaps.

Resume Text:
${resumeText}

Return ONLY valid JSON matching this schema:
{
  "score": number (0-100),
  "strengths": ["Strength 1", "Strength 2"],
  "skillGaps": ["Missing Skill 1", "Missing Skill 2"],
  "recommendations": ["Actionable tip 1", "Actionable tip 2"],
  "recommendedCourseIds": ["course-1", "course-2"]
}`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.content?.[0]?.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            id: `resume-${Date.now()}`,
            userId,
            score: typeof parsed.score === 'number' ? parsed.score : 35,
            targetRole,
            strengths: parsed.strengths || [],
            skillGaps: parsed.skillGaps || [],
            recommendations: parsed.recommendations || [],
            recommendedCourseIds: parsed.recommendedCourseIds || ['course-1', 'course-2'],
            analyzedAt: new Date().toISOString(),
            isOfflineEstimate: false
          };
        }
      }
    } catch (e) {
      console.warn('AI Resume call failed, falling back to strict analyzer:', e);
    }
  }

  // Disclosed Offline ATS Fallback Engine with Comprehensive Taxonomy
  const lower = resumeText.toLowerCase();
  const roleLower = targetRole.toLowerCase().trim();

  // Detect candidate resume domain
  const isSoftwareResume = /react|typescript|javascript|node|express|postgresql|sql|rest|api|docker|frontend|backend|full-stack|fullstack|software|git|python|html|css/i.test(lower);

  // Expanded Taxonomy Classifiers
  const isTechRole = /software|developer|engineer|programmer|frontend|backend|full-stack|fullstack|web|mobile|react|node|python|java|c\+\+|golang|qa|architect|tech|ai|machine learning|ml|devops|cloud|infrastructure|sre|sysadmin/i.test(roleLower);
  const isDataRole = /data analyst|data engineer|data scientist|bi analyst|business intelligence|machine learning|ai engineer|analytics/i.test(roleLower);
  const isDesignRole = /graphic designer|ui\/ux|visual designer|art director|3d animator|illustrator|creative director|video editor/i.test(roleLower);
  const isTradesRole = /electrician|plumber|hvac|carpenter|welder|contractor|technician|mechanic/i.test(roleLower);
  const isFinanceRole = /accountant|financial analyst|auditor|bookkeeper|cpa|controller|banking|tax|finance/i.test(roleLower);
  const isCulinaryRole = /chef|cook|baker|sous chef|culinary|kitchen|restaurant manager/i.test(roleLower);
  const isHealthcareRole = /nurse|doctor|physician|medical|health|clinical|hospital|patient|nursing|therapist|dentist|pharmacist/i.test(roleLower);
  const isEducationRole = /teacher|professor|educator|tutor|instructor|academic|school|principal/i.test(roleLower);
  const isMarketingRole = /marketing|digital|social|seo|brand|growth|copywriter/i.test(roleLower);
  const isSalesRole = /sales|account executive|business development|realtor|real estate/i.test(roleLower);
  const isLegalRole = /lawyer|attorney|paralegal|legal|counsel|jurist|compliance/i.test(roleLower);

  // Structural & Quality Factors
  const hasMetrics = /\d+%|\$\d+|\d+\s*years|\d+\s*users|\d+\s*people/.test(lower);
  const isWellStructured = lower.length > 150 && /managed|developed|architected|optimized|spearheaded|scaled|audited|designed|implemented/i.test(lower);

  const strengths: string[] = [];
  const skillGaps: string[] = [];
  const recommendations: string[] = [];
  const recommendedCourseIds: string[] = [];

  let finalScore = 25;

  if (isSoftwareResume) {
    if (isDataRole) {
      finalScore = 58 + (hasMetrics ? 8 : 0);
      strengths.push('Strong SQL & Python programming foundation');
      strengths.push('Experience working with backend relational databases');
      skillGaps.push('Data Visualization Tools (Tableau, PowerBI)');
      skillGaps.push('Advanced SQL Aggregations & ETL Pipeline Design');
      skillGaps.push('Business Metrics & A/B Testing Analytics');
      skillGaps.push('Executive Dashboard Presentation');
      recommendations.push('Add business intelligence dashboard projects to demonstrate end-to-end data story telling.');
      recommendedCourseIds.push('course-2', 'course-4');
    } else if (isDesignRole) {
      finalScore = 30 + (hasMetrics ? 5 : 0);
      strengths.push('Technical web background (Note: Low relevance to Graphic/Visual Design)');
      skillGaps.push('Adobe Creative Suite (Photoshop, Illustrator, InDesign)');
      skillGaps.push('Visual Layout Principles & Color Theory');
      skillGaps.push('Branding & Vector Design Systems');
      skillGaps.push('Design Portfolio Creation & Asset Prepress');
      recommendations.push('Create a dedicated design portfolio highlighting vector branding and visual layout work.');
      recommendedCourseIds.push('course-1');
    } else if (isTradesRole) {
      finalScore = 25;
      strengths.push('Technical software background (Note: Low relevance to Electrician/Trade work)');
      skillGaps.push('National Electrical Code (NEC) Compliance');
      skillGaps.push('Blueprint Reading & Circuit Wiring Schematics');
      skillGaps.push('High-Voltage Conduit Bending & Installation');
      skillGaps.push('Electrical Troubleshooting & OSHA Safety Certification');
      recommendations.push('Highlight trade apprenticeships, electrical licensing, and hands-on physical equipment maintenance.');
      recommendedCourseIds.push('course-3');
    } else if (isFinanceRole) {
      finalScore = 28 + (hasMetrics ? 5 : 0);
      strengths.push('Technical analytical background (Note: Low relevance to Accounting/Finance)');
      skillGaps.push('GAAP Standards & Financial Statement Preparation');
      skillGaps.push('General Ledger Reconciliation & Month-End Close');
      skillGaps.push('Tax Compliance & Corporate Audit Preparation');
      skillGaps.push('Enterprise Accounting Systems (QuickBooks, NetSuite)');
      recommendations.push('Highlight financial modeling skills and accounting software certifications.');
      recommendedCourseIds.push('course-4');
    } else if (isCulinaryRole) {
      finalScore = 25;
      strengths.push('Software background (Note: Low relevance to Professional Culinary/Chef role)');
      skillGaps.push('Professional Culinary Techniques & Line Station Cooking');
      skillGaps.push('Menu Planning & Food Cost Percentage Optimization');
      skillGaps.push('Kitchen Operations & Inventory Management');
      skillGaps.push('ServSafe Food Handler & Hygiene Certification');
      recommendations.push('Obtain ServSafe Manager certification and highlight kitchen leadership experience.');
      recommendedCourseIds.push('course-1');
    } else if (isHealthcareRole) {
      finalScore = 30;
      strengths.push('Technical software background (Note: Low relevance to Healthcare)');
      skillGaps.push('Patient Care & Clinical Nursing Procedures');
      skillGaps.push('Medical Terminology & EHR Systems (Epic/Cerner)');
      skillGaps.push('Patient Assessment & Emergency Triage');
      skillGaps.push('Healthcare Compliance (HIPAA, CPR/BLS Certification)');
      recommendations.push('Highlight clinical certifications and patient care experience.');
      recommendedCourseIds.push('course-1');
    } else if (isEducationRole) {
      finalScore = 30;
      strengths.push('Technical software background (Note: Low relevance to Education)');
      skillGaps.push('Curriculum Development & Lesson Planning');
      skillGaps.push('Classroom Management & Student Engagement');
      skillGaps.push('Educational Assessment & Student Evaluation');
      skillGaps.push('Pedagogy & State Teacher Licensing');
      recommendations.push('Highlight teaching credentials, student tutoring, and lesson plan development.');
      recommendedCourseIds.push('course-1');
    } else if (isMarketingRole) {
      finalScore = 32;
      strengths.push('Technical software background (Note: Low relevance to Marketing)');
      skillGaps.push('Digital Campaign Strategy & Performance Funnels');
      skillGaps.push('SEO/SEM & Web Analytics (Google Analytics, Mixpanel)');
      skillGaps.push('Content Marketing & Brand Copywriting');
      skillGaps.push('CRM & Lead Nurturing Workflows (HubSpot)');
      recommendations.push('Emphasize marketing campaign ROAS, audience growth, and conversion funnel metrics.');
      recommendedCourseIds.push('course-1');
    } else if (isSalesRole) {
      finalScore = 30;
      strengths.push('Technical background (Note: Low relevance to B2B Sales)');
      skillGaps.push('B2B Sales Prospecting & Cold Outreach');
      skillGaps.push('CRM Pipeline Management (Salesforce)');
      skillGaps.push('Contract Negotiation & Deal Closing Techniques');
      recommendations.push('Add annual quota attainment percentages and total revenue closed.');
      recommendedCourseIds.push('course-1');
    } else if (isLegalRole) {
      finalScore = 28;
      strengths.push('Technical background (Note: Low relevance to Legal profession)');
      skillGaps.push('Legal Research & Case Law Analysis');
      skillGaps.push('Statutory Interpretation & Contract Drafting');
      skillGaps.push('Courtroom Litigation & Dispute Resolution');
      recommendations.push('Highlight paralegal certification or legal research experience.');
      recommendedCourseIds.push('course-4');
    } else if (isTechRole) {
      // High Relevance Tech Candidate
      let base = 75;
      if (lower.includes('react') || lower.includes('typescript')) { base += 8; strengths.push('Modern TypeScript & React Frontend Architecture'); }
      else { skillGaps.push('Modern TypeScript & React 18 Architecture'); }

      if (lower.includes('node') || lower.includes('postgresql') || lower.includes('sql')) { base += 7; strengths.push('RESTful Backend APIs & Database Schema Design'); }
      else { skillGaps.push('Backend REST Microservices & Database Modeling'); }

      if (hasMetrics) base += 5;
      if (isWellStructured) base += 3;

      finalScore = Math.min(95, base);
      recommendations.push('Highlight cloud deployment experience (Docker/Kubernetes) to target senior roles.');
      recommendedCourseIds.push('course-1', 'course-2');
    } else {
      // Generic Unlisted Role
      finalScore = 32;
      strengths.push(`Software engineering background (Note: Low relevance to ${targetRole})`);
      skillGaps.push(`Domain-Specific Certifications & Training for ${targetRole}`);
      skillGaps.push(`Field-Specific Industry Standard Tools & Workflows for ${targetRole}`);
      skillGaps.push(`Role-Specific Regulatory & Compliance Standards`);
      skillGaps.push(`Practical On-the-Job Experience in ${targetRole}`);
      recommendations.push(`Tailor bullet points to highlight skills directly relevant to ${targetRole}.`);
      recommendedCourseIds.push('course-1');
    }
  } else {
    // Non-software resume base evaluator
    finalScore = 50 + (hasMetrics ? 10 : 0) + (isWellStructured ? 10 : 0);
    strengths.push('Professional work history and domain background');
    if (hasMetrics) strengths.push('Includes quantified performance metrics');
    recommendations.push(`Ensure resume includes keywords matching ${targetRole}.`);
    recommendedCourseIds.push('course-1');
  }

  return {
    id: `resume-${Date.now()}`,
    userId,
    score: Math.min(95, Math.max(15, finalScore)),
    targetRole,
    strengths,
    skillGaps,
    recommendations,
    recommendedCourseIds: Array.from(new Set(recommendedCourseIds.length > 0 ? recommendedCourseIds : ['course-1', 'course-2'])),
    analyzedAt: new Date().toISOString(),
    isOfflineEstimate: true
  };
}

// ---------------------------------------------------------
// 6. Mock Interview Question & Feedback Generator
// ---------------------------------------------------------

export const SAMPLE_INTERVIEW_QUESTIONS: MockInterviewQuestion[] = [
  {
    id: 'int-q1',
    question: 'How do you handle state updates and optimize re-renders in a large-scale React application?',
    category: 'technical',
    idealAnswerKey: 'Utilize atomic state selectors (Zustand), React.memo, useMemo/useCallback, and normalize nested state trees.'
  },
  {
    id: 'int-q2',
    question: 'Explain how Retrieval-Augmented Generation (RAG) reduces hallucination in Large Language Models.',
    category: 'technical',
    idealAnswerKey: 'RAG retrieves relevant verified text chunks via vector semantic search and injects them as factual context into the system prompt.'
  },
  {
    id: 'int-q3',
    question: 'Describe a situation where a production service went down or failed a test build. How did you diagnose and resolve it?',
    category: 'behavioral',
    idealAnswerKey: 'Inspect server logs/tracebacks immediately, isolate root cause, roll back breaking deployment, patch with unit tests.'
  }
];

export async function saveMockInterviewToFirestore(sessionId: string, messages: any[], overallScore?: number): Promise<void> {
  const uid = auth.currentUser?.uid || useAppStore.getState().user?.uid || 'anon-user';
  const localKey = `skillsnap_interview_${uid}_${sessionId}`;

  try {
    localStorage.setItem(localKey, JSON.stringify(messages));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }

  try {
    const docRef = doc(db, 'users', uid, 'ai_mock_interviews', sessionId);
    await setDoc(docRef, {
      sessionId,
      messages,
      overallScore: overallScore || null,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`☁️ [Firestore Interview Cache] Saved ${messages.length} msgs to users/${uid}/ai_mock_interviews/${sessionId}`);
  } catch (e) {
    console.error('Failed to cache mock interview to Firestore:', e);
  }
}

export async function fetchMockInterviewFromFirestore(sessionId: string): Promise<any[] | null> {
  const uid = auth.currentUser?.uid || useAppStore.getState().user?.uid || 'anon-user';
  const localKey = `skillsnap_interview_${uid}_${sessionId}`;

  try {
    const localData = localStorage.getItem(localKey);
    if (localData) {
      const parsed = JSON.parse(localData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (_) {}

  try {
    const docRef = doc(db, 'users', uid, 'ai_mock_interviews', sessionId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().messages || null;
    }
  } catch (e) {
    console.error('Failed to fetch mock interview from Firestore:', e);
  }
  return null;
}

export async function evaluateInterviewAnswer(
  question: MockInterviewQuestion,
  userAnswer: string
): Promise<MockInterviewQuestion['feedback']> {
  const apiKey = getApiKey();
  const trimmed = userAnswer.trim();
  const lower = trimmed.toLowerCase();
  const nonSubstantiveWords = ['hi', 'hello', 'hey', 'idk', 'no', 'yes', 'whatever', 'none', 'pass', 'skip', 'ok', 'okay', 'n/a', 'test', 'asdf'];
  const isNonSubstantive = trimmed.length < 15 || nonSubstantiveWords.includes(lower);

  if (isNonSubstantive) {
    return {
      score: 12,
      pros: ['Submitted a response'],
      improvements: [
        `Answer lacks technical substance ("${userAnswer}"). Please address specific architecture concepts for ${question.category}.`,
        'In a technical interview, vague single-phrase responses result in immediate candidate rejection.'
      ],
      sampleBetterResponse: `${question.idealAnswerKey} For instance, in past projects we configured structured logging and automated health checks to instantly detect issues before customer impact.`
    };
  }

  if (apiKey && userAnswer.length > 10) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 800,
          messages: [
            {
              role: 'user',
              content: `Strictly evaluate candidate response for interview question: "${question.question}".
Ideal concepts: ${question.idealAnswerKey}
Candidate Answer: ${userAnswer}

Return ONLY valid JSON:
{
  "score": number (0-100),
  "pros": ["Pro 1", "Pro 2"],
  "improvements": ["Improvement 1", "Improvement 2"],
  "sampleBetterResponse": "Professional high-scoring candidate response sample..."
}`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.content?.[0]?.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    } catch (e) {
      console.warn('AI Interview evaluation call failed:', e);
    }
  }

  // Enhanced Offline Evaluation Engine
  const techTermsCount = (lower.match(/react|memo|hooks|state|component|render|re-render|api|function|database|query|performance|cache|optimize|build|test|zustand|redux|usememo|usecallback|profiler|devtools|postgres|sql|rag|vector|embedding|docker|kubernetes|logs|trace|\d+%|\$\d+|\d+\s*users/g) || []).length;
  
  const hasSpecifics = /\d+%|\$\d+|\d+\s*users|zustand|redux|usememo|usecallback|react\.memo|profiler|devtools|postgres|sql|rag|vector|embedding|docker|kubernetes|logs|trace/i.test(lower);
  const keywordMatches = (question.idealAnswerKey.toLowerCase().split(' '))
    .filter(word => word.length > 3 && lower.includes(word)).length;

  let score = 10;

  if (techTermsCount === 0 && !hasSpecifics && keywordMatches === 0) {
    // Tier 1: Zero Technical Substance (Strict 10 - 18 Floor)
    const lengthBonus = Math.min(6, Math.floor(userAnswer.length / 12));
    score = Math.min(18, 10 + lengthBonus);
  } else if (!hasSpecifics) {
    // Tier 2: Medium / Partial Technical (Has general terms like React, hooks, memo, but lacks metrics/specific tools) -> 45 - 58 range
    const lengthScore = Math.min(8, Math.floor(userAnswer.length / 10));
    score = Math.min(58, Math.max(45, 34 + (techTermsCount * 3) + lengthScore));
  } else {
    // Tier 3: Detailed / Highly Technical (Has specific tools/metrics like Zustand, numbers, DevTools) -> 90+ range
    const lengthScore = Math.min(18, Math.floor(userAnswer.length / 8));
    const base = 40 + (keywordMatches * 10) + (techTermsCount * 4) + 20 + lengthScore;
    score = Math.min(95, Math.max(88, base));
  }

  const pros: string[] = [];
  const improvements: string[] = [];

  if (hasSpecifics) {
    pros.push('Mentioned specific technical tools and measurable production metrics.');
  } else if (keywordMatches > 0) {
    pros.push('Addressed core technical terms relevant to the topic.');
    improvements.push('Include specific framework names (e.g. Zustand, Redis) and production metrics.');
  } else {
    improvements.push('Answer lacks technical substance. Address specific architecture tools and diagnostic steps.');
    improvements.push('Include framework names, profiling tools, or quantitative metrics.');
  }

  if (userAnswer.length > 80 && (hasSpecifics || keywordMatches > 0)) {
    pros.push('Provided adequate technical detail and structured explanation.');
  } else if (!hasSpecifics && keywordMatches === 0) {
    improvements.push('Elaborate with a real-world project scenario and concrete implementation details.');
  }

  return {
    score,
    pros: pros.length > 0 ? pros : ['Clear communication style'],
    improvements: improvements.length > 0 ? improvements : ['Elaborate on production failure recovery'],
    sampleBetterResponse: `${question.idealAnswerKey} For instance, in past projects we configured structured logging and automated health checks to instantly detect issues before customer impact.`
  };
}

export async function generateConversationalInterviewReply(
  question: MockInterviewQuestion,
  userAnswer: string,
  questionIndex: number,
  totalQuestions: number,
  chatHistory: { role: string; text: string }[] = []
): Promise<{ text: string; score: number; pros?: string[]; improvements?: string[]; followUpQuestion?: string }> {
  const feedbackRaw = await evaluateInterviewAnswer(question, userAnswer);
  const feedbackScore = feedbackRaw?.score ?? 75;
  const feedbackPros = feedbackRaw?.pros ?? ['Good technical clarity in your initial response.'];
  const feedbackImprovements = feedbackRaw?.improvements ?? ['Consider elaborating further on real-world trade-offs.'];

  const apiKey = getApiKey();
  const trimmed = userAnswer.trim();
  const lower = trimmed.toLowerCase();
  const nonSubstantiveWords = ['hi', 'hello', 'hey', 'idk', 'no', 'yes', 'whatever', 'none', 'pass', 'skip', 'ok', 'okay', 'n/a', 'test', 'asdf'];
  const isNonSubstantive = trimmed.length < 15 || nonSubstantiveWords.includes(lower);

  const offlineHeader = `> ⚠️ **Offline Interviewer Mode** *(Set API Key in Settings for live Claude AI interviewing)*\n\n`;

  if (isNonSubstantive) {
    const score = 8;
    const text = `${offlineHeader}🎯 **Turn Score: 8/100**\n\n⚠️ **Interviewer Feedback:** Your response ("${userAnswer}") lacks technical substance and does not address the question.\n\nIn a technical interview, single-word greetings or non-answers result in immediate rejection.\n\n**Let's try again:** ${question.question}`;
    return { text, score, pros: feedbackPros, improvements: feedbackImprovements };
  }

  if (apiKey) {
    try {
      const historyContext = chatHistory.slice(-4).map(h => `${h.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${h.text}`).join('\n\n');
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 750,
          system: `You are a friendly yet rigorous Senior Staff Engineering Interviewer conducting a live technical interview.
CRITICAL INSTRUCTIONS:
1. You MUST react directly and conversationally to what the candidate specifically said in their last response.
2. Provide honest evaluation with a turn score out of 100 based on technical depth and accuracy (no fake praise).
3. Formulate a REAL, DYNAMIC follow-up question probing into specific concepts, libraries, or architecture decisions they mentioned in their answer.
4. Do NOT use generic pre-written follow-up questions. Make it feel like an authentic 1-on-1 dialogue with an expert interviewer.`,
          messages: [
            {
              role: 'user',
              content: `Conversation History:\n${historyContext}\n\nCurrent Topic: "${question.question}"\nCandidate Answer: "${userAnswer}"\nAutomated Score Analysis: Score ${feedbackScore}/100, Pros: ${feedbackPros.join('; ')}, Improvements: ${feedbackImprovements.join('; ')}`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.content?.[0]?.text;
        if (text) return { text, score: feedbackScore, pros: feedbackPros, improvements: feedbackImprovements };
      }
    } catch (e) {
      console.warn('AI Conversational Interview call failed, using dynamic fallback synthesizer:', e);
    }
  }

  // Candidate-Specific Dynamic Follow-Up Synthesizer
  const score = feedbackScore;
  const proText = feedbackPros[0] || 'Good technical clarity in your initial points.';
  const impText = feedbackImprovements[0] || 'Consider elaborating on real-world trade-offs and edge cases.';

  // Extract quantitative metrics mentioned by candidate
  const metricMatch = userAnswer.match(/(\d+%\s*|\$\d+\s*|\d+\s*users|\d+\s*ms)/i);
  const mentionedMetric = metricMatch ? metricMatch[0].trim() : null;

  let dynamicFollowUp = '';

  if (mentionedMetric) {
    dynamicFollowUp = `You highlighted a specific metric of **"${mentionedMetric}"** in your answer. How did your team measure and baseline this metric in production, and what unexpected bottleneck did you encounter while reaching it?`;
  } else if (lower.includes('usememo') || lower.includes('usecallback') || lower.includes('memo')) {
    dynamicFollowUp = 'You mentioned using memoization (`useMemo`/`useCallback`). Can you share a concrete example where applying memoization provided a measurable rendering performance gain versus a scenario where it added unnecessary memory overhead?';
  } else if (lower.includes('zustand') || lower.includes('redux') || lower.includes('state')) {
    dynamicFollowUp = 'You brought up state management with Zustand/Redux. How do you handle atomic state selectors and prevent unnecessary component re-renders when updating deeply nested state trees?';
  } else if (lower.includes('rag') || lower.includes('vector') || lower.includes('embedding')) {
    dynamicFollowUp = 'You mentioned vector embeddings and RAG pipelines. What specific vector index metric (e.g. Cosine vs HNSW) or chunking strategy would you select to minimize context hallucination in an enterprise application?';
  } else if (lower.includes('log') || lower.includes('trace') || lower.includes('metrics')) {
    dynamicFollowUp = 'You highlighted log analysis and tracebacks. In a high-throughput microservice system, how do you handle distributed tracing correlation IDs across async worker queues?';
  } else if (lower.includes('index') || lower.includes('sql') || lower.includes('database')) {
    dynamicFollowUp = 'Since you referenced database optimization: what are the write-latency trade-offs of adding secondary B-tree indexes on high-frequency transaction tables?';
  } else {
    dynamicFollowUp = `To evaluate your technical depth on this topic, could you walk me through a specific project example? What specific bottleneck did you identify, what diagnostic tools or frameworks did you use, and what concrete changes did you implement?`;
  }

  const text = `${offlineHeader}Thanks for elaborating! 🎯 **Turn Score: ${score}/100**\n\n**What stood out:** ${proText}\n\n**Interviewer Probing Tip:** ${impText}\n\n**Follow-up Question:**\n> ${dynamicFollowUp}`;

  return { text, score, pros: feedbackPros, improvements: feedbackImprovements, followUpQuestion: dynamicFollowUp };
}
