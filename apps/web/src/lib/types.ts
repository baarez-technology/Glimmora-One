// Mirror of backend Pydantic schemas (camelCase via Pydantic alias generator).

export type User = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  role: 'superadmin' | 'admin' | 'creator' | 'member';
  avatarUrl: string | null;
  bio: string | null;
  preferences: Record<string, unknown>;
  subscriptionTier: 'free' | 'premium';
  createdAt: string;
};

export type Episode = {
  id: string;
  seriesId: string;
  title: string;
  slug: string;
  synopsis: string | null;
  durationSeconds: number;
  orderIndex: number;
  videoUrl: string;
  posterUrl: string | null;
  reflectionPrompt: string | null;
  tier: 'free' | 'premium';
};

export type Series = {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  category: string;
  coverUrl: string | null;
  heroUrl: string | null;
  accentColor: string | null;
  tier: 'free' | 'premium';
  tags: string[];
  episodes: Episode[];
};

export type WatchProgress = {
  episodeId: string;
  positionSeconds: number;
  completed: boolean;
  updatedAt: string;
};

export type ContinueWatchingItem = {
  episode: Episode;
  seriesTitle: string;
  seriesSlug: string;
  seriesCoverUrl: string | null;
  progress: WatchProgress;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  emotion: string | null;
  createdAt: string;
};

export type ChatResponse = {
  conversationId: string;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  detectedEmotion: string | null;
  suggestedReflection: string | null;
  recommendedEpisodeIds: string[];
  crisis: boolean;
};

export type DailyStep = {
  key: 'arrive' | 'notice' | 'reflect';
  title: string;
  description: string;
  done: boolean;
  href: string;
  cta: string;
};

export type DailyPlan = {
  date: string;
  intention: string | null;
  focusAreas: string[];
  steps: DailyStep[];
  streak: number;
  allDone: boolean;
};

export type CreatorApplication = {
  id: string;
  userId: string;
  username: string;
  pitch: string;
  sampleUrl: string | null;
  status: 'pending' | 'approved' | 'denied';
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string;
};

export type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
  lastMessagePreview: string | null;
};

export type Reflection = {
  id: string;
  prompt: string | null;
  content: string;
  mood: string | null;
  intensity: number;
  tags: string[];
  episodeId: string | null;
  insights: string | null;
  createdAt: string;
};

export type EmotionTrendPoint = {
  date: string;
  mood: string | null;
  intensity: number;
  count: number;
};

export type DigitalTwinSnapshot = {
  totalReflections: number;
  streakDays: number;
  dominantMood: string | null;
  averageIntensity: number;
  last30Days: EmotionTrendPoint[];
  growthMilestones: string[];
  tagCloud: { tag: string; count: number }[];
};

export type Circle = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  theme: string;
  postCount: number;
};

export type CirclePost = {
  id: string;
  circleId: string;
  anonymousHandle: string;
  body: string;
  flagged: boolean;
  createdAt: string;
};
