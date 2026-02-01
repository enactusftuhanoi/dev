// Định nghĩa tất cả collections trong Firestore
export const DB_COLLECTIONS = {
    // Core collections
    MEMBERS: 'members',
    DEPARTMENTS: 'departments',
    SKILLS: 'skills',
    ROLES: 'roles',
    
    // Project Management
    PROJECTS: 'projects',
    TASKS: 'tasks',
    MILESTONES: 'milestones',
    TEAMS: 'teams',
    
    // Event Management
    EVENTS: 'events',
    EVENT_REGISTRATIONS: 'event_registrations',
    EVENT_ATTENDANCE: 'event_attendance',
    
    // Finance
    TRANSACTIONS: 'transactions',
    BUDGETS: 'budgets',
    SPONSORS: 'sponsors',
    INVOICES: 'invoices',
    
    // Content & Communication
    ANNOUNCEMENTS: 'announcements',
    POSTS: 'posts',
    MEDIA: 'media',
    NOTIFICATIONS: 'notifications',
    
    // Learning & Development
    TRAININGS: 'trainings',
    COURSES: 'courses',
    CERTIFICATIONS: 'certifications',
    
    // Gamification
    ACHIEVEMENTS: 'achievements',
    POINTS: 'points',
    BADGES: 'badges',
    LEADERBOARDS: 'leaderboards',
    
    // System
    SETTINGS: 'settings',
    LOGS: 'logs',
    AUDIT_TRAILS: 'audit_trails',
    BACKUPS: 'backups'
};

// Status constants
export const MEMBER_STATUS = {
    PENDING: 'pending',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    ALUMNI: 'alumni',
    SUSPENDED: 'suspended'
};

export const PROJECT_STATUS = {
    DRAFT: 'draft',
    PLANNING: 'planning',
    IN_PROGRESS: 'in_progress',
    ON_HOLD: 'on_hold',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

export const EVENT_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

// Export all
export default {
    DB_COLLECTIONS,
    MEMBER_STATUS,
    PROJECT_STATUS,
    EVENT_STATUS
};