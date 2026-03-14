import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

const EMAIL_DOMAIN = 'cityguide.app';

function usernameToEmail(username: string): string {
  return `${username.toLowerCase()}@${EMAIL_DOMAIN}`;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>('');

  const fetchUsername = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();
    if (data?.username) {
      setUsername(data.username);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchUsername(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchUsername(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUsername]);

  const login = useCallback(async (inputUsername: string, password: string) => {
    const email = usernameToEmail(inputUsername);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message === 'Invalid login credentials') {
        throw new Error('用户名或密码错误');
      }
      throw error;
    }
  }, []);

  const register = useCallback(async (inputUsername: string, password: string) => {
    if (password.length < 8) {
      throw new Error('密码长度不能少于8位');
    }

    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]{2,20}$/.test(inputUsername)) {
      throw new Error('用户名须为2-20位，支持中英文、数字和下划线');
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', inputUsername)
      .single();

    if (existing) {
      throw new Error('该用户名已被注册');
    }

    const email = usernameToEmail(inputUsername);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: inputUsername },
      },
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUsername('');
  }, []);

  return { user, session, loading, username, login, register, logout };
}
