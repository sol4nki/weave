import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Demo from './Demo';
import Home from './Home';
import Guide from './Guide';

export default function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/demo" element={<Demo />} />
      </Routes>
    </Router>
  );
}
