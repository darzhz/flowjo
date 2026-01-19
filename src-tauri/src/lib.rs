pub mod workflow;
use workflow::{Flow, WorkflowEngine};
use std::fs;
use std::collections::HashMap;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn execute_flow(flow: Flow, env: HashMap<String, String>) -> Result<(HashMap<String, workflow::ExecutionResult>, HashMap<String, serde_json::Value>), String> {
    let engine = WorkflowEngine::new();
    // Convert HashMap<String, String> to HashMap<String, Value> for internal engine
    let mut variables: HashMap<String, serde_json::Value> = HashMap::new();
    for (k, v) in env {
        variables.insert(k, serde_json::Value::String(v));
    }
    
    engine.execute(&flow, variables).await.map_err(|e| e.to_string())
}

#[tauri::command]
fn save_flow(path: String, flow: Flow) -> Result<(), String> {
    let data = serde_json::to_string_pretty(&flow).map_err(|e| e.to_string())?;
    fs::write(path, data).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_flow(path: String) -> Result<Flow, String> {
    let data = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RequestTemplate {
    pub id: String,
    pub name: String,
    pub method: String,
    pub endpoint: String,
    pub headers: Option<serde_json::Value>,
    pub body: Option<serde_json::Value>,
    pub params: Option<serde_json::Value>,
}

#[tauri::command]
fn save_request_template(template: RequestTemplate) -> Result<(), String> {
    let path = "requests.json";
    let mut templates: Vec<RequestTemplate> = if let Ok(data) = fs::read_to_string(path) {
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        Vec::new()
    };

    if let Some(idx) = templates.iter().position(|t| t.id == template.id) {
        templates[idx] = template;
    } else {
        templates.push(template);
    }

    let data = serde_json::to_string_pretty(&templates).map_err(|e| e.to_string())?;
    fs::write(path, data).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_request_templates() -> Result<Vec<RequestTemplate>, String> {
    let path = "requests.json";
    if let Ok(data) = fs::read_to_string(path) {
         serde_json::from_str(&data).map_err(|e| e.to_string())
    } else {
        Ok(Vec::new())
    }
}

#[tauri::command]
fn save_environment(env: HashMap<String, String>) -> Result<(), String> {
    let data = serde_json::to_string_pretty(&env).map_err(|e| e.to_string())?;
    fs::write("env.json", data).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_environment() -> Result<HashMap<String, String>, String> {
    if let Ok(data) = fs::read_to_string("env.json") {
        serde_json::from_str(&data).map_err(|e| e.to_string())
    } else {
        Ok(HashMap::new())
    }
}

#[tauri::command]
fn list_flows() -> Result<Vec<String>, String> {
    let mut files = Vec::new();
    
    // Helper to scan dir
    let scan = |dir: &str| -> Vec<String> {
        let mut f = Vec::new();
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.filter_map(Result::ok) {
                let path = entry.path();
                if path.extension().and_then(|s| s.to_str()) == Some("json") {
                    if let Some(p) = path.to_str() {
                        f.push(p.to_string());
                    }
                }
            }
        }
        f
    };

    files.extend(scan("."));
    files.extend(scan("tests"));
    
    Ok(files)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet, 
            execute_flow, 
            save_flow, 
            load_flow, 
            save_request_template, 
            load_request_templates,
            save_environment,
            load_environment,
            list_flows
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
