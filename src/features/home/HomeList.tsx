import { Navigate, useNavigation } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';

export default function HomeList() {
  const auth = useAuth();
  const { location } = useNavigation();

  return auth.user ? (
    <></>
  ) : (
    <Navigate to={'/login'} state={{ from: location }} />
  );
}
