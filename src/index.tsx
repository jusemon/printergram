import ReactDOM from 'react-dom/client';
import 'gestalt/dist/gestalt.css';
import './index.css';
import reportWebVitals from './reportWebVitals';
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom';
import ErrorPage from './components/Error';
import HomeList from './features/home/HomeList';
import LoginForm from './features/auth/LoginForm';
import React from 'react';
import { ProvideAuth } from './hooks/use-auth';

const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <Navigate replace to='home' />,
      },
      {
        path: '/home',
        element: <HomeList />,
      },
      {
        path: '/login',
        element: <LoginForm />,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ProvideAuth>
      <RouterProvider router={router} />
    </ProvideAuth>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
