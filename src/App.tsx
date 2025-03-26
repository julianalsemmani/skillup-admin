import React, { useState, useEffect } from 'react';
import { ExerciseSearch } from './components/ExerciseSearch';
import { ExerciseDetailForm } from './components/ExerciseDetailForm';
import { ClubGroupSelect } from './components/ClubGroupSelect';
import { SessionList } from './components/SessionList';
import { AuthForm } from './components/AuthForm';
import { ClubSetup } from './components/ClubSetup';
import { Exercise, ExerciseDetail, Session, User, UserSession } from './types';
import { pb, isUserValid, getCurrentUser, logout, getUserClub } from './lib/pb';
import { format } from 'date-fns';
import { Dumbbell, Plus, Save, X, LogOut } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(isUserValid());
  const [hasClub, setHasClub] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  
  const [session, setSession] = useState<Partial<Session>>({
    title: '',
    type: '',
    description: '',
    goal: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    points: 0,
  });

  const [exerciseDetails, setExerciseDetails] = useState<Array<{
    exercise: Exercise;
    detail: ExerciseDetail;
  }>>([]);

  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      checkClub();
      fetchSessions();
    }
  }, [isAuthenticated]);

  // Subscribe to auth state changes
  useEffect(() => {
    pb.authStore.onChange(() => {
      setIsAuthenticated(isUserValid());
    });
  }, []);

  const checkClub = async () => {
    const club = await getUserClub();
    setHasClub(!!club);
  };

  const fetchSessions = async () => {
    try {
      const records = await pb.collection('sessions').getList(1, 50, {
        sort: '-created',
        expand: 'exercises,user_sessions(session)',
      });
      setSessions(records.items as Session[]);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const handleAddExercise = (exercise: Exercise) => {
    setExerciseDetails([
      ...exerciseDetails,
      {
        exercise,
        detail: {
          exercise: exercise.id,
          repetition: 10,
          set: 3,
          repetitionType: 'reps',
        },
      },
    ]);
  };

  const handleUpdateDetail = (index: number, detail: ExerciseDetail) => {
    const newDetails = [...exerciseDetails];
    newDetails[index].detail = detail;
    setExerciseDetails(newDetails);
  };

  const handleRemoveDetail = (index: number) => {
    setExerciseDetails(exerciseDetails.filter((_, i) => i !== index));
  };

  const handleGroupSelect = (groupId: string) => {
    setSession(prev => ({ ...prev, group: groupId }));
  };

  const handleMembersSelect = (members: User[]) => {
    setSelectedMembers(members);
  };

  const resetForm = () => {
    setSession({
      title: '',
      type: '',
      description: '',
      goal: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      points: 0,
    });
    setExerciseDetails([]);
    setSelectedMembers([]);
    setIsEditing(false);
    setShowForm(false);
  };

  const handleEditSession = async (sessionToEdit: Session) => {
    try {
      // Fetch exercise details
      const exerciseRecords = await pb.collection('exercise_detail').getList(1, 50, {
        filter: `session = "${sessionToEdit.id}"`,
        expand: 'exercise',
      });

      const details = exerciseRecords.items.map((detail: any) => ({
        exercise: detail.expand.exercise,
        detail: {
          id: detail.id,
          exercise: detail.exercise,
          repetition: detail.repetition,
          set: detail.set,
          repetitionType: detail.repetitionType,
          session: detail.session,
        },
      }));

      // Fetch user sessions
      const userSessionRecords = await pb.collection('user_sessions').getList(1, 50, {
        filter: `session = "${sessionToEdit.id}"`,
        expand: 'user',
      });

      const members = userSessionRecords.items.map((us: any) => us.expand.user);

      setSession(sessionToEdit);
      setExerciseDetails(details);
      setSelectedMembers(members);
      setIsEditing(true);
      setShowForm(true);
    } catch (error) {
      console.error('Error fetching session details:', error);
      alert('Error loading session details. Please try again.');
    }
  };

  const handleDeleteSession = async (sessionToDelete: Session) => {
    try {
      // Delete exercise details
      const exerciseRecords = await pb.collection('exercise_detail').getList(1, 50, {
        filter: `session = "${sessionToDelete.id}"`,
      });

      await Promise.all(
        exerciseRecords.items.map((detail: any) =>
          pb.collection('exercise_detail').delete(detail.id)
        )
      );

      // Delete user sessions
      const userSessionRecords = await pb.collection('user_sessions').getList(1, 50, {
        filter: `session = "${sessionToDelete.id}"`,
      });

      await Promise.all(
        userSessionRecords.items.map((us: any) =>
          pb.collection('user_sessions').delete(us.id)
        )
      );

      // Delete session
      await pb.collection('sessions').delete(sessionToDelete.id);

      // Refresh sessions list
      await fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Error deleting session. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let sessionId: string;

      if (isEditing && session.id) {
        // Update existing session
        await pb.collection('sessions').update(session.id, {
          ...session,
          exercises: [], // We'll update this after handling exercise details
        });
        sessionId = session.id;

        // Delete existing exercise details
        const existingDetails = await pb.collection('exercise_detail').getList(1, 50, {
          filter: `session = "${sessionId}"`,
        });

        await Promise.all(
          existingDetails.items.map((detail: any) =>
            pb.collection('exercise_detail').delete(detail.id)
          )
        );

        // Delete existing user sessions
        const existingUserSessions = await pb.collection('user_sessions').getList(1, 50, {
          filter: `session = "${sessionId}"`,
        });

        await Promise.all(
          existingUserSessions.items.map((us: any) =>
            pb.collection('user_sessions').delete(us.id)
          )
        );
      } else {
        // Create new session
        const createdSession = await pb.collection('sessions').create({
          ...session,
          exercises: [],
          user: getCurrentUser()?.id,
        });
        sessionId = createdSession.id;
      }

      // Create exercise details
      const createdDetails = await Promise.all(
        exerciseDetails.map(({ detail }) =>
          pb.collection('exercise_detail').create({
            ...detail,
            session: sessionId,
          })
        )
      );

      // Update session with exercise detail IDs
      await pb.collection('sessions').update(sessionId, {
        exercises: createdDetails.map(detail => detail.id),
      });

      // Create user_sessions for selected members
      if (selectedMembers.length > 0) {
        await Promise.all(
          selectedMembers.map(member => {
            const userSession: UserSession = {
              user: member.id,
              session: sessionId,
              completed: false,
              manualVerification: false,
            };
            return pb.collection('user_sessions').create(userSession);
          })
        );
      }

      alert(isEditing ? 'Session updated successfully!' : 'Session created successfully!');
      
      // Reset form and refresh sessions
      resetForm();
      await fetchSessions();
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Error saving session. Please try again.');
    }
  };

  const handleLogout = () => {
    logout();
    setSessions([]);
    resetForm();
  };

  if (!isAuthenticated) {
    return <AuthForm onSuccess={() => setIsAuthenticated(true)} />;
  }

  if (!hasClub) {
    return <ClubSetup onComplete={() => setHasClub(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Dumbbell className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Training Sessions</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Create Session
              </button>
            )}
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>

        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {isEditing ? 'Edit Session' : 'Create New Session'}
              </h2>
              <button
                type="button"
                onClick={resetForm}
                className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={session.title}
                    onChange={(e) => setSession({ ...session, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <input
                    type="text"
                    value={session.type}
                    onChange={(e) => setSession({ ...session, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={session.description}
                    onChange={(e) => setSession({ ...session, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goal
                  </label>
                  <input
                    type="text"
                    value={session.goal}
                    onChange={(e) => setSession({ ...session, goal: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={session.startDate}
                    onChange={(e) => setSession({ ...session, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={session.endDate}
                    onChange={(e) => setSession({ ...session, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points
                  </label>
                  <input
                    type="number"
                    value={session.points}
                    onChange={(e) => setSession({ ...session, points: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Assign Session</h2>
              <ClubGroupSelect
                onGroupSelect={handleGroupSelect}
                onMembersSelect={handleMembersSelect}
              />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Exercises</h2>
              <ExerciseSearch onSelect={handleAddExercise} />
              
              <div className="mt-6 space-y-4">
                {exerciseDetails.map((item, index) => (
                  <ExerciseDetailForm
                    key={item.exercise.id + index}
                    exercise={item.exercise}
                    detail={item.detail}
                    onChange={(detail) => handleUpdateDetail(index, detail)}
                    onRemove={() => handleRemoveDetail(index)}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={exerciseDetails.length === 0 || selectedMembers.length === 0}
              >
                <Save size={20} />
                {isEditing ? 'Update Session' : 'Create Session'}
              </button>
            </div>
          </form>
        ) : (
          <SessionList
            sessions={sessions}
            onEdit={handleEditSession}
            onDelete={handleDeleteSession}
          />
        )}
      </div>
    </div>
  );
}

export default App;