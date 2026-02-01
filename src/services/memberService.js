import { db } from '../firebase/config.js';
import { DB_COLLECTIONS, MEMBER_STATUS } from '../firebase/collections.js';
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
    limit,
    startAfter,
    writeBatch,
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';

class MemberService {
    
    constructor() {
        this.collection = DB_COLLECTIONS.MEMBERS;
    }
    
    // =============== CRUD OPERATIONS ===============
    
    /**
     * CREATE: Thêm thành viên mới
     * @param {Object} memberData - Dữ liệu thành viên
     * @returns {Promise<Object>} Member created
     */
    async createMember(memberData) {
        try {
            const memberRef = doc(collection(db, this.collection));
            const memberCode = this.generateMemberCode();
            
            const newMember = {
                id: memberRef.id,
                code: memberCode,
                // Basic info
                fullName: memberData.fullName || '',
                email: memberData.email || '',
                phone: memberData.phone || '',
                studentId: memberData.studentId || '',
                avatar: memberData.avatar || '',
                bio: memberData.bio || '',
                
                // CLB info
                joinDate: memberData.joinDate || new Date().toISOString(),
                status: MEMBER_STATUS.PENDING,
                department: memberData.department || '',
                role: memberData.role || 'member',
                level: memberData.level || 'regular',
                
                // Skills & Interests
                skills: memberData.skills || [],
                interests: memberData.interests || [],
                
                // Social links
                socialLinks: memberData.socialLinks || {},
                emergencyContact: memberData.emergencyContact || null,
                
                // Stats (initialize)
                totalPoints: 0,
                totalContributions: 0,
                attendanceRate: 0,
                completedProjects: 0,
                completedTrainings: 0,
                
                // Metadata
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: memberData.createdBy || 'system',
                isDeleted: false
            };
            
            await setDoc(memberRef, newMember);
            
            // Update department member count
            if (newMember.department) {
                await this.updateDepartmentCount(newMember.department, 1);
            }
            
            console.log(`✅ Member created: ${memberCode} - ${newMember.fullName}`);
            return { id: memberRef.id, ...newMember };
            
        } catch (error) {
            console.error('❌ Error creating member:', error);
            throw new Error(`Failed to create member: ${error.message}`);
        }
    }
    
    /**
     * READ: Lấy thông tin thành viên theo ID
     * @param {string} memberId - ID thành viên
     * @returns {Promise<Object>} Member data
     */
    async getMember(memberId) {
        try {
            const memberRef = doc(db, this.collection, memberId);
            const memberSnap = await getDoc(memberRef);
            
            if (memberSnap.exists()) {
                const data = memberSnap.data();
                if (data.isDeleted) {
                    throw new Error('Member has been deleted');
                }
                return data;
            } else {
                throw new Error('Member not found');
            }
        } catch (error) {
            console.error(`❌ Error getting member ${memberId}:`, error);
            throw error;
        }
    }
    
    /**
     * READ: Lấy thành viên theo mã
     * @param {string} memberCode - Mã thành viên (VD: MEM2024001)
     * @returns {Promise<Object>} Member data
     */
    async getMemberByCode(memberCode) {
        try {
            const q = query(
                collection(db, this.collection),
                where('code', '==', memberCode),
                where('isDeleted', '==', false),
                limit(1)
            );
            
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return { id: doc.id, ...doc.data() };
            } else {
                throw new Error(`Member with code ${memberCode} not found`);
            }
        } catch (error) {
            console.error(`❌ Error getting member by code ${memberCode}:`, error);
            throw error;
        }
    }
    
    /**
     * UPDATE: Cập nhật thông tin thành viên
     * @param {string} memberId - ID thành viên
     * @param {Object} updates - Các trường cần cập nhật
     * @returns {Promise<boolean>} Success status
     */
    async updateMember(memberId, updates) {
        try {
            const memberRef = doc(db, this.collection, memberId);
            
            // Validate member exists
            const memberSnap = await getDoc(memberRef);
            if (!memberSnap.exists() || memberSnap.data().isDeleted) {
                throw new Error('Member not found or deleted');
            }
            
            // If changing department, update counts
            if (updates.department) {
                const oldData = memberSnap.data();
                if (oldData.department && oldData.department !== updates.department) {
                    // Decrement old department
                    await this.updateDepartmentCount(oldData.department, -1);
                    // Increment new department
                    await this.updateDepartmentCount(updates.department, 1);
                }
            }
            
            const updateData = {
                ...updates,
                updatedAt: serverTimestamp()
            };
            
            await updateDoc(memberRef, updateData);
            console.log(`✅ Member updated: ${memberId}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Error updating member ${memberId}:`, error);
            throw error;
        }
    }
    
    /**
     * DELETE: Xóa mềm thành viên
     * @param {string} memberId - ID thành viên
     * @returns {Promise<boolean>} Success status
     */
    async deleteMember(memberId) {
        try {
            const memberRef = doc(db, this.collection, memberId);
            const memberSnap = await getDoc(memberRef);
            
            if (!memberSnap.exists()) {
                throw new Error('Member not found');
            }
            
            const memberData = memberSnap.data();
            
            // Update department count
            if (memberData.department) {
                await this.updateDepartmentCount(memberData.department, -1);
            }
            
            // Soft delete
            await updateDoc(memberRef, {
                status: MEMBER_STATUS.INACTIVE,
                isDeleted: true,
                deletedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            
            console.log(`✅ Member soft deleted: ${memberId}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Error deleting member ${memberId}:`, error);
            throw error;
        }
    }
    
    // =============== QUERY OPERATIONS ===============
    
    /**
     * Lấy tất cả thành viên (có phân trang)
     * @param {Object} options - Options for pagination and filtering
     * @returns {Promise<Array>} List of members
     */
    async getAllMembers(options = {}) {
        try {
            const {
                page = 1,
                limit: pageLimit = 20,
                department = null,
                status = null,
                role = null,
                search = ''
            } = options;
            
            let q = collection(db, this.collection);
            
            // Apply filters
            q = query(q, where('isDeleted', '==', false));
            
            if (department) {
                q = query(q, where('department', '==', department));
            }
            
            if (status) {
                q = query(q, where('status', '==', status));
            }
            
            if (role) {
                q = query(q, where('role', '==', role));
            }
            
            // Order by join date (newest first)
            q = query(q, orderBy('joinDate', 'desc'));
            
            // Apply pagination
            const startIndex = (page - 1) * pageLimit;
            // Note: Firestore requires using startAfter for pagination
            
            const querySnapshot = await getDocs(q);
            const members = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Simple search filter
                if (search) {
                    const searchLower = search.toLowerCase();
                    const matches = 
                        data.fullName?.toLowerCase().includes(searchLower) ||
                        data.email?.toLowerCase().includes(searchLower) ||
                        data.code?.toLowerCase().includes(searchLower);
                    
                    if (matches) {
                        members.push({ id: doc.id, ...data });
                    }
                } else {
                    members.push({ id: doc.id, ...data });
                }
            });
            
            // Manual pagination (for now)
            const start = startIndex;
            const end = startIndex + pageLimit;
            const paginatedMembers = members.slice(start, end);
            
            return {
                members: paginatedMembers,
                total: members.length,
                page,
                totalPages: Math.ceil(members.length / pageLimit),
                hasMore: end < members.length
            };
            
        } catch (error) {
            console.error('❌ Error getting all members:', error);
            throw error;
        }
    }
    
    /**
     * Tìm kiếm thành viên theo nhiều tiêu chí
     * @param {Object} filters - Bộ lọc tìm kiếm
     * @returns {Promise<Array>} Filtered members
     */
    async searchMembers(filters = {}) {
        try {
            let q = collection(db, this.collection);
            q = query(q, where('isDeleted', '==', false));
            
            // Apply each filter
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    q = query(q, where(key, '==', value));
                }
            });
            
            const querySnapshot = await getDocs(q);
            const members = [];
            
            querySnapshot.forEach((doc) => {
                members.push({ id: doc.id, ...doc.data() });
            });
            
            return members;
            
        } catch (error) {
            console.error('❌ Error searching members:', error);
            throw error;
        }
    }
    
    /**
     * Lấy thành viên theo kỹ năng
     * @param {string} skill - Tên kỹ năng
     * @returns {Promise<Array>} Members with skill
     */
    async getMembersBySkill(skill) {
        try {
            const q = query(
                collection(db, this.collection),
                where('isDeleted', '==', false),
                where('skills', 'array-contains', skill)
            );
            
            const querySnapshot = await getDocs(q);
            const members = [];
            
            querySnapshot.forEach((doc) => {
                members.push({ id: doc.id, ...doc.data() });
            });
            
            return members;
            
        } catch (error) {
            console.error(`❌ Error getting members by skill ${skill}:`, error);
            throw error;
        }
    }
    
    // =============== STATS & ANALYTICS ===============
    
    /**
     * Lấy thống kê thành viên
     * @returns {Promise<Object>} Member statistics
     */
    async getMemberStats() {
        try {
            const q = query(
                collection(db, this.collection),
                where('isDeleted', '==', false)
            );
            
            const querySnapshot = await getDocs(q);
            
            const stats = {
                total: 0,
                byStatus: {},
                byDepartment: {},
                byRole: {},
                newThisMonth: 0,
                averagePoints: 0,
                totalPoints: 0
            };
            
            const now = new Date();
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                stats.total++;
                
                // Count by status
                stats.byStatus[data.status] = (stats.byStatus[data.status] || 0) + 1;
                
                // Count by department
                if (data.department) {
                    stats.byDepartment[data.department] = (stats.byDepartment[data.department] || 0) + 1;
                }
                
                // Count by role
                stats.byRole[data.role] = (stats.byRole[data.role] || 0) + 1;
                
                // Count new this month
                if (data.joinDate) {
                    const joinDate = new Date(data.joinDate);
                    if (joinDate.getMonth() === thisMonth && joinDate.getFullYear() === thisYear) {
                        stats.newThisMonth++;
                    }
                }
                
                // Sum points
                stats.totalPoints += data.totalPoints || 0;
            });
            
            // Calculate average points
            stats.averagePoints = stats.total > 0 ? stats.totalPoints / stats.total : 0;
            
            return stats;
            
        } catch (error) {
            console.error('❌ Error getting member stats:', error);
            throw error;
        }
    }
    
    /**
     * Lấy leaderboard thành viên (top contributors)
     * @param {number} limit - Số lượng thành viên
     * @returns {Promise<Array>} Top members
     */
    async getLeaderboard(limit = 10) {
        try {
            const q = query(
                collection(db, this.collection),
                where('isDeleted', '==', false),
                where('status', '==', MEMBER_STATUS.ACTIVE),
                orderBy('totalPoints', 'desc'),
                limit(limit)
            );
            
            const querySnapshot = await getDocs(q);
            const leaderboard = [];
            
            querySnapshot.forEach((doc, index) => {
                const data = doc.data();
                leaderboard.push({
                    rank: index + 1,
                    id: doc.id,
                    ...data
                });
            });
            
            return leaderboard;
            
        } catch (error) {
            console.error('❌ Error getting leaderboard:', error);
            throw error;
        }
    }
    
    // =============== POINTS & ACHIEVEMENTS ===============
    
    /**
     * Thêm điểm cho thành viên
     * @param {string} memberId - ID thành viên
     * @param {number} points - Số điểm
     * @param {string} reason - Lý do
     * @param {string} sourceId - ID nguồn (project, event, etc.)
     * @returns {Promise<boolean>} Success status
     */
    async addPoints(memberId, points, reason, sourceId = null) {
        try {
            const memberRef = doc(db, this.collection, memberId);
            
            // Update member's total points
            await updateDoc(memberRef, {
                totalPoints: increment(points),
                updatedAt: serverTimestamp()
            });
            
            // Log points transaction
            const pointsRef = collection(db, DB_COLLECTIONS.POINTS);
            await setDoc(doc(pointsRef), {
                memberId,
                points,
                reason,
                sourceId,
                awardedAt: serverTimestamp(),
                awardedBy: 'system'
            });
            
            console.log(`✅ Added ${points} points to member ${memberId}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Error adding points to member ${memberId}:`, error);
            throw error;
        }
    }
    
    /**
     * Thêm kỹ năng cho thành viên
     * @param {string} memberId - ID thành viên
     * @param {Object} skill - Kỹ năng
     * @returns {Promise<boolean>} Success status
     */
    async addSkill(memberId, skill) {
        try {
            const memberRef = doc(db, this.collection, memberId);
            
            await updateDoc(memberRef, {
                skills: arrayUnion(skill),
                updatedAt: serverTimestamp()
            });
            
            console.log(`✅ Added skill ${skill.name} to member ${memberId}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Error adding skill to member ${memberId}:`, error);
            throw error;
        }
    }
    
    // =============== BATCH OPERATIONS ===============
    
    /**
     * Cập nhật trạng thái nhiều thành viên
     * @param {Array} memberIds - Danh sách ID thành viên
     * @param {string} newStatus - Trạng thái mới
     * @returns {Promise<boolean>} Success status
     */
    async bulkUpdateStatus(memberIds, newStatus) {
        try {
            const batch = writeBatch(db);
            
            memberIds.forEach(memberId => {
                const memberRef = doc(db, this.collection, memberId);
                batch.update(memberRef, {
                    status: newStatus,
                    updatedAt: serverTimestamp()
                });
            });
            
            await batch.commit();
            console.log(`✅ Bulk updated ${memberIds.length} members to status ${newStatus}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error bulk updating member status:', error);
            throw error;
        }
    }
    
    /**
     * Xuất danh sách thành viên
     * @param {Array} memberIds - Danh sách ID (optional, all if empty)
     * @returns {Promise<Array>} Member data for export
     */
    async exportMembers(memberIds = []) {
        try {
            let querySnapshot;
            
            if (memberIds.length > 0) {
                // Get specific members
                const promises = memberIds.map(id => getDoc(doc(db, this.collection, id)));
                const snaps = await Promise.all(promises);
                querySnapshot = { docs: snaps.filter(snap => snap.exists()) };
            } else {
                // Get all members
                const q = query(
                    collection(db, this.collection),
                    where('isDeleted', '==', false)
                );
                querySnapshot = await getDocs(q);
            }
            
            const exportData = [];
            
            querySnapshot.docs.forEach(doc => {
                const data = doc.data();
                exportData.push({
                    Code: data.code,
                    'Full Name': data.fullName,
                    Email: data.email,
                    Phone: data.phone,
                    Department: data.department,
                    Role: data.role,
                    Status: data.status,
                    'Join Date': data.joinDate,
                    'Total Points': data.totalPoints,
                    Skills: data.skills?.map(s => s.name).join(', ') || '',
                    'Social Links': JSON.stringify(data.socialLinks || {})
                });
            });
            
            return exportData;
            
        } catch (error) {
            console.error('❌ Error exporting members:', error);
            throw error;
        }
    }
    
    // =============== HELPER METHODS ===============
    
    /**
     * Generate unique member code
     * @returns {string} Member code
     */
    generateMemberCode() {
        const year = new Date().getFullYear();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `MEM${year}${randomNum}`;
    }
    
    /**
     * Update department member count
     * @param {string} departmentCode - Department code
     * @param {number} change - Change in count (positive or negative)
     */
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
                    totalMembers: increment(change),
                    updatedAt: serverTimestamp()
                });
                
                console.log(`✅ Updated department ${departmentCode} member count by ${change}`);
            }
        } catch (error) {
            console.error(`❌ Error updating department count for ${departmentCode}:`, error);
            // Don't throw, continue with member operation
        }
    }
    
    /**
     * Validate member data
     * @param {Object} data - Member data
     * @returns {Object} Validation result
     */
    validateMemberData(data) {
        const errors = [];
        
        // Required fields
        if (!data.fullName?.trim()) {
            errors.push('Full name is required');
        }
        
        if (!data.email?.trim()) {
            errors.push('Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.push('Invalid email format');
        }
        
        if (data.phone && !/^[0-9]{10,11}$/.test(data.phone)) {
            errors.push('Phone number must be 10-11 digits');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Create singleton instance
const memberService = new MemberService();

// Export
export default memberService;