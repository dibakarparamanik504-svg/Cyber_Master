import {BrowserRouter, Routes, Route} from 'react-router-dom';
import './App.css';
import Home from './pages/home';
import Appointment from './pages/appointment';
import LiveQueue from './pages/Live_queue';
import AIAssistant from './pages/AI_assistance';
import Departments from './pages/depertment';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
            <header/>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/appointment" element={<Appointment />} />
          <Route path="/live-queue" element={<LiveQueue />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/departments" element={<Departments />} />
        </Routes>
        <footer/>
      </BrowserRouter>
      
    </div>
  );
}

export default App;
