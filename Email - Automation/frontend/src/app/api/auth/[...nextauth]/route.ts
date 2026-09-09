import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        try {
          const formData = new URLSearchParams();
          formData.append('username', credentials.username);
          formData.append('password', credentials.password);

          const res = await fetch(`${API_URL}/api/v1/auth/login/access-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
          });

          const data = await res.json();

          if (res.ok && data.access_token) {
            // Fetch user profile
            const userRes = await fetch(`${API_URL}/api/v1/users/me`, {
              headers: {
                Authorization: `Bearer ${data.access_token}`,
              },
            });
            const user = await userRes.json();
            
            return {
              id: user.id,
              name: user.full_name,
              email: user.email,
              accessToken: data.access_token,
            };
          }
          return null;
        } catch (e) {
          console.error("Auth error", e);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; accessToken?: string };
        token.accessToken = u.accessToken;
        token.id = u.id;
      }
      return token;
    },
    async session({ session, token }) {
      const s = session as { accessToken?: unknown; user?: { id?: unknown } };
      s.accessToken = token.accessToken;
      if (s.user) {
        s.user.id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt"
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
