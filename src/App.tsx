import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { BetaProvider } from './context/BetaContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './pages/Login';
import Home from './pages/Home';

function App() {
  return (
    <AuthProvider>
      <BetaProvider>
        <SocketProvider>
          <NotificationProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Home />} />
              </Routes>
            </Router>
          </NotificationProvider>
        </SocketProvider>
      </BetaProvider>
    </AuthProvider>
  );
}

export default App;
