import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import "./index.css";
import { useAuthStore } from "./http/authStore";
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from "./pages/Dashboard/index.tsx";
import { CalendarPage } from "./pages/CalendarPage.tsx";
import { SharedCalendarPage } from "./pages/SharedCalendarPage.tsx";
import { useEffect } from "react";

function App() {
  const { user, logout, isAuth, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <div>
        <div className="bg-black text-white p-4">
          <nav className="container flex justify-between">
            <ul className="flex space-x-4">
              <li><Link to="/">Главная</Link></li>
            </ul>
            <ul className="flex w-auto">
              {!isAuth ? (
                <>
                  <li><Link to="/register" className="mr-5">Регистрация</Link></li>
                  <li><Link to="/login">Войти</Link></li>
                </>
              ) : (
                <>
                  <li className="pr-5">{user?.email}</li>
                  <li>
                    <button onClick={logout} className="hover:underline text-sm cursor-pointer">
                      Выйти
                    </button>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
        <main>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/shared/:token" element={<SharedCalendarPage />} />
            <Route
              path="/"
              element={!isAuth ? <Register /> : <Dashboard />}
            />
            <Route
              path="/calendar/:calendarId"
              element={!isAuth ? <Navigate to="/login" replace /> : <CalendarPage />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;