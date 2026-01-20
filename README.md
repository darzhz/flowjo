# FlowJo 🌊

FlowJo is a high-performance, visual API workflow builder built with **Tauri**, **Rust**, and **React**. It allows you to design complex HTTP request chains, process data with logic nodes, and automate API testing through a beautiful node-based interface.

## 🚀 Features

- **Visual Canvas**: Drag-and-drop workflow builder powered by React Flow.
- **Rust Engine**: Extremely fast workflow execution backend.
- **Workspace Selection**: Open any folder to manage and load your flows directly.
- **Live State**: Inspect captured variables and runtime data in real-time.
- **Dark Mode**: Premium glassmorphism aesthetic for focused development.
- **CLI Runner**: Execute your `.json` flows headlessly with an interactive menu.

## 🧩 Node Types

| Category | Nodes | Description |
| :--- | :--- | :--- |
| **Network** | `HTTP Request` | Full-featured client with Methods, Params, Headers, and JSON Body. |
| **Logic** | `Conditional`, `Loop`, `Capture`, `Case` | Advanced routing including ForEach loops and JSONPath extraction. |
| **Data** | `Value Mapper`, `Variable Op` | Transform data using lookups or perform math/assignments on variables. |
| **I/O** | `Start`, `Input`, `Output`, `Display` | Triggers, manual inputs, and visual result formatters. |

## 🛠️ Getting Started

### Prerequisites

- **Rust**: [Install Rust](https://www.rust-lang.org/tools/install)
- **Node.js**: v18+ [Install Node.js](https://nodejs.org/)
- **System Dependencies**: Required for Tauri (e.g., `libwebkit2gtk-4.0-dev` on Linux).

### Installation (Development)

1. Clone and enter:
   ```bash
   git clone https://github.com/your-username/flowjo.git && cd flowjo
   ```
2. Install & Run:
   ```bash
   npm install
   npm run tauri dev
   ```

### Installation (Production)

To build both the high-performance GUI app and the headless runner:

1. **Build the App**:
   ```bash
   npm run tauri build
   ```
2. **Build the Runner**:
   ```bash
   cd src-tauri
   cargo build --release --bin flowjo-runner
   ```

The GUI executable will be in `src-tauri/target/release/flowjo` (or inside the generated installer), and the CLI runner will be at `src-tauri/target/release/flowjo-runner`.

> [!TIP]
> You can install the runner globally using `cargo install --path src-tauri --bin flowjo-runner` to use it from any directory.

## 🧪 Headless CLI Runner

FlowJo includes an interactive Rust runner for CI/CD or fast testing without the GUI.

### Interactive Mode:
Just run the binary without arguments to see a searchable list of flows in your current directory and `tests/` folder.
```bash
cargo run --bin flowjo-runner
```

### Direct Mode:
```bash
cargo run --bin flowjo-runner -- -f tests/weather_challenge.json
```

## 🏗️ Technical Stack

- **Frontend**: React, React Flow, Lucide, Framer Motion.
- **Backend**: Rust, Tauri 2.0, Reqwest, Tokio.
- **CLI**: Clap, Dialoguer (Fuzzy Select).

---
*Created with ❤️ by Darsh*
