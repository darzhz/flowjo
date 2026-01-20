use clap::Parser;
use flowjo_lib::workflow::{Flow, WorkflowEngine};
use std::fs;
use std::path::PathBuf;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Path to the flow JSON file
    #[arg(short, long)]
    file: Option<PathBuf>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args = Args::parse();

    println!(r#"
    ███████╗██╗      ██████╗ ██╗    ██╗     ██╗ ██████╗ 
    ██╔════╝██║     ██╔═══██╗██║    ██║     ██║██╔═══██╗
    █████╗  ██║     ██║   ██║██║ █╗ ██║     ██║██║   ██║
    ██╔══╝  ██║     ██║   ██║██║███╗██║██   ██║██║   ██║
    ██║     ███████╗╚██████╔╝╚███╔███╔╝╚██████╔╝╚██████╔╝
    ╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝  ╚═════╝  ╚═════╝ 
    "#);
    println!("--- High-Performance API Workflow Engine ---\n");

    let flow_path = if let Some(path) = args.file {
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
    
    for (node_id, result) in results {
        let status_color = if result.status == "success" { "\x1b[32m" } else { "\x1b[31m" };
        println!("\x1b[1mNode {}\x1b[0m: Status: {}{}\x1b[0m", node_id, status_color, result.status);
        if result.status == "error" {
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

    Ok(())
}
