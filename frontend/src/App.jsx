import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRouter from './router/AppRouter';
import { CommandProvider } from './context/CommandContext';

const App = () => {
  return (
    <Router>
      <CommandProvider>
        <div className="min-h-screen bg-[#030305]">
          <AppRouter />
        </div>
      </CommandProvider>
    </Router>
  );
};

export default App;