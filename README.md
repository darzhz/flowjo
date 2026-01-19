# FlowJo 🌊

FlowJo is a high-performance, visual API workflow builder built with **Tauri**, **Rust**, and **React**. It allows you to design complex HTTP request chains, process data with logic nodes, and automate API testing through a beautiful node-based interface.

## 🚀 Features

- **Visual Canvas**: Drag-and-drop workflow builder powered by React Flow.
- **Rust Engine**: Extremely fast workflow execution backend.
- **Live State**: Inspect captured variables and runtime data in real-time.
- **Dark Mode**: Premium glassmorphism aesthetic for focused development.
- **CLI Runner**: Execute your `.json` flows headlessly for CI/CD or automation.

## 🧩 Node Types

| Category | Nodes | Description |
| :--- | :--- | :--- |
| **Network** | `HTTP Request` | Full-featured client with Methods, Params, Headers, and JSON Body. |
| **Logic** | `Conditional`, `Loop (ForEach)`, `Case Success`, `Case Fail` | Route your flow based on data or iterate over arrays. |
| **Data** | `Capture Block`, `Value Mapper`, `Value Selector` | Extract data from responses and transform it using lookup tables. |
| **I/O** | `Start`, `Input`, `Output`, `Display`, `Tabulize` | Define triggers, manual inputs, and visual data formatters. |

## 🛠️ Getting Started

### Prerequisites

- **Rust**: [Install Rust](https://www.rust-lang.org/tools/install)
- **Node.js**: v18+ [Install Node.js](https://nodejs.org/)
- **System Dependencies** (for Tauri): [Prerequisites guide](https://tauri.app/v1/guides/getting-started/prerequisites)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/flowjo.git
   cd flowjo
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

## 💻 Development & Build

### Run regular development mode:
```bash
npm run tauri dev
```

### Build for production:
```bash
npm run tauri build
```

## 🧪 Testing

### Running UI Flows
1. Launch the app in dev mode.
2. Open the **sidebar** (left side).
3. Load a test flow from the `tests/` directory (e.g., `weather_challenge.json`).
4. Click the **Play** button in the floating dock.

### Headless CLI Execution
FlowJo includes a standalone Rust runner for executing flows without a GUI:
```bash
cd src-tauri
cargo run --bin flowjo-runner -- -f ../tests/simple_flow.json
```

## 🏗️ Technical Stack

- **Frontend**: React (Typescript), Vite, React Flow, Shadcn UI, Tailwind CSS.
- **Backend**: Rust, Tauri, Reqwest, Tokio.
- **State**: Variable Store (Rust-side), React state (UI-side).

---
*Created with ❤️ by Darsh*
