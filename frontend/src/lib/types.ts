export type Domain = {
  id: string;
  familyId: string;
  name: string;
  summary: string;
  availability: "published";
  publishedAt?: string;
};

export type PathwaySummary = {
  id: string;
  title: string;
  version: number;
  status: "published";
};

export type DomainDetail = Domain & {
  pathways: PathwaySummary[];
};

export type QuizSummary = {
  id: string;
  questionCount: number;
};

export type Lesson = {
  id: string;
  position: number;
  title: string;
  objective: string;
  explanation?: string;
  activity?: string;
  durationMinutes?: number | null;
  resourceIds?: string[];
  quizzes: QuizSummary[];
};

export type PathwayWeek = {
  id: string;
  position: number;
  title: string;
  label?: string;
  lessons: Lesson[];
};

export type ProjectChecklistItem = {
  stableKey: string;
  position: number;
  label: string;
};

export type ProjectBrief = {
  id: string;
  title: string;
  instructions: string;
  checklist: ProjectChecklistItem[];
};

export type Resource = {
  id: string;
  title: string;
  url: string;
  provider?: string | null;
  language?: string | null;
  kind: "article" | "course" | "video" | "search" | "document" | "other";
  accessNote?: string | null;
  verificationStatus: "verified" | "unverified";
};

export type Pathway = {
  id: string;
  domainId: string;
  title: string;
  eyebrow: string | null;
  description?: string;
  overview?: string;
  version: number;
  status: "published";
  difficulty?: string;
  prerequisites?: string[];
  equipment?: string[];
  skills: string[];
  careerExamples: string[];
  weeklyTime?: string | null;
  safetyNote?: string | null;
  weeks: PathwayWeek[];
  projects: ProjectBrief[];
  completionPolicy?: {
    allLessonsRequired: boolean;
    requiredQuizIds: string[];
    minimumScorePercent?: number | null;
  } | null;
  resources?: Resource[];
};

export type SearchResult = {
  type: "domain" | "pathway" | "lesson" | "resource";
  id: string;
  title: string;
  summary?: string;
  domainId?: string;
  availability: "published";
};

export type PublicQuiz = {
  id: string;
  lessonId: string;
  version: number;
  questions: Array<{
    id: string;
    prompt: string;
    options: Array<{ id: string; label: string }>;
  }>;
};

export type PageMeta = {
  limit: number;
  hasMore: boolean;
  nextCursor?: string | null;
};
