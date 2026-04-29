// ── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  username: string;
}

// ── Research ──────────────────────────────────────────────────────────────────

export interface ResearchRequest {
  query: string;
  searchTopN?: number;
  rerankerTopK?: number;
  retrieverTopK?: number;
  refinementIterations?: number;
}

export type JobStatus = 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface JobSubmittedResponse {
  jobId: string;
  status: JobStatus;
  createdAt: string;
  streamUrl: string;
  statusUrl: string;
}

export interface CriticFeedback {
  factualCorrectnessScore: number;
  completenessScore: number;
  hallucinationRisk: number;
  missingInformation: string[];
  improvementSuggestions: string[];
  overallQuality: number;
}

export interface ResearchResult {
  answer: string;
  sources: string[];
  confidence: number;
  criticFeedback?: CriticFeedback;
  refinementIterationsRun: number;
  elapsedSeconds: number;
  pipelineErrors: string[];
}

export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  query: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  elapsedMs?: number;
  errorMessage?: string;
  result?: ResearchResult;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ── SSE Events ────────────────────────────────────────────────────────────────

export interface JobEvent {
  jobId: string;
  status: JobStatus;
  timestamp: string;
  result?: ResearchResult;
}

// ── UI State ──────────────────────────────────────────────────────────────────

export interface User {
  username: string;
  email?: string;
  fullName?: string;
  roles: string[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface AdminStats {
  totalJobs: number;
  activeJobs: number;
  activeSseStreams: number;
  timestamp: string;
}
