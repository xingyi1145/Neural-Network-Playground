import { Routes, Route } from 'react-router-dom';
import Playground from './pages/Playground';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Playground />} />
    </Routes>
  );
}

export default App;

