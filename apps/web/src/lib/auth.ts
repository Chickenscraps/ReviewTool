import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
} = NextAuth({
    adapter: PrismaAdapter(prisma),
    trustHost: true,
    providers: [
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.email || !credentials?.password) {
                        return null;
                    }

                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email as string },
                        include: {
                            role: {
                                include: {
                                    permissions: {
                                        include: {
                                            permission: true,
                                        },
                                    },
                                },
                            },
                        },
                    });

                    if (!user) {
                        console.log('Login failed: User not found', credentials.email);
                        // Access audit log safely - if it fails, don't crash auth
                        try {
                            await prisma.auditLog.create({
                                data: {
                                    eventType: 'LOGIN_FAILURE',
                                    eventSource: 'web-portal',
                                    details: JSON.stringify({ email: credentials.email, reason: 'User not found' }),
                                },
                            });
                        } catch (e) {
                            console.error('Failed to write audit log', e);
                        }
                        return null;
                    }

                    const isValid = await compare(credentials.password as string, user.passwordHash);

                    if (!isValid) {
                        console.log('Login failed: Invalid password', credentials.email);
                        try {
                            await prisma.auditLog.create({
                                data: {
                                    eventType: 'LOGIN_FAILURE',
                                    eventSource: 'web-portal',
                                    userId: user.id,
                                    details: JSON.stringify({ reason: 'Invalid password' }),
                                },
                            });
                        } catch (e) {
                            console.error('Failed to write audit log', e);
                        }
                        return null;
                    }

                    // Update last login
                    try {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { lastLoginAt: new Date() },
                        });

                        await prisma.auditLog.create({
                            data: {
                                eventType: 'LOGIN_SUCCESS',
                                eventSource: 'web-portal',
                                userId: user.id,
                                details: JSON.stringify({ action: 'User logged in successfully' }),
                            },
                        });
                    } catch (e) {
                        console.error('Non-critical login update failed', e);
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        image: user.avatarUrl,
                        role: user.role.name,
                        permissions: user.role.permissions.map((rp: any) => rp.permission.code),
                    };
                } catch (error) {
                    console.error('Auth critical error:', error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.permissions = (user as any).permissions;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                (session.user as any).role = token.role;
                (session.user as any).permissions = token.permissions;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 hours
    },
}) as any;
