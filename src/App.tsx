import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import ApiFlow from "./components/ApiFlow";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
      <ApiFlow />
  );
}

export default App;
