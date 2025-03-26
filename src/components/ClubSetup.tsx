import React, { useState, useEffect } from 'react';
import { createClub, createGroup, getUserClub, getClubGroups } from '../lib/pb';
import { Club, Group } from '../types';
import { Building2, Users, Plus } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

export function ClubSetup({ onComplete }: Props) {
  const [club, setClub] = useState<Club | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [clubName, setClubName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="text-center py-8">
        Loading...
      </div>
    );
  }

  if (!club) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Create Your Club</h2>
        </div>

        <form onSubmit={handleCreateClub}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Club Name
            </label>
            <input
              type="text"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter club name"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Create Club
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">{club.name}</h2>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium">Groups</h3>
            </div>
          </div>

          <form onSubmit={handleCreateGroup} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md"
                placeholder="Enter group name"
                required
              />
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                Add Group
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{group.name}</h4>
                  <p className="text-sm text-gray-500">
                    {group.expand?.members?.length || 0} members
                  </p>
                </div>
                <div className="text-sm bg-gray-100 px-3 py-1 rounded">
                  Code: {group.invitationCode}
                </div>
              </div>
            ))}

            {groups.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No groups created yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}