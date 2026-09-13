export interface DashboardStats {
  occupancyRate: number;
  occupancyTrend: number;
  weeklyConflicts: number;
  conflictsTrend: number;
  dailyReservations: number;
  reservationsTrend: number;
  activeUsers: number;
  usersTrend: number;
  globalOccupancyRate: number;
  plannedHours: number;
  plannedHoursTrend: number;
  availableRooms: number;
  availableRoomsTrend: number;
  totalCourses: number;
}

export interface TeacherDashboardStats {
  totalReservations: number;
  reservationsTrend: number;
  totalCourses: number;
  coursesTrend: number;
  totalConflicts: number;
  conflictsTrend: number;
  plannedHours: number;
  plannedHoursTrend: number;
}

export interface Conflict {
  id: number;
  course?: string;
  teacher?: string;
  room?: string;
  date?: string;
  time?: string;
  priority?: 'low' | 'medium' | 'high';
  affectedEntities?: Array<{
    type: 'TEACHER' | 'ROOM' | 'COURSE';
    id: string;
    name?: string;
  }>;
  description?: string;
  status?: 'pending' | 'resolved' | 'ignored';
}
