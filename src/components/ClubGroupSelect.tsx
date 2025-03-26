import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pb';
import { Club, Group, User } from '../types';
import { Users } from 'lucide-react';

interface Props {
  onGroupSelect: (groupId: string) => void;
  onMembersSelect: (members: User[]) => void;
}

export function ClubGroupSelect({ onGroupSelect, onMembersSelect }: Props) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedClub, setSelectedClub] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const records = await pb.collection('clubs').getList(1, 50);
        setClubs(records.items as Club[]);
      } catch (error) {
        console.error('Error fetching clubs:', error);
      }
    };
    fetchClubs();
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!selectedClub) return;
      try {
        const records = await pb.collection('groups').getList(1, 50, {
          filter: `club = "${selectedClub}"`,
        });
        setGroups(records.items as Group[]);
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };
    fetchGroups();
  }, [selectedClub]);

  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!selectedGroup) return;
      try {
        const group = await pb.collection('groups').getOne(selectedGroup, {
          expand: 'members',
        });
        const members = group.expand?.members || [];
        setGroupMembers(members as User[]);
      } catch (error) {
        console.error('Error fetching group members:', error);
      }
    };
    fetchGroupMembers();
  }, [selectedGroup]);

  const handleClubChange = (clubId: string) => {
    setSelectedClub(clubId);
    setSelectedGroup('');
    setGroupMembers([]);
    setSelectedMembers(new Set());
    onGroupSelect('');
    onMembersSelect([]);
  };

  const handleGroupChange = (groupId: string) => {
    setSelectedGroup(groupId);
    setSelectedMembers(new Set());
    onGroupSelect(groupId);
    onMembersSelect([]);
  };

  const handleMemberToggle = (member: User) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(member.id)) {
      newSelected.delete(member.id);
    } else {
      newSelected.add(member.id);
    }
    setSelectedMembers(newSelected);
    onMembersSelect(groupMembers.filter(m => newSelected.has(m.id)));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Club
        </label>
        <select
          value={selectedClub}
          onChange={(e) => handleClubChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="">Select a club</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      {selectedClub && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Group
          </label>
          <select
            value={selectedGroup}
            onChange={(e) => handleGroupChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Select a group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedGroup && groupMembers.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Members
          </label>
          <div className="border rounded-lg divide-y">
            {groupMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleMemberToggle(member)}
              >
                <input
                  type="checkbox"
                  checked={selectedMembers.has(member.id)}
                  onChange={() => handleMemberToggle(member)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedMembers.size > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users size={16} />
          <span>{selectedMembers.size} members selected</span>
        </div>
      )}
    </div>
  );
}