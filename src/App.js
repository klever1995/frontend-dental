import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Registro from './pages/Registro';
import Principal from './Principal';
import WhatsAppCallback from './pages/WhatsAppCallback';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/principal" element={<Principal />} />
        <Route path="/whatsapp/callback" element={<WhatsAppCallback />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;