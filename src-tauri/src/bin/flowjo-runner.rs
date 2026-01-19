use clap::Parser;
use flowjo_lib::workflow::{Flow, WorkflowEngine};
use std::fs;
use std::path::PathBuf;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Path to the flow JSON file
    #[arg(short, long)]
    file: PathBuf,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args = Args::parse();

    println!("Loading flow from: {:?}", args.file);

    let content = fs::read_to_string(&args.file)?;
    let flow: Flow = serde_json::from_str(&content)?;

    println!("Executing flow with {} nodes...", flow.nodes.len());

    let engine = WorkflowEngine::new();
    let (results, _variables) = engine.execute(&flow, std::collections::HashMap::new()).await?;

    println!("Execution Complete!");
    println!("Results:");
    
    for (node_id, result) in results {
        println!("Node {}: Status: {}", node_id, result.status);
        if result.status == "error" {
            println!("  Error: {:?}", result.error);
        } else {
             // Truncate output for display
             let out_str = result.output.to_string();
             if out_str.len() > 100 {
                 println!("  Output: {}...", &out_str[0..100]);
             } else {
                 println!("  Output: {}", out_str);
             }
        }
    }

    Ok(())
}
