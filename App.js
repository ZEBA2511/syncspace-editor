import React from 'react';
import CodeEditor from './components/editor/codeEditor';

function App() {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* Left side: Whiteboard panel */}
      <div style={{ flex: 1, borderRight: '1px solid #ccc', padding: '20px' }}>
        <h3>Whiteboard Panel</h3>
      </div>

      {/* Right side: Code Editor panel */}
      <div style={{ flex: 1 }}>
        <CodeEditor />
      </div>
    </div>
  );
}

export default App;