import {HashRouter as Router, Routes, Route, Link, Navigate} from 'react-router-dom';
import "./index.css"
import {useAuthStore} from "./http/authStore";
import {Login} from './pages/Login';
import {Register} from './pages/Register';
import {Dashboard} from "./pages/Dashboard/index.tsx";
import axios from "axios";
import {CalendarPage} from "./pages/CalendarPage.tsx";
import {SharedCalendarPage} from "./pages/SharedCalendarPage.tsx";
import { useEffect, type JSX } from 'react';

axios.defaults.withCredentials = true;

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuth } = useAuthStore();
  return isAuth ? children : <Navigate to="/login" replace />;
}

function App() {
  const { user, logout, isAuth } = useAuthStore();

  useEffect(() => {
    const handleUnauthorized = () => {
      setTimeout(() => {
        window.location.hash = '#/login';
      }, 10);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  return (
    <Router>
      <div>
        <div className="bg-black text-white p-4">
          <nav className='container flex justify-between'>
            <ul className="flex space-x-4">
              <li><Link to="/" className="">Главная</Link></li>
            </ul>
            <ul className="flex w-auto">
              {!isAuth ? (
                <>
                  <li><Link to="/register" className="mr-5">Регистрация</Link></li>
                  <li><Link to="/login" className="">Войти</Link></li>
                </>
              ) : (
                <>
                  <li className="pr-5">{user?.email}</li>
                  <li>
                    <button
                      onClick={logout}
                      className="hover:underline text-sm cursor-pointer"
                    >
                      Выйти
                    </button>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
        <main className="">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/shared/:token" element={<SharedCalendarPage />} />

            <Route path="/" element={
              <ProtectedRoute>
                {isAuth ? <Dashboard /> : <Register />}
              </ProtectedRoute>
            } />
            <Route path="/calendar/:calendarId" element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App