// Dashboard types and interfaces
export interface DashboardStats {
  totalDocuments: number
  chatSessions: number
  savedItems: number
  monthlyUsage: number
}

// Enhanced Analytics Types
export interface PersonalizedRecommendation {
  id: string
  type: 'article' | 'qa' | 'template' | 'practice_area'
  title: string
  description: string
  practiceArea: string
  relevanceScore: number
  reason: string
  contentId: string
  thumbnail?: string
  estimatedReadTime?: number
  lastUpdated: string
}

export interface UsageAnalytics {
  dailyActivity: Array<{
    date: string
    documents: number
    chats: number
    searches: number
    views: number
  }>
  practiceAreaBreakdown: Array<{
    area: string
    percentage: number
    count: number
    trend: 'up' | 'down' | 'stable'
  }>
  contentEngagement: {
    mostViewedArticles: Array<{
      id: string
      title: string
      views: number
      practiceArea: string
    }>
    bookmarkTrends: Array<{
      month: string
      bookmarks: number
    }>
    searchPatterns: Array<{
      query: string
      frequency: number
      lastSearched: string
    }>
  }
  timeSpentAnalytics: {
    totalHours: number
    averageSessionLength: number
    peakUsageHours: Array<{
      hour: number
      activity: number
    }>
  }
}

export interface UserPreferences {
  practiceAreasInterest: string[]
  contentTypes: ('articles' | 'qa' | 'templates' | 'guides')[]
  notificationSettings: {
    email: boolean
    push: boolean
    sms: boolean
    deadlineReminders: boolean
    contentUpdates: boolean
    weeklyDigest: boolean
  }
  dashboardLayout: {
    widgets: Array<{
      id: string
      type: string
      position: { x: number; y: number }
      size: { width: number; height: number }
      visible: boolean
    }>
  }
  language: 'en' | 'zh' | 'ms' | 'ta'
  timezone: string
}



export interface DocumentCollection {
  id: string
  name: string
  description: string
  color: string
  icon: string
  documentCount: number
  tags: string[]
  isShared: boolean
  collaborators: Array<{
    userId: string
    name: string
    permission: 'view' | 'edit' | 'admin'
  }>
  createdAt: string
  updatedAt: string
}

export interface EnhancedDocument {
  id: string
  title: string
  description: string
  fileName: string
  filePath: string
  fileSize: number
  fileType: string
  practiceArea: string
  tags: string[]
  collections: string[]
  version: number
  parentDocumentId?: string
  isLatestVersion: boolean
  annotations: Array<{
    id: string
    text: string
    page?: number
    position?: { x: number; y: number }
    createdAt: string
  }>
  collaborators: Array<{
    userId: string
    name: string
    permission: 'view' | 'edit'
    lastAccessed: string
  }>
  accessHistory: Array<{
    userId: string
    action: 'view' | 'edit' | 'download' | 'share'
    timestamp: string
  }>
  isFavorite: boolean
  uploadDate: string
  lastModified: string
  lastAccessed: string
}

// Subscription & Billing Types
export interface SubscriptionDetails {
  id: string
  tier: 'free' | 'basic' | 'premium' | 'enterprise'
  status: 'active' | 'cancelled' | 'past_due' | 'trialing'
  billingCycle: 'monthly' | 'yearly'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  trialEnd?: string
  usage: {
    documents: { used: number; limit: number }
    aiQueries: { used: number; limit: number }
    storage: { used: number; limit: number }
    teamMembers: { used: number; limit: number }
  }
  billingHistory: Array<{
    id: string
    amount: number
    currency: string
    status: 'paid' | 'pending' | 'failed'
    date: string
    invoiceUrl?: string
  }>
  paymentMethods: Array<{
    id: string
    type: 'card' | 'bank' | 'nets'
    last4?: string
    brand?: string
    isDefault: boolean
    expiryMonth?: number
    expiryYear?: number
  }>
}

// Widget Types for Customizable Dashboard
export interface DashboardWidget {
  id: string
  type: 'stats' | 'chart' | 'list' | 'calendar' | 'recommendations' | 'recent_activity'
  title: string
  size: 'small' | 'medium' | 'large'
  position: { x: number; y: number }
  config: Record<string, any>
  visible: boolean
  refreshInterval?: number
}

// Search and Content Types

export interface ContentNote {
  id: string
  contentId: string
  contentType: 'article' | 'qa' | 'template'
  note: string
  isPrivate: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

// Activity and Engagement Types
export interface UserActivity {
  id: string
  type: 'view' | 'bookmark' | 'search' | 'download' | 'share' | 'chat' | 'document_upload'
  description: string
  metadata: Record<string, any>
  timestamp: string
}

// Legal Deadline & Task Management Types - Phase 4
export interface LegalDeadline {
  id: string
  userId: string
  title: string
  description: string
  deadlineDate: string
  deadlineTime?: string
  practiceArea: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'upcoming' | 'due_today' | 'overdue' | 'completed' | 'cancelled'
  category: 'court_filing' | 'client_meeting' | 'document_submission' | 'hearing' | 'appeal' | 'compliance' | 'other'

  // Singapore-specific fields
  courtType?: 'supreme_court' | 'high_court' | 'district_court' | 'magistrate_court' | 'family_court' | 'syariah_court' | 'other'
  caseNumber?: string
  courtLocation?: string

  // Reminder settings
  reminders: Array<{
    id: string
    type: 'email' | 'push' | 'sms'
    timing: number // minutes before deadline
    sent: boolean
    sentAt?: string
  }>

  // Related entities
  relatedDocuments: string[] // document IDs
  relatedTasks: string[] // task IDs
  assignedTo?: string // user ID for team collaboration

  // Metadata
  isRecurring: boolean
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    endDate?: string
  }

  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface LegalTask {
  id: string
  userId: string
  title: string
  description: string
  status: 'not_started' | 'in_progress' | 'review' | 'completed' | 'cancelled' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'research' | 'drafting' | 'review' | 'filing' | 'client_communication' | 'court_appearance' | 'compliance' | 'administrative'

  // Task scheduling
  startDate?: string
  dueDate?: string
  estimatedHours?: number
  actualHours?: number

  // Dependencies and workflow
  dependencies: string[] // task IDs that must be completed first
  blockedBy?: string // task ID that is blocking this task
  parentTaskId?: string // for subtasks
  milestoneId?: string // associated milestone

  // Assignment and collaboration
  assignedTo?: string // user ID
  assignedBy?: string // user ID
  collaborators: string[] // user IDs

  // Progress tracking
  progressPercentage: number
  checklistItems: Array<{
    id: string
    text: string
    completed: boolean
    completedAt?: string
    completedBy?: string
  }>

  // Related entities
  relatedDeadlines: string[] // deadline IDs
  relatedDocuments: string[] // document IDs
  practiceArea: string

  // Metadata
  tags: string[]
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface LegalMilestone {
  id: string
  userId: string
  title: string
  description: string
  category: 'case_milestone' | 'project_milestone' | 'compliance_milestone' | 'business_milestone'
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'

  // Timeline
  startDate: string
  targetDate: string
  completedDate?: string

  // Associated entities
  tasks: string[] // task IDs
  deadlines: string[] // deadline IDs
  practiceArea: string

  // Progress tracking
  progressPercentage: number
  criticalPath: boolean

  // Metadata
  createdAt: string
  updatedAt: string
}

export interface NotificationPreference {
  id: string
  userId: string

  // Notification channels
  emailEnabled: boolean
  pushEnabled: boolean
  smsEnabled: boolean

  // Timing preferences
  defaultReminderTimes: number[] // minutes before deadline
  businessHoursOnly: boolean
  weekendsEnabled: boolean

  // Content preferences
  deadlineReminders: boolean
  taskReminders: boolean
  milestoneUpdates: boolean
  collaborationNotifications: boolean
  systemUpdates: boolean

  // Escalation rules
  escalationEnabled: boolean
  escalationRules: Array<{
    condition: 'overdue' | 'high_priority' | 'critical'
    action: 'email_supervisor' | 'sms_alert' | 'system_alert'
    delay: number // minutes after condition is met
  }>

  createdAt: string
  updatedAt: string
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  allDay: boolean

  // Event type
  type: 'deadline' | 'task' | 'milestone' | 'court_date' | 'meeting' | 'reminder'

  // Related entities
  relatedId?: string // ID of related deadline, task, or milestone
  practiceArea?: string

  // Display properties
  color: string
  priority: 'low' | 'medium' | 'high' | 'critical'

  // Metadata
  createdAt: string
  updatedAt: string
}

// Saved Content Organization Types - Advanced Content Management
export interface ContentCollection {
  id: string
  userId: string
  parentCollectionId?: string

  // Collection Details
  name: string
  description?: string
  color: string
  icon: string

  // Organization
  sortOrder: number
  isSmartCollection: boolean
  smartRules?: SmartCollectionRules

  // Visibility and Sharing
  visibility: 'private' | 'shared' | 'team' | 'public'
  isDefault: boolean

  // Metadata
  tags: string[]
  itemCount?: number
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface SmartCollectionRules {
  conditions: Array<{
    field: 'content_type' | 'tags' | 'title' | 'author' | 'date_saved'
    operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'before' | 'after'
    value: string | string[]
  }>
  logic: 'and' | 'or'
}

export interface SavedContentItem {
  id: string
  userId: string
  collectionId?: string

  // Content Reference
  contentType: 'article' | 'qa' | 'document' | 'template' | 'external'
  contentId?: string
  externalUrl?: string

  // Content Details (cached)
  title: string
  description?: string
  contentPreview?: string
  authorName?: string
  sourceName?: string

  // Organization
  customTitle?: string
  notes?: string
  tags: string[]
  priority: 0 | 1 | 2 // 0=normal, 1=important, 2=urgent

  // Status and Metadata
  isFavorite: boolean
  isArchived: boolean
  readStatus: 'unread' | 'reading' | 'read'
  readingProgress: number // Percentage

  // Timestamps
  savedAt: string
  lastAccessed?: string
  archivedAt?: string

  // Related Data
  collection?: ContentCollection
  annotations?: ContentAnnotation[]
  annotationCount?: number

  // Search
  relevanceScore?: number
  metadata: Record<string, any>
}

export interface ContentTag {
  id: string
  userId: string

  // Tag Details
  name: string
  description?: string
  color: string

  // Organization
  category?: 'practice_area' | 'priority' | 'status' | 'custom'
  parentTagId?: string
  sortOrder: number

  // Usage Statistics
  usageCount: number
  lastUsed?: string

  // Metadata
  isSystemTag: boolean
  createdAt: string
  updatedAt: string
}

export interface ContentAnnotation {
  id: string
  userId: string
  savedContentId: string

  // Annotation Details
  annotationType: 'note' | 'highlight' | 'bookmark' | 'comment' | 'tag'
  content: string

  // Position Information
  startPosition?: number
  endPosition?: number
  pageNumber?: number
  sectionId?: string

  // Visual Properties
  color: string
  styleProperties?: Record<string, any>

  // Organization
  tags: string[]
  isPrivate: boolean

  // Metadata
  createdAt: string
  updatedAt: string
}

export interface ContentShare {
  id: string
  sharedBy: string

  // What's being shared
  contentType: 'item' | 'collection' | 'annotation'
  contentId: string

  // Sharing Details
  shareToken?: string
  sharedWith?: string
  permission: 'view' | 'comment' | 'edit' | 'admin'

  // Access Control
  expiresAt?: string
  isPublic: boolean
  requiresLogin: boolean
  accessCount: number

  // Metadata
  shareMessage?: string
  createdAt: string
  lastAccessed?: string
}

export interface SavedSearch {
  id: string
  userId: string

  // Search Details
  name: string
  description?: string
  queryText: string
  filters: SearchFilters

  // Automation
  isAlert: boolean
  alertFrequency?: 'daily' | 'weekly' | 'monthly'
  lastRun?: string
  nextRun?: string

  // Results Tracking
  resultCount: number
  lastResultCount: number

  // Metadata
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

export interface SearchFilters {
  collectionIds?: string[]
  tags?: string[]
  contentTypes?: string[]
  contentType?: string
  readStatus?: 'unread' | 'reading' | 'read'
  isFavorite?: boolean
  dateFrom?: string
  dateTo?: string
  dateRange?: string
  priority?: string
  hasAnnotations?: string
}

export interface ContentExport {
  id: string
  userId: string

  // Export Details
  exportName: string
  exportFormat: 'pdf' | 'docx' | 'json' | 'csv' | 'html'
  contentSelection: {
    type: 'all' | 'collection' | 'search' | 'selected'
    collectionIds?: string[]
    itemIds?: string[]
    searchQuery?: string
  }

  // Export Configuration
  templateSettings?: Record<string, any>
  includeAnnotations: boolean
  includeMetadata: boolean

  // File Information
  filePath?: string
  fileSize?: number
  downloadCount: number

  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage?: string

  // Timestamps
  createdAt: string
  completedAt?: string
  expiresAt?: string
}

export interface EngagementMetrics {
  sessionDuration: number
  pageViews: number
  bounceRate: number
  conversionEvents: Array<{
    event: string
    timestamp: string
    value?: number
  }>
  userJourney: Array<{
    step: string
    timestamp: string
    duration: number
  }>
}
