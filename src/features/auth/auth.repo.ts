import { db } from '@/server/db/client';

export async function findUserByEmail(email: string) {
  return await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

export async function findUserById(id: string) {
  return await db.user.findUnique({
    where: { id },
  });
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  return await db.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
    },
  });
}

export async function createSession(data: {
  userId: string;
  token: string;
  expiresAt: Date;
}) {
  return await db.session.create({
    data,
  });
}

export async function deleteSessionByToken(token: string) {
  return await db.session.deleteMany({
    where: { token },
  });
}

export async function findSessionWithUser(token: string) {
  return await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
}
