import { StudentProfile, TeacherProfile, InterventionFlag, AIDecisionLog, Sentiment, ModuleStats, SupportedLanguage, TeacherMessage, AIVoice, StudyResource, UserRole, QuizQuestion, Message, LiveSession, QuizAttempt, ChatConversation } from "../types";

const API_URL = 'http://localhost:5000';

// Simulating the Postgres/Python backend data stores

// 0. Static Question Bank (Moved from Component)
const STATIC_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    topic: 'Algebra Basics',
    moduleId: 'm1',
    question: 'If 2x + 4 = 12, what is x?',
    options: ['3', '4', '6', '8'],
    correctAnswer: 1
  },
  {
    id: 2,
    topic: 'Algebra Basics',
    moduleId: 'm1',
    question: 'Simplify: 3(x + 2) - 2x',
    options: ['x + 6', 'x + 5', '5x + 6', 'x + 2'],
    correctAnswer: 0
  },
  {
    id: 3,
    topic: 'Newtonian Physics',
    moduleId: 'm2',
    question: 'Which of Newton\'s laws states that F = ma?',
    options: ['First Law', 'Second Law', 'Third Law', 'Law of Gravitation'],
    correctAnswer: 1
  },
  {
    id: 4,
    topic: 'Newtonian Physics',
    moduleId: 'm2',
    question: 'What is the standard unit of Force?',
    options: ['Joule', 'Watt', 'Newton', 'Pascal'],
    correctAnswer: 2
  },
  {
    id: 5,
    topic: 'American History',
    moduleId: 'm3',
    question: 'Who wrote the Declaration of Independence?',
    options: ['George Washington', 'Benjamin Franklin', 'Thomas Jefferson', 'John Adams'],
    correctAnswer: 2
  }
];

// 1. Initial Mock Students
const MOCK_STUDENTS: StudentProfile[] = [
  {
    id: 's1',
    name: 'Alice Chen',
    email: 'alice@example.com',
    password: 'password123',
    bio: 'Aspiring astrophysicist. Loves solving puzzles.',
    masteryScore: 65,
    topicsCompleted: 12,
    atRisk: false,
    sentimentTrend: [Sentiment.POSITIVE, Sentiment.POSITIVE],
    modules: [
      { id: 'm1', name: 'Algebra Basics', mastery: 85, timeSpent: 120, status: 'COMPLETED' },
      { id: 'm2', name: 'Newtonian Physics', mastery: 40, timeSpent: 180, status: 'IN_PROGRESS' },
      { id: 'm3', name: 'American History', mastery: 92, timeSpent: 90, status: 'IN_PROGRESS' },
      { id: 'm4', name: 'Organic Chemistry', mastery: 0, timeSpent: 0, status: 'LOCKED' }
    ],
    preferredLanguage: SupportedLanguage.ENGLISH,
    preferredVoice: AIVoice.Kore,
    savedResources: [],
    conversations: [], // Updated from chatHistory
    liveSessions: [],
    attempts: []
  },
  {
    id: 's2',
    name: 'Marcus Johnson',
    email: 'marcus@example.com',
    password: 'password123',
    masteryScore: 45,
    topicsCompleted: 3,
    atRisk: true,
    sentimentTrend: [Sentiment.FRUSTRATED, Sentiment.NEGATIVE],
    modules: [
      { id: 'm1', name: 'Algebra Basics', mastery: 45, timeSpent: 240, status: 'IN_PROGRESS' }, // High time, low score
      { id: 'm2', name: 'Newtonian Physics', mastery: 30, timeSpent: 45, status: 'IN_PROGRESS' },
      { id: 'm3', name: 'American History', mastery: 0, timeSpent: 0, status: 'LOCKED' },
      { id: 'm4', name: 'Organic Chemistry', mastery: 0, timeSpent: 0, status: 'LOCKED' }
    ],
    preferredLanguage: SupportedLanguage.ENGLISH,
    preferredVoice: AIVoice.Puck,
    savedResources: [],
    conversations: [],
    liveSessions: [],
    attempts: []
  },
  {
    id: 's3',
    name: 'Sarah Smith',
    email: 'sarah@example.com',
    password: 'password123',
    masteryScore: 78,
    topicsCompleted: 8,
    atRisk: false,
    sentimentTrend: [Sentiment.NEUTRAL, Sentiment.POSITIVE],
    modules: [
      { id: 'm1', name: 'Algebra Basics', mastery: 85, timeSpent: 110, status: 'COMPLETED' },
      { id: 'm2', name: 'Newtonian Physics', mastery: 72, timeSpent: 150, status: 'IN_PROGRESS' },
      { id: 'm3', name: 'American History', mastery: 60, timeSpent: 40, status: 'IN_PROGRESS' },
      { id: 'm4', name: 'Organic Chemistry', mastery: 0, timeSpent: 0, status: 'LOCKED' }
    ],
    preferredLanguage: SupportedLanguage.ENGLISH,
    preferredVoice: AIVoice.Zephyr,
    savedResources: [],
    conversations: [],
    liveSessions: [],
    attempts: []
  },
  {
    id: 's4',
    name: 'David Kim',
    email: 'david@example.com',
    password: 'password123',
    masteryScore: 62,
    topicsCompleted: 5,
    atRisk: true,
    sentimentTrend: [Sentiment.NEGATIVE, Sentiment.NEUTRAL],
    modules: [
      { id: 'm1', name: 'Algebra Basics', mastery: 75, timeSpent: 130, status: 'COMPLETED' },
      { id: 'm2', name: 'Newtonian Physics', mastery: 40, timeSpent: 200, status: 'IN_PROGRESS' },
      { id: 'm3', name: 'American History', mastery: 0, timeSpent: 0, status: 'LOCKED' },
      { id: 'm4', name: 'Organic Chemistry', mastery: 0, timeSpent: 0, status: 'LOCKED' }
    ],
    preferredLanguage: SupportedLanguage.ENGLISH,
    preferredVoice: AIVoice.Fenrir,
    savedResources: [],
    conversations: [],
    liveSessions: [],
    attempts: []
  },
];

// Mock Teachers
const MOCK_TEACHERS: TeacherProfile[] = [
  {
    id: 't1',
    name: 'Mr. Anderson',
    email: 'teacher@school.edu',
    password: 'Bhagesh@4604', // Updated Password
    subject: 'Physics & Mathematics',
    bio: 'Passionate about making STEM accessible to everyone. 15 years of teaching experience.',
    yearsOfExperience: 15,
    phone: '+1 (555) 0123-456'
  }
];

// 2. Initial Logs (XAI)
const MOCK_LOGS: AIDecisionLog[] = [
  {
    id: 'l1',
    studentId: 's2',
    studentInput: "I don't get this! Why is the answer 4?",
    aiOutput: "Let's look at the equation again. What happens if you subtract 2 from both sides?",
    reasoning: "Student expressed frustration. Shifted to scaffolding technique to lower cognitive load.",
    timestamp: Date.now() - 100000
  }
];

// 3. Messages
const MOCK_MESSAGES: TeacherMessage[] = [];

// Helper for deep cloning to prevent reference freezing issues with React state
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

const LOCAL_STORAGE_KEY = 'h2ala_mock_db_v1';

// Service to manage "State" across the app
class DataService {
  private students: StudentProfile[] = deepClone(MOCK_STUDENTS);
  private teachers: TeacherProfile[] = deepClone(MOCK_TEACHERS);
  private logs: AIDecisionLog[] = deepClone(MOCK_LOGS);
  private messages: TeacherMessage[] = deepClone(MOCK_MESSAGES);
  private questionBank: QuizQuestion[] = deepClone(STATIC_QUESTIONS);

  private currentStudentId: string = 's1';
  private currentTeacherId: string = 't1';

  // --- PUB/SUB FOR IMMEDIATE UPDATES ---
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      const data = {
        students: this.students,
        teachers: this.teachers,
        logs: this.logs,
        messages: this.messages,
        questionBank: this.questionBank
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          // Simple validation/merging logic (in a real app, this would be more robust)
          if (parsed.students) this.students = parsed.students;
          if (parsed.teachers) this.teachers = parsed.teachers;
          if (parsed.logs) this.logs = parsed.logs;
          if (parsed.messages) this.messages = parsed.messages;
          if (parsed.questionBank) this.questionBank = parsed.questionBank;
        } catch (e) {
          console.error("Failed to load local storage data", e);
        }
      }
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.saveToStorage(); // Persistence on every update
    this.listeners.forEach(l => l());
  }

  // --- AUTH METHODS ---

  async login(email: string, password: string, role: UserRole): Promise<{ success: boolean, user?: StudentProfile | TeacherProfile, message?: string }> {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role: role.toString() })
        });
        const data = await response.json();
        if (response.ok) {
            // In a real app, you'd fetch the user profile from the backend
            // Here we'll just find them in the mock data for now
            let user;
            if (role === UserRole.STUDENT) {
                user = this.students.find(s => s.email === email);
            } else {
                user = this.teachers.find(t => t.email === email);
            }

            if (user) {
                if (role === UserRole.STUDENT) this.currentStudentId = user.id;
                else this.currentTeacherId = user.id;
                return { success: true, user: deepClone(user) };
            }
        }
        return { success: false, message: data.message || 'Login failed' };
    } catch (error) {
        return { success: false, message: 'Network error' };
    }
  }

  async registerStudent(name: string, email: string, password:string): Promise<{ success: boolean, user?: StudentProfile, message?: string }> {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        console.log("Registration response data:", JSON.stringify(data)); 
        if (response.ok) {
            console.log("Response is OK, creating new student object."); // <-- ADDED
            const newStudent: StudentProfile = {
                id: data.id,
                name,
                email,
                password,
                masteryScore: 0,
                topicsCompleted: 0,
                atRisk: false,
                sentimentTrend: [],
                modules: [
                    { id: 'm1', name: 'Algebra Basics', mastery: 0, timeSpent: 0, status: 'IN_PROGRESS' },
                    { id: 'm2', name: 'Newtonian Physics', mastery: 0, timeSpent: 0, status: 'LOCKED' },
                ],
                preferredLanguage: SupportedLanguage.ENGLISH,
                preferredVoice: AIVoice.Kore,
                savedResources: [],
                conversations: [],
                liveSessions: [],
                attempts: []
            };
            this.students.push(newStudent);
            this.currentStudentId = newStudent.id;
            this.notify();
            try {
                const userClone = deepClone(newStudent);
                console.log("Successfully cloned student object."); // <-- ADDED
                return { success: true, user: userClone };
            } catch (cloneError) {
                console.error("Error cloning student object:", cloneError); // <-- ADDED
                return { success: false, message: "Failed to process user profile after creation." };
            }
        }
        return { success: false, message: data.message || 'Registration failed' };
    } catch (error) {
        console.error("Registration fetch error:", error); // <-- ADDED
        return { success: false, message: 'Network error' };
    }
  }

  registerTeacher(name: string, email: string, password: string, subject: string): { success: boolean, user?: TeacherProfile, message?: string } {
    return { success: false, message: 'Teacher registration is restricted. Please contact the administrator.' };
  }

  // --- EXISTING METHODS ---

  getStudents(): StudentProfile[] {
    return deepClone(this.students);
  }

  getStudent(id: string): StudentProfile | undefined {
    const s = this.students.find(s => s.id === id);
    return s ? deepClone(s) : undefined;
  }

  getCurrentStudent(): StudentProfile {
    const s = this.students.find(s => s.id === this.currentStudentId) || this.students[0];
    return deepClone(s);
  }

  setCurrentStudent(id: string) {
    this.currentStudentId = id;
  }

  // Teacher Methods
  getCurrentTeacher(): TeacherProfile {
    const t = this.teachers.find(t => t.id === this.currentTeacherId) || this.teachers[0];
    return deepClone(t);
  }

  // Update Profile Methods
  updateStudentProfile(id: string, updates: Partial<StudentProfile>) {
    const studentIndex = this.students.findIndex(s => s.id === id);
    if (studentIndex > -1) {
      this.students[studentIndex] = { ...this.students[studentIndex], ...updates };
      this.notify();
    }
  }

  updateTeacherProfile(id: string, updates: Partial<TeacherProfile>) {
    const teacherIndex = this.teachers.findIndex(t => t.id === id);
    if (teacherIndex > -1) {
      this.teachers[teacherIndex] = { ...this.teachers[teacherIndex], ...updates };
      this.notify();
    }
  }

  setStudentLanguage(id: string, language: SupportedLanguage) {
    const student = this.students.find(s => s.id === id);
    if (student) {
      student.preferredLanguage = language;
      this.notify();
    }
  }

  // Simulating the Python "Intervention Flagging" logic
  getInterventions(): InterventionFlag[] {
    return this.students
      .filter(s => s.atRisk || s.masteryScore < 60)
      .map(s => ({
        id: `flag_${s.id}`,
        studentId: s.id,
        studentName: s.name,
        reason: s.masteryScore < 50 ? "Critically Low Mastery" : "Negative Sentiment Trend",
        severity: s.masteryScore < 50 ? 'HIGH' : 'MEDIUM',
        timestamp: Date.now()
      }));
  }

  getLogs(): AIDecisionLog[] {
    return deepClone(this.logs).sort((a, b) => b.timestamp - a.timestamp);
  }

  addLog(log: Omit<AIDecisionLog, 'id'>) {
    const newLog = { ...log, id: Math.random().toString(36).substr(2, 9) };
    this.logs.unshift(newLog);
    this.notify();
  }

  // Update specific module score with automatic unlocking logic
  updateModuleScore(studentId: string, moduleId: string, scoreDelta: number, timeSpentDelta: number) {
    const student = this.students.find(s => s.id === studentId);
    if (student) {
      const moduleIndex = student.modules.findIndex(m => m.id === moduleId);
      const module = student.modules[moduleIndex];

      if (module) {
        // Update Module stats (clamp 0-100)
        module.mastery = Math.max(0, Math.min(100, module.mastery + scoreDelta));
        module.timeSpent += timeSpentDelta;

        // Check Completion & Unlock Logic
        if (module.mastery >= 90) {
          module.status = 'COMPLETED';

          // Unlock the NEXT module in the sequence
          const nextModule = student.modules[moduleIndex + 1];
          if (nextModule && nextModule.status === 'LOCKED') {
             nextModule.status = 'IN_PROGRESS';
          }
        } 
        else if (module.mastery > 0 && module.status === 'LOCKED') {
          module.status = 'IN_PROGRESS';
        }

        // Recalculate Overall Mastery
        const totalMastery = student.modules.reduce((acc, m) => acc + m.mastery, 0);
        student.masteryScore = Math.floor(totalMastery / student.modules.length);

        // Update topics completed count
        student.topicsCompleted = student.modules.filter(m => m.status === 'COMPLETED').length;
        this.notify();
      }
    }
  }

  // --- QUIZ & ASSESSMENT METHODS ---

  getModuleQuestions(moduleId: string): QuizQuestion[] {
    return deepClone(this.questionBank.filter(q => q.moduleId === moduleId));
  }

  createAIModule(studentId: string, topic: string, questions: QuizQuestion[]) {
    const student = this.students.find(s => s.id === studentId);
    if (!student) return;

    const newModuleId = `ai_mod_${Date.now()}`;
    const newModule: ModuleStats = {
      id: newModuleId,
      name: topic,
      mastery: 0,
      timeSpent: 0,
      status: 'IN_PROGRESS'
    };

    // Add module to student
    student.modules.unshift(newModule); // Add to top

    // Save questions to bank
    questions.forEach(q => {
      q.moduleId = newModuleId;
      this.questionBank.push(q);
    });

    this.notify();
  }

  recordQuizAttempt(studentId: string, moduleId: string, score: number, maxScore: number) {
    const student = this.students.find(s => s.id === studentId);
    if (student) {
      if (!student.attempts) student.attempts = [];
      student.attempts.unshift({
        id: `att_${Date.now()}`,
        date: Date.now(),
        moduleId,
        score,
        maxScore
      });
      this.notify();
    }
  }

  // Messaging
  sendTeacherMessage(studentId: string, content: string) {
    const teacher = this.teachers.find(t => t.id === this.currentTeacherId) || this.teachers[0];
    const msg: TeacherMessage = {
      id: Math.random().toString(36).substr(2, 9),
      studentId,
      teacherName: teacher.name, 
      content,
      timestamp: Date.now(),
      read: false
    };
    this.messages.push(msg);
    this.notify();
  }

  getStudentMessages(studentId: string): TeacherMessage[] {
    return deepClone(this.messages.filter(m => m.studentId === studentId).sort((a, b) => b.timestamp - a.timestamp));
  }

  // Resource Management
  saveResource(studentId: string, resource: StudyResource) {
    const student = this.students.find(s => s.id === studentId);
    if (student) {
      // Check for duplicates
      if (!student.savedResources.find(r => r.uri === resource.uri)) {
        student.savedResources.unshift({ ...resource, dateSaved: Date.now() });
        this.notify();
      }
    }
  }

  removeResource(studentId: string, resourceId: string) {
    const student = this.students.find(s => s.id === studentId);
    if (student) {
      student.savedResources = student.savedResources.filter(r => r.id !== resourceId);
      this.notify();
    }
  }

  // --- CHAT HISTORY METHODS (Structured) ---

  createNewConversation(studentId: string, initialTitle: string = 'New Chat'): string {
    const student = this.students.find(s => s.id === studentId);
    if (student) {
      if (!student.conversations) student.conversations = [];
      
      const newConv: ChatConversation = {
        id: `conv_${Date.now()}`,
        title: initialTitle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: []
      };
      
      student.conversations.unshift(newConv);
      this.notify();
      return newConv.id;
    }
    return '';
  }

  getConversations(studentId: string): ChatConversation[] {
    const student = this.students.find(s => s.id === studentId);
    return student && student.conversations ? deepClone(student.conversations) : [];
  }

  getConversation(studentId: string, conversationId: string): ChatConversation | undefined {
    const student = this.students.find(s => s.id === studentId);
    if (student && student.conversations) {
       const conv = student.conversations.find(c => c.id === conversationId);
       return conv ? deepClone(conv) : undefined;
    }
    return undefined;
  }

  saveChatMessage(studentId: string, conversationId: string, message: Message) {
    const student = this.students.find(s => s.id === studentId);
    if (student && student.conversations) {
       const conv = student.conversations.find(c => c.id === conversationId);
       if (conv) {
         conv.messages.push(message);
         conv.updatedAt = Date.now();
         this.notify();
       }
    }
  }

  updateConversationTitle(studentId: string, conversationId: string, newTitle: string) {
    const student = this.students.find(s => s.id === studentId);
    if (student && student.conversations) {
       const conv = student.conversations.find(c => c.id === conversationId);
       if (conv) {
         conv.title = newTitle;
         this.notify();
       }
    }
  }

  // --- LIVE SESSION HISTORY ---
  saveLiveSession(studentId: string, session: LiveSession) {
    const student = this.students.find(s => s.id === studentId);
    if (student) {
       student.liveSessions.unshift(session);
       this.notify();
    }
  }

  getLiveSessions(studentId: string): LiveSession[] {
    const student = this.students.find(s => s.id === studentId);
    return student ? deepClone(student.liveSessions) : [];
  }
}

export const db = new DataService();