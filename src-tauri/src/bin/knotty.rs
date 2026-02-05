use clap::{Parser, Subcommand};
use knotwork_lib::workflow::{Flow, WorkflowEngine};
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use axum::{
    extract::{State, Query},
    http::{StatusCode, HeaderMap},
    response::IntoResponse,
    routing::any,
    Router,
    body::Body,
};

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Execute a flow once (default)
    Run {
        /// Path to the flow JSON file
        #[arg(short, long)]
        file: Option<PathBuf>,
    },
    /// Start a mock server from a flow
    Serve {
        /// Path to the flow JSON file
        #[arg(short, long)]
        file: PathBuf,
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();

    println!(r#"
    ██╗  ██╗███╗   ██╗ ██████╗ ████████╗████████╗██╗   ██╗
    ██║ ██╔╝████╗  ██║██╔═══██╗╚══██╔══╝╚══██╔══╝╚██╗ ██╔╝
    █████╔╝ ██╔██╗ ██║██║   ██║   ██║      ██║    ╚████╔╝ 
    ██╔═██╗ ██║╚██╗██║██║   ██║   ██║      ██║     ╚██╔╝  
    ██║  ██╗██║ ╚████║╚██████╔╝   ██║      ██║      ██║   
    ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝    ╚═╝      ╚═╝      ╚═╝   
    "#);
    println!("--- Knotwork High-Performance Flow Engine ---\n");

    match cli.command {
        Some(Commands::Serve { file }) => {
            handle_serve(file).await?;
        },
        Some(Commands::Run { file }) => {
            handle_run(file).await?;
        },
        None => {
            handle_run(None).await?;
        }
    }

    Ok(())
}

async fn handle_run(file: Option<PathBuf>) -> anyhow::Result<()> {
    let flow_path = if let Some(path) = file {
        path
    } else {
        println!("\x1b[1;34m[INFO]\x1b[0m No file provided. Scanning for flows...");
        
        let mut flows = Vec::new();
        let scan_dirs = vec![".", "tests", "../tests"];
        
        for dir in scan_dirs {
            if let Ok(entries) = fs::read_dir(dir) {
                for entry in entries.filter_map(Result::ok) {
                    let path = entry.path();
                    if path.extension().and_then(|s| s.to_str()) == Some("json") {
                        flows.push(path);
                    }
                }
            }
        }

        if flows.is_empty() {
            anyhow::bail!("No .json flows found in current directory or tests folder.");
        }

        use dialoguer::{theme::ColorfulTheme, FuzzySelect};
        
        let selection = FuzzySelect::with_theme(&ColorfulTheme::default())
            .with_prompt("Select a flow to execute")
            .default(0)
            .items(&flows.iter().map(|p| p.display().to_string()).collect::<Vec<_>>())
            .interact()?;
            
        flows[selection].clone()
    };

    println!("\x1b[1;34m[INFO]\x1b[0m Loading flow from: {:?}", flow_path);

    let content = fs::read_to_string(&flow_path)?;
    let flow: Flow = serde_json::from_str(&content)?;

    println!("\x1b[1;34m[INFO]\x1b[0m Executing flow with {} nodes...", flow.nodes.len());

    let engine = WorkflowEngine::new();
    let (results, _variables) = engine.execute(&flow, std::collections::HashMap::new()).await?;

    println!("\x1b[1;32m[SUCCESS]\x1b[0m Execution Complete!");
    println!("\n--- Results ---");
    
    let mut has_error = false;
    for (node_id, result) in results {
        let status_color = if result.status == "success" { "\x1b[32m" } else { "\x1b[31m" };
        println!("\x1b[1mNode {}\x1b[0m: Status: {}{}\x1b[0m", node_id, status_color, result.status);
        if result.status == "error" {
            has_error = true;
            println!("  \x1b[31mError:\x1b[0m {:?}", result.error);
        } else {
             let out_str = result.output.to_string();
             if out_str.len() > 120 {
                 println!("  Output: {}...", &out_str[0..120]);
             } else {
                 println!("  Output: {}", out_str);
             }
        }
    }
    println!("---------------\n");

    println!("---------------\n");
    if has_error {
        std::process::exit(1);
    }
    Ok(())
}

async fn handle_serve(file: PathBuf) -> anyhow::Result<()> {
    println!("\x1b[1;34m[INFO]\x1b[0m Loading flow for server mode from: {:?}", file);
    let content = fs::read_to_string(&file)?;
    let flow: Flow = serde_json::from_str(&content)?;

    // Find ServerTrigger node to get config
    let trigger_node = flow.nodes.iter().find(|n| n.node_type == "serverTrigger");
    
    let (port, method, path) = if let Some(node) = trigger_node {
        let port = node.data.get("port").and_then(|v| v.as_i64()).unwrap_or(3000) as u16;
        let method = node.data.get("method").and_then(|v| v.as_str()).unwrap_or("GET").to_string();
        let path = node.data.get("path").and_then(|v| v.as_str()).unwrap_or("/webhook").to_string();
        (port, method, path)
    } else {
        anyhow::bail!("No 'serverTrigger' node found in the flow. Cannot start server.");
    };

    println!("\x1b[1;32m[START]\x1b[0m Starting Mock Server on path {} with method {} on port {}", path, method, port);

    // Create shared state
    let state = Arc::new(flow);

    let app = Router::new()
        .route(&path, any(handle_request))
        .with_state(state);
        
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

// Handler for the server
async fn handle_request(
    State(flow): State<Arc<Flow>>,
    method: axum::http::Method,
    Query(params): Query<std::collections::HashMap<String, String>>,
    // Headers? Body? For now keeping it simple.
    // If we want body, we need to extract Bytes or Json.
    body: axum::body::Bytes,
) -> impl IntoResponse {
    let body_str = String::from_utf8_lossy(&body).to_string();
    
    // Inject request data into the flow execution context
    // We need to pre-populate map with the 'serverTrigger' output so subsequent nodes can use it.
    let trigger_node = flow.nodes.iter().find(|n| n.node_type == "serverTrigger").unwrap();
    
    let mut initial_results = std::collections::HashMap::new();
    
    use knotwork_lib::workflow::ExecutionResult;
    
    initial_results.insert(trigger_node.id.clone(), ExecutionResult {
        node_id: trigger_node.id.clone(),
        status: "success".to_string(),
        output: serde_json::json!({
            "method": method.to_string(),
            "query": params,
            "body": body_str,
            // "headers": ...
        }),
        error: None,
        active_handle: None,
    });

    println!("-> request received: {} {}", method, flow.nodes.len());

    let engine = WorkflowEngine::new();
    // We need a way to pass initial_results to execute. 
    // Currently execute() creates its own results map. 
    // Wait, check workflow.rs signature. 
    // pub async fn execute(&self, flow: &Flow, variables: HashMap<String, serde_json::Value>) -> Result<(HashMap<String, ExecutionResult>, ...)>
    // It doesn't accept initial results, but it accepts 'variables'. 
    // Maybe we can pass request data as global variables?
    // OR we change execute() to accept initial_results?
    
    // Changing execute() is invasive.
    // Alternative: Create a "ServerTrigger" execution logic inside workflow.rs that READS from variables if present?
    // "serverTrigger" node: if variables["_request_context"] exists, use it as output.
    
    // Let's pass it as variables for now.
    let mut variables = std::collections::HashMap::new();
    variables.insert("req_method".to_string(), serde_json::Value::String(method.to_string()));
    variables.insert("req_body".to_string(), serde_json::Value::String(body_str));
    variables.insert("req_query".to_string(), serde_json::json!(params));
    
    // But how does 'serverTrigger' node gets this? simple, we just said serverTrigger is pass-through.
    // Actually, if we make serverTrigger output this data, we need to modify execute_passthrough or execute_server_trigger to look at variables.
    
    // Let's assume for now we just use 'get_variable_as_array' or similar in subsequent nodes? 
    // No, users expect to connect Trigger -> ...
    // So Trigger MUST produce output.
    
    // HACK: We can't easily inject result. 
    // Proper fix: modify `execute` in `workflow.rs` (it's in lib) to take optional initial state?
    // Or just modify `serverTrigger` execution in `workflow.rs` to pull from variables!
    // Yes.
    
    match engine.execute(&flow, variables).await {
        Ok((results, _)) => {
            // Find serverResponse node result
            if let Some((_, res)) = results.iter().find(|(id, _)| {
               if let Some(n) = flow.nodes.iter().find(|n| &n.id == *id) {
                   n.node_type == "serverResponse"
               } else { false }
            }) {
                // Extract status and body
                if let Some(resp_obj) = res.output.get("server_response") {
                     let status_code = resp_obj.get("status").and_then(|v| v.as_i64()).unwrap_or(200) as u16;
                     let body_content = resp_obj.get("body").cloned().unwrap_or(serde_json::Value::Null);
                     
                     let final_body = if body_content.is_string() {
                         body_content.as_str().unwrap().to_string()
                     } else {
                         body_content.to_string()
                     };
                     
                     return (
                         StatusCode::from_u16(status_code).unwrap_or(StatusCode::OK), 
                         final_body
                     ).into_response();
                }
            }
            
            // Default response if no ServerResponse node
            (StatusCode::OK, "Flow executed, but no ServerResponse node found.".to_string()).into_response()
        },
        Err(e) => {
            (StatusCode::INTERNAL_SERVER_ERROR, format!("Flow execution failed: {}", e)).into_response()
        }
    }
}
