import { Course } from '../types';

export const INITIAL_COURSES: Course[] = [
  {
    id: 'course-1',
    name: 'Full-Stack Modern React & TypeScript Mastery',
    description: 'Build enterprise-ready web apps with React 18, TypeScript, Tailwind CSS, and scalable state management.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop',
    durationMinutes: 135,
    category: 'Full-Stack Web',
    level: 'Intermediate',
    rating: 4.9,
    studentsCount: 14200,
    skillsCovered: ['React 18', 'TypeScript', 'Tailwind CSS', 'State Management', 'REST & GraphQL'],
    lessons: [
      {
        id: 'c1-l1',
        title: '1. Fundamentals of React & TypeScript',
        durationMinutes: 45,
        videoUrl: 'https://www.youtube.com/embed/bMknfKXIFA8',
        summary: 'Learn how TypeScript enhances React developer ergonomics with strictly typed props, state hooks, and custom generic components.',
        notes: '### Key Concepts:\n- Standard Props typing with Interfaces\n- Generics in React Custom Hooks\n- Handling Event Types (`React.MouseEvent`, `React.ChangeEvent`)\n- Strict Null Checks',
        quiz: [
          {
            id: 'c1-l1-q1',
            question: 'What is the correct way to type a component prop that accepts a click callback with no return value?',
            options: ['onClick: Function', 'onClick: () => void', 'onClick: () => null', 'onClick: Event'],
            correctIndex: 1,
            explanation: '`() => void` accurately specifies a function accepting zero parameters and returning nothing.'
          },
          {
            id: 'c1-l1-q2',
            question: 'Which TS utility type makes all properties of an interface optional?',
            options: ['Required<T>', 'Partial<T>', 'Readonly<T>', 'Record<K,T>'],
            correctIndex: 1,
            explanation: '`Partial<T>` returns a type with all properties of T set to optional.'
          }
        ]
      },
      {
        id: 'c1-l2',
        title: '2. State Management & Hooks Deep-Dive',
        durationMinutes: 50,
        videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk',
        summary: 'Master atomic client-side state with Zustand and server-side caching with TanStack React Query.',
        notes: '### Best Practices:\n- Keep store state minimal and derived\n- Use selectors to prevent unnecessary re-renders\n- Configure cache invalidation strategies',
        quiz: [
          {
            id: 'c1-l2-q1',
            question: 'Why perform state selection in Zustand like `useStore(state => state.user)`?',
            options: [
              'To encrypt the user data',
              'To trigger re-renders only when `user` changes',
              'To mutate state directly',
              'It is required by TypeScript'
            ],
            correctIndex: 1,
            explanation: 'Selecting specific state slices ensures the component re-renders only when that specific property updates.'
          }
        ]
      },
      {
        id: 'c1-l3',
        title: '3. Building Modern Web Applications',
        durationMinutes: 40,
        videoUrl: 'https://www.youtube.com/embed/LDB4uaJ87e0',
        summary: 'Create responsive, accessible dark-mode UI design systems using modern Tailwind CSS tokens.',
        notes: '### Design Tokens:\n- Primary Indigo: `#6366F1`\n- Dark Background: `#0F172A`\n- Glassmorphism: `backdrop-blur-md bg-white/10`',
        quiz: [
          {
            id: 'c1-l3-q1',
            question: 'Which Tailwind utility class applies a backdrop blur effect?',
            options: ['filter-blur', 'backdrop-blur', 'blur-sm', 'bg-blur'],
            correctIndex: 1,
            explanation: '`backdrop-blur` applies CSS `backdrop-filter: blur(...)` to glass elements.'
          }
        ]
      }
    ]
  },
  {
    id: 'course-2',
    name: 'Generative AI & LLM Application Engineering',
    description: 'Architect production-grade AI applications using Claude API, RAG (Retrieval-Augmented Generation), vector databases, and agentic workflows.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop',
    durationMinutes: 180,
    category: 'AI & Data Science',
    level: 'Advanced',
    rating: 4.95,
    studentsCount: 9800,
    skillsCovered: ['LLM APIs', 'Prompt Engineering', 'Vector Databases', 'RAG Pipelines', 'LangChain/LlamaIndex'],
    lessons: [
      {
        id: 'c2-l1',
        title: '1. How Large Language Models Work',
        durationMinutes: 60,
        videoUrl: 'https://www.youtube.com/embed/5sLYAQS9sWQ',
        summary: 'Deep dive into transformer architectures, tokenization, attention mechanisms, and LLM inference generation.',
        notes: '### Key Concepts:\n- Transformer Attention Layers\n- Tokenization & Vocabularies\n- Temperature & Top-P Sampling\n- Context Window Limits',
        quiz: [
          {
            id: 'c2-l1-q1',
            question: 'What mechanism allows Transformer models to process all words in a sequence simultaneously?',
            options: [
              'Recurrent Loops',
              'Self-Attention Mechanism',
              'Convolution Filters',
              'Stack Memory'
            ],
            correctIndex: 1,
            explanation: 'Self-attention calculates token interaction weights across the entire context window in parallel.'
          }
        ]
      },
      {
        id: 'c2-l2',
        title: '2. Building GPT Models from Scratch',
        durationMinutes: 65,
        videoUrl: 'https://www.youtube.com/embed/kCc8FmEb1nY',
        summary: 'Understand the math and step-by-step code implementation of building generative language models.',
        notes: '### Model Pipeline:\n- Bigram baseline model\n- Multi-head self-attention blocks\n- Residual connections & LayerNorm\n- Cross-entropy loss training loop',
        quiz: [
          {
            id: 'c2-l2-q1',
            question: 'Why are residual connections used in deep Transformer models?',
            options: [
              'To reduce memory storage',
              'To allow gradients to flow directly during backpropagation',
              'To disable dropout',
              'To encode text into ASCII'
            ],
            correctIndex: 1,
            explanation: 'Residual connections mitigate vanishing gradients in deep neural networks.'
          }
        ]
      },
      {
        id: 'c2-l3',
        title: '3. Vector Databases & Semantic Search',
        durationMinutes: 55,
        videoUrl: 'https://www.youtube.com/embed/klTvEwg3oJ4',
        summary: 'Learn vector embeddings, ANN index search algorithms, and how vector databases power semantic retrieval.',
        notes: '### Vector Search:\n- High-dimensional dense embeddings\n- Cosine similarity & HNSW indexing\n- Hybrid Keyword + Vector Retrieval',
        quiz: [
          {
            id: 'c2-l3-q1',
            question: 'What is the primary advantage of vector search over keyword search?',
            options: [
              'Vector search works without any database',
              'Vector search matches conceptual meaning even if exact words differ',
              'Vector search is only for image files',
              'Vector search requires no index'
            ],
            correctIndex: 1,
            explanation: 'Vector search captures semantic relationships between concepts in continuous vector space.'
          }
        ]
      }
    ]
  },
  {
    id: 'course-3',
    name: 'Cloud-Native DevOps & Kubernetes Deployment',
    description: 'Deploy, scale, and monitor distributed microservices using Docker, Kubernetes, GitHub Actions, and cloud infrastructure.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?q=80&w=800&auto=format&fit=crop',
    durationMinutes: 170,
    category: 'Cloud & DevOps',
    level: 'Intermediate',
    rating: 4.8,
    studentsCount: 8400,
    skillsCovered: ['Docker', 'Kubernetes', 'CI/CD Pipelines', 'Terraform', 'Container Security'],
    lessons: [
      {
        id: 'c3-l1',
        title: '1. Containerization Fundamentals with Docker',
        durationMinutes: 50,
        videoUrl: 'https://www.youtube.com/embed/3c-iBn73dDE',
        summary: 'Create production multi-stage Dockerfiles, minimize container image sizes, and manage container runtime environments.',
        notes: '### Docker Essentials:\n```dockerfile\nFROM node:18-alpine AS builder\nWORKDIR /app\nCOPY . .\nRUN npm run build\n\nFROM nginx:alpine\nCOPY --from=builder /app/dist /usr/share/nginx/html\n```',
        quiz: [
          {
            id: 'c3-l1-q1',
            question: 'Why use multi-stage Docker builds?',
            options: [
              'To run multiple containers at once',
              'To produce lightweight production images free of build tooling',
              'To bypass root permissions',
              'To automatically push images to Docker Hub'
            ],
            correctIndex: 1,
            explanation: 'Multi-stage builds leave compiler tools in the build phase, yielding minimal final container images.'
          }
        ]
      },
      {
        id: 'c3-l2',
        title: '2. Kubernetes Cluster & Pod Orchestration',
        durationMinutes: 65,
        videoUrl: 'https://www.youtube.com/embed/X48VuDVv0do',
        summary: 'Deploy stateful and stateless pods using Kubernetes Manifests, Secrets, ConfigMaps, and Ingress controllers.',
        notes: '### Manifest Components:\n- Deployment Manifest\n- ClusterIP & LoadBalancer Services\n- Ingress routing rules',
        quiz: [
          {
            id: 'c3-l2-q1',
            question: 'What is the function of a Kubernetes Ingress Controller?',
            options: ['Pod', 'ConfigMap', 'Ingress', 'DaemonSet'],
            correctIndex: 2,
            explanation: 'Ingress manages external HTTP and HTTPS routing into cluster services.'
          }
        ]
      },
      {
        id: 'c3-l3',
        title: '3. Machine Learning & Data Pipeline Foundations',
        durationMinutes: 55,
        videoUrl: 'https://www.youtube.com/embed/i_LwzRVP7bg',
        summary: 'Master foundational machine learning concepts, data transformation pipelines, and model evaluation metrics.',
        notes: '### Pipeline Steps:\n- Feature normalization\n- Cross-validation splits\n- Model evaluation metrics',
        quiz: [
          {
            id: 'c3-l3-q1',
            question: 'What is the primary goal of cross-validation in ML pipelines?',
            options: [
              'To speed up database writes',
              'To reliably estimate model performance on unseen data',
              'To format JSON API responses',
              'To compress image files'
            ],
            correctIndex: 1,
            explanation: 'Cross-validation evaluates model metrics across multiple data splits to prevent overfitting.'
          }
        ]
      }
    ]
  },
  {
    id: 'course-4',
    name: 'Backend Microservices with Node.js & PostgreSQL',
    description: 'Design robust REST APIs, handle JWT authentication, model SQL relational schemas, and optimize database queries.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?q=80&w=800&auto=format&fit=crop',
    durationMinutes: 155,
    category: 'Full-Stack Web',
    level: 'Intermediate',
    rating: 4.85,
    studentsCount: 11200,
    skillsCovered: ['Node.js', 'Express', 'PostgreSQL', 'Prisma ORM', 'JWT Security'],
    lessons: [
      {
        id: 'c4-l1',
        title: '1. Node.js & Express API Architecture',
        durationMinutes: 45,
        videoUrl: 'https://www.youtube.com/embed/Oe421EPjeBE',
        summary: 'Implement password hashing with bcrypt, stateless JSON Web Token sessions, and rate-limiting middleware.',
        notes: '### Security Essentials:\n- Store passwords using bcrypt with salt factor >= 10\n- Store JWTs in HTTP-Only cookies\n- Validate request inputs using Zod schemas',
        quiz: [
          {
            id: 'c4-l1-q1',
            question: 'Where is the safest place to store a session JWT on the client?',
            options: [
              'localStorage',
              'sessionStorage',
              'An HTTP-only, Secure cookie',
              'URL query parameters'
            ],
            correctIndex: 2,
            explanation: 'HTTP-only cookies cannot be accessed by client-side JavaScript, protecting against XSS token theft.'
          }
        ]
      },
      {
        id: 'c4-l2',
        title: '2. Relational Database Modeling with SQL',
        durationMinutes: 60,
        videoUrl: 'https://www.youtube.com/embed/7S_tz1z_5bA',
        summary: 'Define 1-to-Many and Many-to-Many relations, execute schema migrations, and write optimized SQL queries.',
        notes: '### Schema Relations:\n- CREATE TABLE users (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE);\n- Foreign Key constraints for 1-to-Many relations',
        quiz: [
          {
            id: 'c4-l2-q1',
            question: 'What is the function of a Foreign Key constraint in SQL?',
            options: [
              'To speed up API requests',
              'To enforce referential integrity between tables',
              'To format JSON outputs',
              'To delete empty rows'
            ],
            correctIndex: 1,
            explanation: 'Foreign Key constraints ensure child rows reference valid parent records.'
          }
        ]
      },
      {
        id: 'c4-l3',
        title: '3. Advanced PostgreSQL Database Design',
        durationMinutes: 50,
        videoUrl: 'https://www.youtube.com/embed/qw--VYLpxG4',
        summary: 'Identify slow SQL queries using EXPLAIN ANALYZE, build B-Tree indexes, and implement connection pooling.',
        notes: '### Query Tuning:\n- Add indexes on foreign keys and frequently filtered columns (`WHERE user_id = ?`).',
        quiz: [
          {
            id: 'c4-l3-q1',
            question: 'What command displays the execution plan of a SQL query in PostgreSQL?',
            options: ['SHOW PLAN', 'EXPLAIN ANALYZE', 'DEBUG QUERY', 'TRACE SQL'],
            correctIndex: 1,
            explanation: '`EXPLAIN ANALYZE` executes the statement and returns exact timing and index usage statistics.'
          }
        ]
      }
    ]
  }
];
