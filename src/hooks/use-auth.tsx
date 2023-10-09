import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import useTelegram, { TelegramWrapperLoginParams } from './use-telegram';
import { isTelegramError } from '../utils/type-guards';

type SignIn = ((params: TelegramWrapperLoginParams) => Promise<void>) | null;
type SignOut = (() => Promise<void>) | null;

type AuthContextProps = {
  user: User | null;
  photo: string;
  signIn: SignIn;
  signOut: SignOut;
};

type User = null | {
  id: number;
  accessHash: number;
  [name: string]: any;
};

function useProvideAuth() {
  const telegram = useTelegram();
  const [user, setUser] = useState<User>(null);
  const [photo, setPhoto] = useState<string>('');
  const [signIn, setSignIn] = useState<SignIn>(null);
  const [signOut, setSignOut] = useState<SignOut>(null);

  const setupService = useCallback(async () => {
    if (!telegram) {
      return;
    }

    if (telegram.isLogged) {
      try {
        const tlUser = await telegram.getMe();
        setUser(tlUser.toJSON() as unknown as User);
        const photo = await telegram.getProfilePic();
        setPhoto(photo);
      } catch (error) {
        if (isTelegramError(error) && error.code === 401) {
          await telegram.logout();
          setUser(null);
          setPhoto('');
        }
      }
    }

    setSignIn(() => async (params: TelegramWrapperLoginParams) => {
      const tlUser = await telegram.login(params);
      setUser(tlUser.toJSON() as unknown as User);
      const photo = await telegram.getProfilePic();
      setPhoto(photo);
    });

    setSignOut(() => async () => {
      await telegram.logout();
      setUser(null);
      setPhoto('');
    });
  }, [telegram]);

  useEffect(() => {
    setupService();
  }, [setupService]);

  return {
    photo,
    user,
    signIn,
    signOut,
  };
}

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
