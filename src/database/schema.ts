export interface StudentRecord {
  id: string
  name: string
  email: string
  phone: string
  gender: 'M' | 'F'
  dob: string
  college: string
  program: string
  year: string
  enrollmentYear: number
  status: 'active' | 'graduated' | 'withdrawn'
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
    bio: 'Principal of the College of Science and Technology. Authorizes final clearance.',
    office: 'CST Building, 3rd Floor', officeHours: 'Mon-Fri 09:00-11:00',
  },
  {
    id: 'registrar', name: 'Marie Claire Niyonzima', email: 'mc.niyonzima@ur.ac.rw',
    title: 'Registrar / Dean of Students', level: 4, college: 'UR Headquarters',
    phone: '+250 788 700 800', avatar: 'MN',
    bio: 'University Registrar. Issues official clearance certificates and transcripts.',
    office: 'UR Headquarters, Room 401', officeHours: 'Mon-Fri 08:00-17:00',
  },
]

// ───── Generate 500+ students ─────

const FIRST_NAMES_M = ['Jean','Patrick','Emmanuel','David','Samuel','Joseph','Daniel','Peter','James','John','Paul','Michael','Andrew','Eric','Charles','Henry','Frank','Albert','Kevin','Brian','George','Ronald','Edward','Thomas','Christopher','Alex','Oliver','William','Robert','Richard']
const FIRST_NAMES_F = ['Marie','Alice','Diane','Esther','Grace','Ruth','Sarah','Elizabeth','Catherine','Agnes','Beatrice','Joyce','Claire','Louise','Anne','Jane','Monique','Helene','Rose','Yvonne','Olivier','Lydia','Naomi','Rachel','Patricia','Deborah','Sandra','Jennifer','Dorcas','Florence']
const LAST_NAMES = ['Ndayambaje','Mugabo','Uwimana','Hakizimana','Habimana','Niyonzima','Mukamana','Rutayisire','Mugisha','Nshimiyimana','Bizimana','Tuyishime','Imanishimwe','Abimana','Nkurunziza','Gakuba','Muhire','Rurangwa','Bazimaziki','Ntawuyirushintege','Karorero','Mpano','Habiyaremye','Rugamba','Nzeyimana','Niyibizi','Rukundo','Mbanda','Nteziryayo','Bana']

const PROGRAMS_BY_COLLEGE: Record<string, string[]> = {}
COLLEGES.forEach(c => { PROGRAMS_BY_COLLEGE[c.code] = c.programs })

function random<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function pad(n: number, len = 3) { return String(n).padStart(len, '0') }

function generatePhone(): string {
  return `+250 7${random(['88','89','87','86','85'])} ${pad(Math.floor(Math.random()*900)+100)} ${pad(Math.floor(Math.random()*900)+100)}`
}

function generateEmail(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '') + '@ur.ac.rw'
}

function generateDOB(year: number): string {
  const m = pad(Math.floor(Math.random() * 12) + 1, 2)
  const d = pad(Math.floor(Math.random() * 28) + 1, 2)
  return `${year}-${m}-${d}`
}

export function generateStudentDatabase(count = 520): StudentRecord[] {
  const students: StudentRecord[] = []
  let id = 2022001

  for (let i = 0; i < count; i++) {
    const gender = Math.random() > 0.5 ? 'M' as const : 'F' as const
    const firstNames = gender === 'M' ? FIRST_NAMES_M : FIRST_NAMES_F
    const name = `${random(firstNames)} ${random(LAST_NAMES)}`
    const college = random(COLLEGES)
    const enrollmentYear = Math.floor(Math.random() * 5) + 2022
    const years = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5+']
    const yearIndex = Math.min(2026 - enrollmentYear, years.length - 1)

    students.push({
      id: `UR/${enrollmentYear}/${college.code}/${pad(id)}`,
      name,
      email: generateEmail(name),
      phone: generatePhone(),
      gender,
      dob: generateDOB(enrollmentYear - 18 - Math.floor(Math.random() * 4)),
      college: college.name,
      program: random(college.programs),
      year: years[Math.max(0, yearIndex)],
      enrollmentYear,
      status: enrollmentYear < 2024 && Math.random() > 0.7 ? 'graduated' as const : 'active' as const,
    })
    id++
  }
  return students
}

// ───── Meeting slots ─────

export function generateMeetingSlots(): MeetingSlot[] {
  const slots: MeetingSlot[] = []
  const dates = ['2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12', '2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19']
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
