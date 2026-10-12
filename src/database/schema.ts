export interface StudentRecord {
  id: string
  name: string
  email: string
  phone: string
  gender?: 'M' | 'F'
  dob: string
  college: string
  program: string
  year: string
  enrollmentYear?: number
  status?: 'active' | 'graduated' | 'withdrawn'
}

export interface LeaderRecord {
  id: string
  name: string
  email: string
  title: string
  level: number
  college: string
  phone: string
  avatar: string
  bio: string
  office: string
  officeHours: string
}

export interface MeetingSlot {
  id: string
  leaderId: string
  date: string
  time: string
  available: boolean
  studentId?: string
  reason?: string
}

export interface AuditEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  details: string
  level: number
}

export interface College {
  id: string
  code: string
  name: string
  programs: string[]
}

// ───── Colleges ─────

export const COLLEGES: College[] = [
  {
    id: 'cst', code: 'CST', name: 'College of Science and Technology',
    programs: ['Computer Science', 'Information Technology', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Applied Mathematics', 'Physics'],
  },
  {
    id: 'cbe', code: 'CBE', name: 'College of Business and Economics',
    programs: ['Business Administration', 'Accounting', 'Finance', 'Economics', 'Marketing', 'Entrepreneurship'],
  },
  {
    id: 'cass', code: 'CASS', name: 'College of Arts and Social Sciences',
    programs: ['Sociology', 'Psychology', 'Political Science', 'Journalism', 'Linguistics', 'History'],
  },
  {
    id: 'ce', code: 'CE', name: 'College of Education',
    programs: ['Secondary Education', 'Primary Education', 'Special Needs Education', 'Educational Psychology'],
  },
  {
    id: 'cmhs', code: 'CMHS', name: 'College of Medicine and Health Sciences',
    programs: ['General Medicine', 'Nursing', 'Pharmacy', 'Public Health', 'Dentistry'],
  },
  {
    id: 'caff', code: 'CAFF', name: 'College of Agriculture and Food Sciences',
    programs: ['Agronomy', 'Food Science', 'Agricultural Economics', 'Soil Science', 'Animal Production'],
  },
  {
    id: 'cvas', code: 'CVAS', name: 'College of Veterinary Medicine',
    programs: ['Veterinary Medicine', 'Animal Health', 'Wildlife Management'],
  },
]

// ───── Leaders ─────

export const LEADERS: LeaderRecord[] = [
  {
    id: 'class-rep', name: 'Jean Mugabo', email: 'jean.mugabo@ur.ac.rw',
    title: 'Class Representative', level: 1, college: 'CST',
    phone: '+250 788 100 200', avatar: 'JM',
    bio: 'Student representative for the Computer Science cohort. Responsible for initial verification of clearance documents.',
    office: 'CST Building, Room 103', officeHours: 'Mon-Wed 10:00-12:00',
  },
  {
    id: 'hod', name: 'Dr. Alice Uwimana', email: 'a.uwimana@ur.ac.rw',
    title: 'Head of Department', level: 2, college: 'CST',
    phone: '+250 788 300 400', avatar: 'AU',
    bio: 'Head of Computer Science Department. Reviews academic progress and project completion.',
    office: 'CST Building, Room 205', officeHours: 'Tue-Thu 14:00-16:00',
  },
  {
    id: 'principal', name: 'Prof. Patrick Habimana', email: 'p.habimana@ur.ac.rw',
    title: 'College Principal', level: 3, college: 'CST',
    phone: '+250 788 500 600', avatar: 'PH',
    bio: 'College-level reviewer for the clearance and transcript portal preview workflow.',
    office: 'CST Building, 3rd Floor', officeHours: 'Mon-Fri 09:00-11:00',
  },
  {
    id: 'registrar', name: 'Marie Claire Niyonzima', email: 'mc.niyonzima@ur.ac.rw',
    title: 'Registrar / Dean of Students', level: 4, college: 'UR Headquarters',
    phone: '+250 788 700 800', avatar: 'MN',
    bio: 'Final reviewer for the portal preview workflow. This preview does not issue official University records.',
    office: 'UR Headquarters, Room 401', officeHours: 'Mon-Fri 08:00-17:00',
  },
]

// ───── Meeting slots ─────

export function generateMeetingSlots(): MeetingSlot[] {
  const slots: MeetingSlot[] = []
  const dates: string[] = []
  const nextDate = new Date()
  nextDate.setHours(12, 0, 0, 0)
  while (dates.length < 10) {
    const day = nextDate.getDay()
    if (day !== 0 && day !== 6) dates.push(nextDate.toISOString().slice(0, 10))
    nextDate.setDate(nextDate.getDate() + 1)
  }
  const times = ['09:00', '10:00', '11:00', '14:00', '15:00']
  let slotId = 1

  for (const leader of LEADERS) {
    for (const date of dates) {
      for (const time of times) {
        if (Math.random() > 0.3) {
          slots.push({
            id: `slot-${slotId++}`,
            leaderId: leader.id,
            date,
            time,
            available: true,
          })
        }
      }
    }
  }
  return slots
}

export { STUDENT_DB } from './studentDb'
