import React from 'react';
import Editor from '@monaco-editor/react';

export default function CodeEditor() {
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        defaultValue="// Write your code here"
        theme="vs-dark"
      />
    </div>
  );
}