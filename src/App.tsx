import React from 'react';
import { Topbar } from './components/Topbar/Topbar';
import { Sidebar } from './components/Sidebar/Sidebar';
import { WorkspaceCanvas } from './components/Canvas/WorkspaceCanvas';

export const App: React.FC = () => {
  return (
    <div className="h-screen w-screen flex flex-col bg-[#090d16] text-slate-100 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <WorkspaceCanvas />
      </div>
    </div>
  );
};

export default App;
