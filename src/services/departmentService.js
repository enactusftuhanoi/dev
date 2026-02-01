import { db } from '../firebase/config.js';
import { DB_COLLECTIONS } from '../firebase/collections.js';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    increment
} from 'firebase/firestore';

class DepartmentService {
    
    constructor() {
        this.collection = DB_COLLECTIONS.DEPARTMENTS;
    }
    
    // =============== CRUD OPERATIONS ===============
    
    async createDepartment(departmentData) {
        try {
            const deptRef = doc(collection(db, this.collection));
            
            const newDepartment = {
                id: deptRef.id,
                code: departmentData.code.toUpperCase(),
                name: departmentData.name,
                description: departmentData.description || '',
                color: departmentData.color || '#3B82F6',
                icon: departmentData.icon || 'fa-building',
                
                // Leadership
                head: departmentData.head || null,
                viceHead: departmentData.viceHead || null,
                advisors: departmentData.advisors || [],
                
                // Stats
                totalMembers: 0,
                activeProjects: 0,
                completedProjects: 0,
                
                // Settings
                maxMembers: departmentData.maxMembers || 30,
                requirements: departmentData.requirements || {},
                
                // Metadata
                createdAt: serverTimestamp(),
                createdBy: departmentData.createdBy || 'system',
                isActive: true,
                order: departmentData.order || 0
            };
            
            await setDoc(deptRef, newDepartment);
            console.log(`✅ Department created: ${newDepartment.code} - ${newDepartment.name}`);
            
            return { id: deptRef.id, ...newDepartment };
            
        } catch (error) {
            console.error('❌ Error creating department:', error);
            throw error;
        }
    }
    
    async getDepartment(departmentId) {
        try {
            const deptRef = doc(db, this.collection, departmentId);
            const deptSnap = await getDoc(deptRef);
            
            if (deptSnap.exists()) {
                return deptSnap.data();
            } else {
                throw new Error('Department not found');
            }
        } catch (error) {
            console.error(`❌ Error getting department ${departmentId}:`, error);
            throw error;
        }
    }
    
    async getDepartmentByCode(departmentCode) {
        try {
            const q = query(
                collection(db, this.collection),
                where('code', '==', departmentCode.toUpperCase()),
                where('isActive', '==', true),
                limit(1)
            );
            
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return { id: doc.id, ...doc.data() };
            } else {
                throw new Error(`Department ${departmentCode} not found`);
            }
        } catch (error) {
            console.error(`❌ Error getting department by code ${departmentCode}:`, error);
            throw error;
        }
    }
    
    async updateDepartment(departmentId, updates) {
        try {
            const deptRef = doc(db, this.collection, departmentId);
            
            const updateData = {
                ...updates,
                updatedAt: serverTimestamp()
            };
            
            await updateDoc(deptRef, updateData);
            console.log(`✅ Department updated: ${departmentId}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Error updating department ${departmentId}:`, error);
            throw error;
        }
    }
    
    async deleteDepartment(departmentId) {
        try {
            const deptRef = doc(db, this.collection, departmentId);
            
            // Soft delete
            await updateDoc(deptRef, {
                isActive: false,
                deletedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            
            console.log(`✅ Department soft deleted: ${departmentId}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Error deleting department ${departmentId}:`, error);
            throw error;
        }
    }
    
    // =============== QUERY OPERATIONS ===============
    
    async getAllDepartments() {
        try {
            const q = query(
                collection(db, this.collection),
                where('isActive', '==', true),
                orderBy('order'),
                orderBy('code')
            );
            
            const querySnapshot = await getDocs(q);
            const departments = [];
            
            querySnapshot.forEach((doc) => {
                departments.push({ id: doc.id, ...doc.data() });
            });
            
            return departments;
            
        } catch (error) {
            console.error('❌ Error getting all departments:', error);
            throw error;
        }
    }
    
    async getActiveDepartments() {
        try {
            const q = query(
                collection(db, this.collection),
                where('isActive', '==', true),
                orderBy('name')
            );
            
            const querySnapshot = await getDocs(q);
            const departments = [];
            
            querySnapshot.forEach((doc) => {
                departments.push({ id: doc.id, ...doc.data() });
            });
            
            return departments;
            
        } catch (error) {
            console.error('❌ Error getting active departments:', error);
            throw error;
        }
    }
    
    // =============== STATS & ANALYTICS ===============
    
    async getDepartmentStats(departmentCode) {
        try {
            const department = await this.getDepartmentByCode(departmentCode);
            
            if (!department) {
                throw new Error(`Department ${departmentCode} not found`);
            }
            
            // Get member stats
            const memberStats = await this.getDepartmentMemberStats(departmentCode);
            
            // Get project stats
            const projectStats = await this.getDepartmentProjectStats(departmentCode);
            
            return {
                department,
                ...memberStats,
                ...projectStats
            };
            
        } catch (error) {
            console.error(`❌ Error getting department stats for ${departmentCode}:`, error);
            throw error;
        }
    }
    
    async getDepartmentMemberStats(departmentCode) {
        try {
            const q = query(
                collection(db, DB_COLLECTIONS.MEMBERS),
                where('department', '==', departmentCode),
                where('isDeleted', '==', false)
            );
            
            const querySnapshot = await getDocs(q);
            
            const stats = {
                totalMembers: querySnapshot.size,
                byStatus: {},
                byRole: {},
                averagePoints: 0,
                totalPoints: 0
            };
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                
                // Count by status
                stats.byStatus[data.status] = (stats.byStatus[data.status] || 0) + 1;
                
                // Count by role
                stats.byRole[data.role] = (stats.byRole[data.role] || 0) + 1;
                
                // Sum points
                stats.totalPoints += data.totalPoints || 0;
            });
            
            // Calculate average points
            stats.averagePoints = stats.totalMembers > 0 ? stats.totalPoints / stats.totalMembers : 0;
            
            return stats;
            
        } catch (error) {
            console.error(`❌ Error getting department member stats for ${departmentCode}:`, error);
            return {
                totalMembers: 0,
                byStatus: {},
                byRole: {},
                averagePoints: 0,
                totalPoints: 0
            };
        }
    }
    
    async getDepartmentProjectStats(departmentCode) {
        try {
            const q = query(
                collection(db, DB_COLLECTIONS.PROJECTS),
                where('department', '==', departmentCode),
                where('isArchived', '==', false)
            );
            
            const querySnapshot = await getDocs(q);
            
            const stats = {
                totalProjects: querySnapshot.size,
                byStatus: {},
                totalBudget: 0,
                usedBudget: 0
            };
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                
                // Count by status
                stats.byStatus[data.status] = (stats.byStatus[data.status] || 0) + 1;
                
                // Sum budget
                if (data.budget) {
                    stats.totalBudget += data.budget.allocated || 0;
                    stats.usedBudget += data.budget.used || 0;
                }
            });
            
            return stats;
            
        } catch (error) {
            console.error(`❌ Error getting department project stats for ${departmentCode}:`, error);
            return {
                totalProjects: 0,
                byStatus: {},
                totalBudget: 0,
                usedBudget: 0
            };
        }
    }
    
    async getAllDepartmentsStats() {
        try {
            const departments = await this.getAllDepartments();
            const stats = [];
            
            for (const dept of departments) {
                const deptStats = await this.getDepartmentStats(dept.code);
                stats.push(deptStats);
            }
            
            return stats;
            
        } catch (error) {
            console.error('❌ Error getting all departments stats:', error);
            throw error;
        }
    }
    
    // =============== MEMBER MANAGEMENT ===============
    
    async getDepartmentMembers(departmentCode, options = {}) {
        try {
            const {
                status = null,
                role = null,
                page = 1,
                limit: pageLimit = 20
            } = options;
            
            let q = query(
                collection(db, DB_COLLECTIONS.MEMBERS),
                where('department', '==', departmentCode),
                where('isDeleted', '==', false)
            );
            
            if (status) {
                q = query(q, where('status', '==', status));
            }
            
            if (role) {
                q = query(q, where('role', '==', role));
            }
            
            q = query(q, orderBy('joinDate', 'desc'));
            
            const querySnapshot = await getDocs(q);
            const members = [];
            
            querySnapshot.forEach((doc) => {
                members.push({ id: doc.id, ...doc.data() });
            });
            
            // Manual pagination
            const start = (page - 1) * pageLimit;
            const end = start + pageLimit;
            const paginatedMembers = members.slice(start, end);
            
            return {
                members: paginatedMembers,
                total: members.length,
                page,
                totalPages: Math.ceil(members.length / pageLimit),
                hasMore: end < members.length
            };
            
        } catch (error) {
            console.error(`❌ Error getting department members for ${departmentCode}:`, error);
            throw error;
        }
    }
    
    async updateDepartmentLeadership(departmentId, leadershipData) {
        try {
            const deptRef = doc(db, this.collection, departmentId);
            
            await updateDoc(deptRef, {
                head: leadershipData.head || null,
                viceHead: leadershipData.viceHead || null,
                advisors: leadershipData.advisors || [],
                updatedAt: serverTimestamp()
            });
            
            console.log(`✅ Department leadership updated: ${departmentId}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Error updating department leadership for ${departmentId}:`, error);
            throw error;
        }
    }
    
    // =============== HELPER METHODS ===============
    
    validateDepartmentData(data) {
        const errors = [];
        
        if (!data.code?.trim()) {
            errors.push('Department code is required');
        }
        
        if (!data.name?.trim()) {
            errors.push('Department name is required');
        }
        
        // Check if code already exists
        // Note: Would need async check
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Create singleton instance
const departmentService = new DepartmentService();

// Export
export default departmentService;