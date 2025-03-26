import PocketBase from 'pocketbase';

export const pb = new PocketBase('https://pocketbase.server.alsemmani.com');

export type AuthModel = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
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

export const register = async (email: string, password: string, passwordConfirm: string) => {
  return await pb.collection('users').create({
    email,
    password,
    passwordConfirm,
    emailVisibility: true,
  });
};

export const logout = () => {
  pb.authStore.clear();
};