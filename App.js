import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

function App() {
  const [language, setLanguage] = useState('javascript');
  const editorRef = useRef(null);
  const isUpdatingFromRemote = useRef(false);

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;

    const ydoc = new Y.Doc();
    // eslint-disable-next-line no-unused-vars
    const provider = new WebsocketProvider(
      'wss://demos.yjs.dev',
      'syncspace-room-zeba-123',
      ydoc
    );

    const yText = ydoc.getText('monaco-room');

    yText.observe((event) => {
      if (isUpdatingFromRemote.current) return;
      const currentEditorValue = editor.getValue();
      const remoteValue = yText.toString();
      
      if (currentEditorValue !== remoteValue) {
        isUpdatingFromRemote.current = true;
        editor.setValue(remoteValue);
        isUpdatingFromRemote.current = false;
      }
    });

    editor.onDidChangeModelContent((event) => {
      if (isUpdatingFromRemote.current) return;
      const editorValue = editor.getValue();
      if (yText.toString() !== editorValue) {
        ydoc.transact(() => {
          yText.delete(0, yText.length);
          yText.insert(0, editorValue);
        });
      }
    });
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>SyncSpace Editor</h1>
      
      <select
        style={{ marginBottom: '10px', padding: '5px' }}
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="cpp">C++</option>
      </select>

      <Editor
        height="80vh"
        language={language}
        theme="vs-dark"
        defaultValue="// Yahan code likhein..."
        onMount={handleEditorDidMount}
      />
    </div>
  );
}

export default App;