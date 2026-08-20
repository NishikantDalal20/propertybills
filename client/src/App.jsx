import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Tenants from './pages/Tenants';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/tenants" element={<Tenants />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;