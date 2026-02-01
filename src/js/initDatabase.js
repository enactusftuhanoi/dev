import { db } from '../firebase/config.js';
import { DB_COLLECTIONS } from '../firebase/collections.js';
import {
    collection,
    doc,
    setDoc,
    getDocs,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';

class DatabaseInitializer {
    
    constructor() {
        this.initialized = false;
    }
    
    /**
     * Khởi tạo database với dữ liệu mẫu
     */
    async initialize() {
        if (this.initialized) {
            console.log('⚠️ Database already initialized');
            return;
        }
        
        console.log('🚀 Starting database initialization...');
        
        try {
            // 1. Check if already initialized
            const isInitialized = await this.checkIfInitialized();
            if (isInitialized) {
                console.log('✅ Database already initialized, skipping...');
                this.initialized = true;
                return;
            }
            
            // 2. Create default departments
            await this.createDefaultDepartments();
            
            // 3. Create default skills
            await this.createDefaultSkills();
            
            // 4. Create system settings
            await this.createSystemSettings();
            
            // 5. Create admin account
            await this.createAdminAccount();
            
            // 6. Create sample data (optional)
            await this.createSampleData();
            
            this.initialized = true;
            console.log('🎉 Database initialization completed successfully!');
            
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }
    
    async checkIfInitialized() {
        try {
            // Check if departments exist
            const deptsQuery = query(collection(db, DB_COLLECTIONS.DEPARTMENTS));
            const deptsSnapshot = await getDocs(deptsQuery);
            
            // Check if settings exist
            const settingsRef = doc(db, DB_COLLECTIONS.SETTINGS, 'system_settings');
            const settingsSnap = await getDocs(query(collection(db, DB_COLLECTIONS.SETTINGS)));
            
            return deptsSnapshot.size > 0 || !settingsSnap.empty;
            
        } catch (error) {
            return false;
        }
    }
    
    async createDefaultDepartments() {
        console.log('📁 Creating default departments...');
        
        const departments = [
            {
                id: 'dept_md',
                code: 'MD',
                name: 'Truyền thông',
                description: 'Quản lý hình ảnh và truyền thông CLB',
                color: '#3B82F6',
                icon: 'fa-bullhorn',
                totalMembers: 0,
                activeProjects: 0,
                completedProjects: 0,
                maxMembers: 30,
                requirements: {},
                isActive: true,
                order: 1,
                createdAt: serverTimestamp(),
                createdBy: 'system'
            },
            {
                id: 'dept_hr',
                code: 'HR',
                name: 'Nhân sự',
                description: 'Quản lý thành viên và phát triển nhân lực',
                color: '#10B981',
                icon: 'fa-users',
                totalMembers: 0,
                activeProjects: 0,
                completedProjects: 0,
                maxMembers: 25,
                requirements: {},
                isActive: true,
                order: 2,
                createdAt: serverTimestamp(),
                createdBy: 'system'
            },
            {
                id: 'dept_pd',
                code: 'PD',
                name: 'Dự án',
                description: 'Phát triển và quản lý các dự án xã hội',
                color: '#F59E0B',
                icon: 'fa-project-diagram',
                totalMembers: 0,
                activeProjects: 0,
                completedProjects: 0,
                maxMembers: 35,
                requirements: {},
                isActive: true,
                order: 3,
                createdAt: serverTimestamp(),
                createdBy: 'system'
            },
            {
                id: 'dept_er',
                code: 'ER',
                name: 'Đối ngoại',
                description: 'Xây dựng quan hệ đối tác và tài trợ',
                color: '#8B5CF6',
                icon: 'fa-handshake',
                totalMembers: 0,
                activeProjects: 0,
                completedProjects: 0,
                maxMembers: 20,
                requirements: {},
                isActive: true,
                order: 4,
                createdAt: serverTimestamp(),
                createdBy: 'system'
            },
            {
                id: 'dept_dev',
                code: 'DEV',
                name: 'Công nghệ',
                description: 'Phát triển và bảo trì hệ thống công nghệ CLB',
                color: '#EC4899',
                icon: 'fa-code',
                totalMembers: 0,
                activeProjects: 0,
                completedProjects: 0,
                maxMembers: 15,
                requirements: {
                    minPoints: 100,
                    requiredSkills: ['programming', 'problem_solving']
                },
                isActive: true,
                order: 5,
                createdAt: serverTimestamp(),
                createdBy: 'system'
            }
        ];
        
        for (const dept of departments) {
            try {
                const deptRef = doc(db, DB_COLLECTIONS.DEPARTMENTS, dept.id);
                await setDoc(deptRef, dept);
                console.log(`✅ Created department: ${dept.code} - ${dept.name}`);
            } catch (error) {
                console.error(`❌ Error creating department ${dept.code}:`, error);
            }
        }
    }
    
    async createDefaultSkills() {
        console.log('🛠️ Creating default skills...');
        
        const skills = [
            {
                id: 'skill_react',
                code: 'SK001',
                name: 'ReactJS',
                category: 'technical',
                description: 'JavaScript library for building user interfaces',
                levels: {
                    beginner: 'Can build simple components',
                    intermediate: 'Can build complex applications',
                    advanced: 'Expert level with performance optimization'
                },
                learningPaths: [],
                totalMembers: 0,
                averageScore: 0,
                isActive: true,
                popularity: 85,
                createdAt: serverTimestamp(),
                createdBy: 'system'
            },
            {
                id: 'skill_design',
                code: 'SK002',
                name: 'UI/UX Design',
                category: 'creative',
                description: 'User interface and experience design',
                levels: {
                    beginner: 'Basic understanding of design principles',
                    intermediate: 'Can create wireframes and mockups',
                    advanced: 'Expert in design systems and user research'
                },
                learningPaths: [],
                totalMembers: 0,
                averageScore: 0,
                isActive: true,
                popularity: 75,
                createdAt: serverTimestamp(),
                createdBy: 'system'
            },
            {
                id: 'skill_leadership',
                code: 'SK003',
                name: 'Leadership',
                category: 'soft',
                description: 'Team management and leadership skills',
                levels: {
                    beginner: 'Can lead small tasks',
                    intermediate: 'Can manage project teams',
                    advanced: 'Strategic leadership and decision making'
                },
                learningPaths: [],
                totalMembers: 0,
                averageScore: 0,
                isActive: true,
                popularity: 90,
                createdAt: serverTimestamp(),
                createdBy: 'system'
            },
            {
                id: 'skill_communication',
                code: 'SK004',
                name: 'Communication',
                category: 'soft',
                description: 'Effective communication and presentation skills',
                levels: {
                    beginner: 'Basic communication in team settings',
                    intermediate: 'Can present to small groups',
                    advanced: 'Public speaking and stakeholder communication'
                },
                learningPaths: [],
                totalMembers: 0,
                averageScore: 0,
                isActive: true,
                popularity: 95,
                createdAt: serverTimestamp(),
                createdBy: 'system'
            },
            {
                id: 'skill_project_management',
                code: 'SK005',
                name: 'Project Management',
                category: 'management',
                description: 'Planning, executing, and closing projects',
                levels: {
                    beginner: 'Can manage small tasks',
                    intermediate: 'Can manage small projects',
                    advanced: 'Expert in agile methodologies and resource management'
                },
                learningPaths: [],
                totalMembers: 0,
                averageScore: 0,
                isActive: true,
                popularity: 80,
                createdAt: serverTimestamp(),
                createdBy: 'system'
            }
        ];
        
        for (const skill of skills) {
            try {
                const skillRef = doc(db, DB_COLLECTIONS.SKILLS, skill.id);
                await setDoc(skillRef, skill);
                console.log(`✅ Created skill: ${skill.code} - ${skill.name}`);
            } catch (error) {
                console.error(`❌ Error creating skill ${skill.code}:`, error);
            }
        }
    }
    
    async createSystemSettings() {
        console.log('⚙️ Creating system settings...');
        
        const settings = {
            id: 'system_settings',
            clubInfo: {
                name: 'Enactus FTU Hanoi',
                description: 'Câu lạc bộ khởi nghiệp xã hội',
                contactEmail: 'contact@enactusftu.com',
                website: 'https://enactusftu.com',
                socialLinks: {
                    facebook: 'https://facebook.com/enactusftu',
                    instagram: 'https://instagram.com/enactusftu',
                    linkedin: 'https://linkedin.com/company/enactusftu'
                }
            },
            academicYear: {
                current: '2023-2024',
                startDate: '2023-09-01',
                endDate: '2024-08-31'
            },
            pointsConfig: {
                eventAttendance: 10,
                projectCompletion: 50,
                skillVerification: 25,
                memberReferral: 30,
                leadershipRole: 100,
                trainingCompletion: 20,
                codeContribution: 15
            },
            memberSettings: {
                minAttendanceRate: 0.6,
                probationPeriod: 30,
                maxInactiveDays: 90,
                autoPromotePoints: 500
            },
            notificationSettings: {
                emailReminders: true,
                pushNotifications: true,
                reminderDays: [1, 3, 7],
                quietHours: {
                    start: '22:00',
                    end: '07:00'
                }
            },
            themeSettings: {
                primaryColor: '#FFD54F',
                secondaryColor: '#3B82F6',
                accentColor: '#10B981',
                darkMode: false,
                fontFamily: "'Plus Jakarta Sans', sans-serif"
            },
            securitySettings: {
                requireEmailVerification: true,
                allowSelfRegistration: true,
                maxLoginAttempts: 5,
                sessionTimeout: 24 // hours
            },
            backupSettings: {
                autoBackup: true,
                backupFrequency: 'daily',
                retainDays: 30
            },
            lastUpdated: serverTimestamp(),
            version: '1.0.0',
            initializedAt: serverTimestamp()
        };
        
        try {
            const settingsRef = doc(db, DB_COLLECTIONS.SETTINGS, settings.id);
            await setDoc(settingsRef, settings);
            console.log('✅ Created system settings');
        } catch (error) {
            console.error('❌ Error creating system settings:', error);
            throw error;
        }
    }
    
    async createAdminAccount() {
        console.log('👑 Creating admin account...');
        
        const adminMember = {
            id: 'admin_001',
            code: 'MEM2024000',
            fullName: 'System Administrator',
            email: 'admin@enactusftu.com',
            phone: '',
            studentId: 'ADMIN001',
            avatar: '',
            bio: 'System administrator account',
            
            // CLB info
            joinDate: new Date().toISOString(),
            status: 'active',
            department: 'HR',
            role: 'admin',
            level: 'lead',
            
            // Skills & Interests
            skills: [],
            interests: ['system_administration', 'development'],
            
            // Social links
            socialLinks: {},
            emergencyContact: null,
            
            // Stats
            totalPoints: 1000,
            totalContributions: 0,
            attendanceRate: 1.0,
            completedProjects: 0,
            completedTrainings: 0,
            
            // Metadata
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: 'system',
            isDeleted: false
        };
        
        try {
            const adminRef = doc(db, DB_COLLECTIONS.MEMBERS, adminMember.id);
            await setDoc(adminRef, adminMember);
            console.log('✅ Created admin account');
        } catch (error) {
            console.error('❌ Error creating admin account:', error);
            // Don't throw, admin account is optional
        }
    }
    
    async createSampleData() {
        console.log('📦 Creating sample data...');
        
        // Check if user wants sample data
        const createSample = confirm('Do you want to create sample data?');
        if (!createSample) {
            console.log('⏭️ Skipping sample data creation');
            return;
        }
        
        // Create sample projects
        await this.createSampleProjects();
        
        // Create sample events
        await this.createSampleEvents();
        
        // Create sample members
        await this.createSampleMembers();
        
        console.log('✅ Sample data created');
    }
    
    async createSampleProjects() {
        const projects = [
            {
                id: 'proj_001',
                code: 'PRJ2024001',
                name: 'Website Redesign',
                description: 'Redesign CLB website with modern UI and better UX',
                type: 'internal',
                priority: 'high',
                status: 'in_progress',
                visibility: 'public',
                department: 'DEV',
                progress: 0.35,
                budget: { allocated: 2000, used: 750, currency: 'VND' },
                startDate: '2024-03-01',
                deadline: '2024-04-30',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isArchived: false
            },
            {
                id: 'proj_002',
                code: 'PRJ2024002',
                name: 'Mobile App Development',
                description: 'Build mobile app for event management and member communication',
                type: 'internal',
                priority: 'medium',
                status: 'planning',
                visibility: 'public',
                department: 'DEV',
                progress: 0.10,
                budget: { allocated: 5000, used: 0, currency: 'VND' },
                startDate: '2024-04-01',
                deadline: '2024-08-31',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isArchived: false
            }
        ];
        
        for (const project of projects) {
            try {
                const projectRef = doc(db, DB_COLLECTIONS.PROJECTS, project.id);
                await setDoc(projectRef, project);
                console.log(`✅ Created sample project: ${project.name}`);
            } catch (error) {
                console.error(`❌ Error creating sample project ${project.name}:`, error);
            }
        }
    }
    
    async createSampleEvents() {
        const events = [
            {
                id: 'evt_001',
                code: 'EVT202403001',
                title: 'ReactJS Workshop',
                description: 'Learn React fundamentals and build your first app',
                type: 'workshop',
                category: 'technical',
                format: 'offline',
                startDateTime: '2024-03-25T18:00:00Z',
                endDateTime: '2024-03-25T21:00:00Z',
                venue: 'Room A101, FTU Hanoi',
                organizer: 'admin_001',
                department: 'DEV',
                maxParticipants: 50,
                registeredCount: 42,
                attendedCount: 38,
                status: 'completed',
                isPublic: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }
        ];
        
        for (const event of events) {
            try {
                const eventRef = doc(db, DB_COLLECTIONS.EVENTS, event.id);
                await setDoc(eventRef, event);
                console.log(`✅ Created sample event: ${event.title}`);
            } catch (error) {
                console.error(`❌ Error creating sample event ${event.title}:`, error);
            }
        }
    }
    
    async createSampleMembers() {
        const members = [
            {
                id: 'mem_001',
                code: 'MEM2024001',
                fullName: 'Nguyễn Văn A',
                email: 'nguyenvana@example.com',
                phone: '0912345678',
                studentId: 'FTU202412345',
                joinDate: '2024-01-15T00:00:00Z',
                status: 'active',
                department: 'DEV',
                role: 'member',
                level: 'regular',
                skills: [{ skillId: 'skill_react', name: 'ReactJS', level: 'intermediate' }],
                totalPoints: 350,
                totalContributions: 12,
                attendanceRate: 0.85,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isDeleted: false
            },
            {
                id: 'mem_002',
                code: 'MEM2024002',
                fullName: 'Trần Thị B',
                email: 'tranthib@example.com',
                phone: '0987654321',
                studentId: 'FTU202412346',
                joinDate: '2024-02-01T00:00:00Z',
                status: 'active',
                department: 'MD',
                role: 'member',
                level: 'regular',
                skills: [{ skillId: 'skill_design', name: 'UI/UX Design', level: 'advanced' }],
                totalPoints: 280,
                totalContributions: 8,
                attendanceRate: 0.90,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isDeleted: false
            }
        ];
        
        for (const member of members) {
            try {
                const memberRef = doc(db, DB_COLLECTIONS.MEMBERS, member.id);
                await setDoc(memberRef, member);
                console.log(`✅ Created sample member: ${member.fullName}`);
                
                // Update department count
                if (member.department) {
                    await this.updateDepartmentCount(member.department, 1);
                }
            } catch (error) {
                console.error(`❌ Error creating sample member ${member.fullName}:`, error);
            }
        }
    }
    
    async updateDepartmentCount(departmentCode, change) {
        try {
            const deptQuery = query(
                collection(db, DB_COLLECTIONS.DEPARTMENTS),
                where('code', '==', departmentCode)
            );
            
            const querySnapshot = await getDocs(deptQuery);
            
            if (!querySnapshot.empty) {
                const deptDoc = querySnapshot.docs[0];
                const deptRef = doc(db, DB_COLLECTIONS.DEPARTMENTS, deptDoc.id);
                
                await updateDoc(deptRef, {
                    totalMembers: (deptDoc.data().totalMembers || 0) + change,
                    updatedAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error(`❌ Error updating department count for ${departmentCode}:`, error);
        }
    }
    
    /**
     * Reset database (DANGEROUS - for development only)
     */
    async resetDatabase() {
        if (!confirm('⚠️ DANGER: This will delete all data. Are you sure?')) {
            return;
        }
        
        console.log('🧨 Resetting database...');
        
        // Note: In production, you should backup first
        // This is a simple reset for development
        
        try {
            // Clear all collections (you'd need to implement this properly)
            console.log('⚠️ Reset functionality needs proper implementation');
            console.log('ℹ️ For now, manually delete collections in Firebase Console');
            
        } catch (error) {
            console.error('❌ Error resetting database:', error);
        }
    }
}

// Create and export singleton instance
const databaseInitializer = new DatabaseInitializer();

// Auto-initialize on import (optional)
// databaseInitializer.initialize().catch(console.error);

// Export
export default databaseInitializer;