import PocketBase from 'pocketbase';

export const pb = new PocketBase('https://pocketbase.server.alsemmani.com');

export type AuthModel = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  clubs?: string;
};

export const isUserValid = () => {
  return pb.authStore.isValid;
};

export const getCurrentUser = () => {
  return pb.authStore.model as AuthModel | null;
};

export const login = async (email: string, password: string) => {
  return await pb.collection('users').authWithPassword(email, password);
};

export const register = async (data: {
  email: string;
  password: string;
  passwordConfirm: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
}) => {
  return await pb.collection('users').create({
    ...data,
    emailVisibility: true,
  });
};

export const createClub = async (name: string) => {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const club = await pb.collection('clubs').create({
    name,
    admin: [user.id],
  });

  // Update user's club reference
  await pb.collection('users').update(user.id, {
    clubs: club.id,
  });

  return club;
};

export const createGroup = async (name: string, clubId: string) => {
  return await pb.collection('groups').create({
    name,
    club: clubId,
    members: [],
    invitationCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
  });
};

export const deleteGroup = async (groupId: string) => {
  return await pb.collection('groups').delete(groupId);
};

export const addMembersToGroup = async (groupId: string, memberIds: string[]) => {
  const group = await pb.collection('groups').getOne(groupId);
  const updatedMembers = [...new Set([...(group.members || []), ...memberIds])];
  return await pb.collection('groups').update(groupId, {
    members: updatedMembers,
  });
};

export const removeMemberFromGroup = async (groupId: string, memberId: string) => {
  const group = await pb.collection('groups').getOne(groupId);
  const updatedMembers = (group.members || []).filter(id => id !== memberId);
  return await pb.collection('groups').update(groupId, {
    members: updatedMembers,
  });
};

export const getUserClub = async () => {
  const user = getCurrentUser();
  if (!user) return null;

  try {
    const record = await pb.collection('users').getOne(user.id, {
      expand: 'clubs',
    });
    return record.expand?.clubs;
  } catch {
    return null;
  }
};

export const getClubGroups = async (clubId: string) => {
  const records = await pb.collection('groups').getList(1, 50, {
    filter: `club = "${clubId}"`,
    expand: 'members',
  });
  return records.items;
};

export const getGroupSessions = async (groupId: string) => {
  const records = await pb.collection('sessions').getList(1, 50, {
    filter: `group = "${groupId}"`,
    expand: 'exercises,user_sessions(session)',
    sort: '-created',
  });
  return records.items;
};

export const logout = () => {
  pb.authStore.clear();
};