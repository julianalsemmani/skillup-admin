import React, { useState, useEffect } from 'react';
import { createClub, createGroup, getUserClub, getClubGroups, deleteGroup, addMembersToGroup, getGroupSessions } from '../lib/pb';
import { Club, Group, Session, User } from '../types';
import { Building2, Users, Plus, UserPlus, Trash2, Settings, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  onComplete: () => void;
}

interface AddMembersModalProps {
  onClose: () => void;
  onAdd: (emails: string[]) => void;
}

function AddMembersModal({ onClose, onAdd }: AddMembersModalProps) {
  const [emails, setEmails] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailList = emails.split('\n').map(email => email.trim()).filter(Boolean);
    onAdd(emailList);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Add Members</h3>
        <form onSubmit={handleSubmit}>
          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="Enter email addresses (one per line)"
            className="w-full h-32 px-3 py-2 border rounded-lg mb-4"
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Members
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ClubSetup({ onComplete }: Props) {
  const [club, setClub] = useState<Club | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [clubName, setClubName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [groupSessions, setGroupSessions] = useState<Record<string, Session[]>>({});

  useEffect(() => {
    loadClubData();
  }, []);

  const loadClubData = async () => {
    try {
      const userClub = await getUserClub();
      if (userClub) {
        setClub(userClub);
        const clubGroups = await getClubGroups(userClub.id);
        setGroups(clubGroups);
        
        // Load sessions for each group
        const sessionsMap: Record<string, Session[]> = {};
        for (const group of clubGroups) {
          const sessions = await getGroupSessions(group.id);
          sessionsMap[group.id] = sessions;
        }
        setGroupSessions(sessionsMap);
      }
    } catch (error) {
      console.error('Error loading club data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim()) return;

    try {
      const newClub = await createClub(clubName);
      setClub(newClub);
      setClubName('');
      onComplete();
    } catch (error) {
      console.error('Error creating club:', error);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !club) return;

    try {
      const newGroup = await createGroup(groupName, club.id);
      setGroups([...groups, newGroup]);
      setGroupName('');
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;

    try {
      await deleteGroup(groupId);
      setGroups(groups.filter(g => g.id !== groupId));
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const handleAddMembers = async (groupId: string, emails: string[]) => {
    try {
      // First, create user accounts for the emails if they don't exist
      const userIds = [];
      for (const email of emails) {
        try {
          const user = await pb.collection('users').create({
            email,
            emailVisibility: true,
            password: Math.random().toString(36).slice(-8), // Generate random password
            passwordConfirm: Math.random().toString(36).slice(-8),
          });
          userIds.push(user.id);
        } catch (error) {
          // User might already exist, try to fetch them
          const existingUsers = await pb.collection('users').getList(1, 1, {
            filter: `email = "${email}"`,
          });
          if (existingUsers.items.length > 0) {
            userIds.push(existingUsers.items[0].id);
          }
        }
      }

      // Add the users to the group
      await addMembersToGroup(groupId, userIds);
      await loadClubData(); // Reload to get updated member counts
    } catch (error) {
      console.error('Error adding members:', error);
      alert('Error adding members. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-8">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Create Your Club</h2>
          </div>

          <form onSubmit={handleCreateClub} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Club Name
              </label>
              <input
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter club name"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="h-5 w-5" />
              Create Club
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{club.name}</h2>
                <p className="text-sm text-gray-500">Club Management</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-gray-600" />
                <h3 className="text-xl font-semibold">Groups</h3>
              </div>
            </div>

            <form onSubmit={handleCreateGroup} className="mb-8">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter group name"
                  required
                />
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  <Plus className="h-5 w-5" />
                  Add Group
                </button>
              </div>
            </form>

            <div className="grid gap-4 sm:grid-cols-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex flex-col p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{group.name}</h4>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <UserPlus className="h-4 w-4" />
                        <span>{group.expand?.members?.length || 0} members</span>
                      </div>
                      {groupSessions[group.id]?.length > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <Calendar className="h-4 w-4" />
                          <span>{groupSessions[group.id].length} sessions</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedGroupId(group.id);
                          setShowAddMembers(true);
                        }}
                        className="p-1.5 text-gray-600 hover:text-blue-600 rounded-full hover:bg-blue-50"
                        title="Add Members"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="p-1.5 text-gray-600 hover:text-red-600 rounded-full hover:bg-red-50"
                        title="Delete Group"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-auto pt-3 border-t">
                    <div className="text-sm font-medium">
                      Invitation Code: <span className="text-blue-600">{group.invitationCode}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {groups.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No groups created yet</p>
                <p className="text-sm text-gray-400">Create your first group to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddMembers && (
        <AddMembersModal
          onClose={() => setShowAddMembers(false)}
          onAdd={(emails) => handleAddMembers(selectedGroupId, emails)}
        />
      )}
    </div>
  );
}