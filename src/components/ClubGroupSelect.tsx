import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pb';
import { Club, Group, User } from '../types';
import { Users, Building2, Check } from 'lucide-react';

interface Props {
  onGroupSelect: (groupId: string) => void;
  onMembersSelect: (members: User[]) => void;
  selectedGroupId?: string;
  selectedMemberIds?: string[];
}

export function ClubGroupSelect({ onGroupSelect, onMembersSelect, selectedGroupId, selectedMemberIds = [] }: Props) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedClub, setSelectedClub] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>(selectedGroupId || '');
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set(selectedMemberIds));

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const records = await pb.collection('clubs').getList(1, 50);
        setClubs(records.items as Club[]);
        if (records.items.length > 0 && !selectedClub) {
          setSelectedClub(records.items[0].id);
        }
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Select Club
            </div>
          </label>
          <select
            value={selectedClub}
            onChange={(e) => handleClubChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Select Group
              </div>
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => handleGroupChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      </div>

      {selectedGroup && groupMembers.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Members
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {groupMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => handleMemberToggle(member)}
                className={`flex items-center p-3 rounded-lg cursor-pointer border transition-colors ${
                  selectedMembers.has(member.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-200'
                }`}
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  selectedMembers.has(member.id)
                    ? 'bg-blue-500 text-white'
                    : 'border-2 border-gray-300'
                }`}>
                  {selectedMembers.has(member.id) && <Check className="w-3 h-3" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedMembers.size > 0 && (
        <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
          <Users className="h-4 w-4" />
          <span>{selectedMembers.size} members selected</span>
        </div>
      )}
    </div>
  );
}