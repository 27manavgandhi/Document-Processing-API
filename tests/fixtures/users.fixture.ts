export const testUsers = {
  admin: {
    id: 'user-admin-001',
    email: 'admin@test.com',
    role: 'admin',
  },
  user1: {
    id: 'user-001',
    email: 'user1@test.com',
    role: 'user',
  },
  user2: {
    id: 'user-002',
    email: 'user2@test.com',
    role: 'user',
  },
  user3: {
    id: 'user-003',
    email: 'user3@test.com',
    role: 'user',
  },
};

export const createMockJWT = (userId: string): string => {
  return `mock-jwt-token-${userId}`;
};

export const createAuthHeader = (userId: string): string => {
  return `Bearer ${createMockJWT(userId)}`;
};