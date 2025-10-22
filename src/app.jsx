// src/app.jsx
import DocumentEditor from "./components/document-editor.jsx";
import "./app.css";

function App() {
  console.log("App component rendered");

  return (
    <div className="app">
      <DocumentEditor />
    </div>
  );
}

export default App;
