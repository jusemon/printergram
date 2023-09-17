import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import useTelegram, { TelegramWrapperLoginParams } from './use-telegram';

type SignIn = ((params: TelegramWrapperLoginParams) => Promise<void>) | null;
type SignOut = (() => Promise<void>) | null;

type AuthContextProps = {
  user: User | null;
  signIn: SignIn;
  signOut: SignOut;
};

type User = null | {
  userId: number;
  accessHash: number;
  [name: string]: any;
};

const AuthContext = createContext<AuthContextProps>(
  {} as unknown as AuthContextProps
);

export function ProvideAuth({ children }: any) {
  const auth = useProvideAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useProvideAuth() {
  const telegram = useTelegram();
  const [user, setUser] = useState<User>(null);
  const [signIn, setSignIn] = useState<SignIn>(null);
  const [signOut, setSignOut] = useState<SignOut>(null);

  const setupService = useCallback(async () => {
    if (!telegram) {
      return;
    }

    if (telegram.isLogged) {
      await telegram.getClient();
      const tlUser = await telegram.getMe();
      setUser(tlUser.toJSON() as unknown as User);
    }

    setSignIn(() => async (params: TelegramWrapperLoginParams) => {
      const tlUser = await telegram.login(params);
      setUser(tlUser.toJSON() as unknown as User);
    });

    setSignOut(() => async () => {
      await telegram.logout();
      setUser(null);
    });
  }, [telegram]);

  useEffect(() => {
    setupService();
  }, [setupService]);

  return {
    user,
    signIn,
    signOut,
  };
}
