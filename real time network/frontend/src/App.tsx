
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Interfaces from './pages/Interfaces';
import Devices from './pages/Devices';
import Incidents from './pages/Incidents';
import Settings from './pages/Settings';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="interfaces" element={<Interfaces />} />
          <Route path="devices" element={<Devices />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
