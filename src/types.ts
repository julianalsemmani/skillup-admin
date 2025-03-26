export interface Exercise {
  id: string;
  name: string;
  force: string;
  level: string;
  mechanic: string;
  equipment: string;
  primaryMuscles: string;
  secondaryMuscles: string;
  instructions: string;
  category: string;
  images: string[];
  nameNO: string;
}

export interface ExerciseDetail {
  id?: string;
  exercise: string;
  repetition: number;
  set: number;
  repetitionType: 'minutes' | 'seconds' | 'reps';
  session?: string;
}

export interface Session {
  id?: string;
  title: string;
  type: string;
  description: string;
  goal: string;
  startDate: string;
  endDate: string;
  exercises: string[];
  points: number;
  group?: string;
  user?: string;
}

export interface Club {
  id: string;
  name: string;
  admin: string[];
}

export interface Group {
  id: string;
  name: string;
  club: string;
  members: string[];
  invitationCode: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface UserSession {
  id?: string;
  user: string;
  session: string;
  completed: boolean;
  completed_at?: string;
  manualVerification: boolean;
}