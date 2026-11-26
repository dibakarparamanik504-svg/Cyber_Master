import {BrowserRouter, Routes, Route} from 'react-router-dom';
import './App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
            <header/>
        <Routes>
          <Route path="/" element={<div>Welcome to the App</div>} />
        </Routes>
        <footer/>
      </BrowserRouter>
      
    </div>
  );
}

export default App;
