# Gemini Project: FlowJo

This document provides context for the FlowJo project, a visual flow-based testing utility for integration testing, similar to Postman's flow feature.

## Project Overview

FlowJo is a desktop application built with Tauri that allows users to create, test, and manage API workflows visually. Users can build complex integration tests by arranging and connecting different nodes, such as HTTP requests, conditional logic, and data manipulation nodes.

**Key Architecture Change:**
The application has been re-architected to move the flow execution logic from the frontend to the backend (Rust). This ensures better performance, reliable HTTP request handling (avoiding CORS issues), and proper file persistence.

## Architecture

-   **Frontend (React + ReactFlow):**
    -   Handles the visual node editor and user interactions.
    -   Sends the flow definition (nodes and edges) to the backend for execution.
    -   Displays execution results returned by the backend.
-   **Backend (Rust + Tauri):**
    -   `execute_flow`: Takes the flow graph, topologically sorts it, and executes nodes (HTTP requests, logic) in order.
    -   `save_flow` / `load_flow`: Manages persistence of flow files (`.json`) to the local filesystem.
    -   Uses `reqwest` for robust HTTP client capabilities.

## Tech Stack

-   **Desktop Framework:** [Tauri](https://tauri.app/) (v2)
-   **Backend Language:** [Rust](https://www.rust-lang.org/)
    -   Crates: `reqwest`, `serde`, `tokio`, `anyhow`
-   **Frontend Framework:** [React](https://reactjs.org/)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **UI Library:** [React Flow](https://reactflow.dev/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
    -   Uses Glassmorphism and Dark Mode by default.
-   **Build Tool:** [Vite](https://vitejs.dev/)
-   **Package Manager:** [npm](https://www.npmjs.com/)

## Project Structure

-   `src/`: Contains the frontend React application.
    -   `src/components/nodes/`: Custom flow nodes (HttpRequest, Debug, etc.).
    -   `src/components/FlowControlsDock.tsx`: Floating dock for Run/Save/Load actions.
-   `src-tauri/`: Contains the backend Rust application.
    -   `src-tauri/src/lib.rs`: Exposes Tauri commands.
    -   `src-tauri/src/workflow.rs`: **Core execution engine logic.**
-   `tests/`: Contains example flow JSON files for testing.

## Development Setup

To run the application in development mode, you need to have Node.js and Rust installed.

1.  **Install dependencies:**
    ```bash
    npm install
    # Rust dependencies are automatically handled by cargo
    ```

2.  **Run the application:**
    ```bash
    npm run tauri dev
    ```

This command will start the Vite development server for the frontend and build and run the Tauri application.

3.  **Build for Production:**
    ```bash
    npm run tauri build
    ```

## CLI Flow Runner (Testing)

A standalone binary is available for running flows from the command line, useful for automated testing.

```bash
# Build the runner
cargo build --bin flowjo-runner

# Run a flow
./src-tauri/target/debug/flowjo-runner --file tests/simple_flow.json
```

## Request Management

You can save common HTTP requests as templates to reuse them later.

1.  **Save as Template**: In the HTTP Request Edit panel, click "Save as Template" and give it a name.
2.  **Load Template**: Use the "Load Template" dropdown in the Edit panel (Settings tab) to populate the node with a saved configuration.
3.  Templates are stored in `requests.json`.

## Environment & Token Management

You can manage global variables (like API Keys, Base URLs) using the **Settings (Gear Icon)** in the bottom dock.

1.  **Define Variables**: Add key-value pairs (e.g., `API_KEY` = `12345`).
2.  **Usage**: In any node (including HTTP Requests), use `{{API_KEY}}`.
3.  **Persistence**: Variables are stored in `env.json`.

## Node Guide

### Core Nodes
- **Start Node**: The entry point of your flow. Connect this to the first node you want to execute.
- **Input Block**: Define variables (String, Number, JSON) that can be used by other nodes.
- **Output Block**: Final output for the flow.
- **Display Block**: Useful for debugging, shows any data passed into it.

### Data Nodes
- **Capture Block**: Extracts values from previous JSON outputs using dot notation (e.g., `data.user.id`) and saves them to a variable.
- **Variables**: Variables saved by the Capture block can be used in other nodes using `{{variableName}}` syntax.
    - Example: Capture `userId`. Use in HTTP Request URL: `https://api.com/users/{{userId}}`.

### Logic Nodes
- **Conditional**: Checks a value against a target (Equal, Greater, Contains) and branches flow execution to "True" or "False" paths.
- **Loop (ForEach)**: Iterates over an array. 
    - **Input**: Connect an array output here.
    - **Body**: Connect the nodes to run for *each item*.
    - **Done**: Connect nodes to run after the loop finishes.
    - **Important**: The end of your "Body" chain must loop back to the **Input** handle of the Loop node to signal the next iteration!

### Network Nodes
- **HTTP Request**: Performs REST API calls. 
    - **Method**: GET, POST, PUT, DELETE, PATCH.
    - **Endpoint**: Supports variables (e.g., `{{userId}}`).
    - **Headers**: Add custom headers (supports variables).
    - **Body**: Send JSON payload (supports variables).

### Data Nodes
- **Tabulize**: Displays array data in a clean table format.
