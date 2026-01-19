use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use anyhow::Result;
use reqwest::Client;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

impl Default for Position {
    fn default() -> Self {
        Self { x: 0.0, y: 0.0 }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Node {
    pub id: String,
    #[serde(rename = "type")]
    pub node_type: String,
    #[serde(default)]
    pub position: Position,
    pub data: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Edge {
    pub id: String,
    pub source: String,
    pub target: String,
    #[serde(rename = "sourceHandle")]
    pub source_handle: Option<String>,
    #[serde(rename = "targetHandle")]
    pub target_handle: Option<String>,
    #[serde(default)]
    pub animated: bool,
    pub style: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Flow {
    pub nodes: Vec<Node>,
    pub edges: Vec<Edge>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub node_id: String,
    pub status: String, // "success", "error"
    pub output: serde_json::Value,
    pub error: Option<String>,
    pub active_handle: Option<String>,
}

pub struct WorkflowEngine {
    client: Client,
}

impl WorkflowEngine {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
        }
    }

    pub async fn execute(&self, flow: &Flow, initial_variables: HashMap<String, serde_json::Value>) -> Result<(HashMap<String, ExecutionResult>, HashMap<String, serde_json::Value>)> {
        let mut results: HashMap<String, ExecutionResult> = HashMap::new();
        // ... same initialization ...
        let mut node_map: HashMap<String, &Node> = HashMap::new();
        let mut adj_list: HashMap<String, Vec<(&Edge, String)>> = HashMap::new();
        let mut rev_adj_list: HashMap<String, Vec<String>> = HashMap::new();

        for node in &flow.nodes {
            node_map.insert(node.id.clone(), node);
            adj_list.insert(node.id.clone(), Vec::new());
            rev_adj_list.insert(node.id.clone(), Vec::new());
        }

        for edge in &flow.edges {
            if let Some(neighbors) = adj_list.get_mut(&edge.source) {
                neighbors.push((edge, edge.target.clone()));
            }
            if let Some(parents) = rev_adj_list.get_mut(&edge.target) {
                parents.push(edge.source.clone());
            }
        }

        let mut queue: Vec<String> = flow.nodes.iter()
            .filter(|n| {
                 let incoming = rev_adj_list.get(&n.id).map(|v| v.len()).unwrap_or(0);
                 incoming == 0 || n.node_type == "start"
            })
            .map(|n| n.id.clone())
            .collect();
            
        queue.sort();
        queue.dedup();

        let mut visited_count: HashMap<String, usize> = HashMap::new();
        let mut variables: HashMap<String, serde_json::Value> = initial_variables;

        while let Some(node_id) = queue.pop() {
            *visited_count.entry(node_id.clone()).or_insert(0) += 1;
            if *visited_count.get(&node_id).unwrap() > 100 {
                continue; 
            }

            if let Some(node) = node_map.get(&node_id) {
                let result = self.execute_node(node, &results, &rev_adj_list, &mut variables).await;
                
                let res_clone = ExecutionResult {
                    node_id: result.node_id.clone(),
                    status: result.status.clone(),
                    output: result.output.clone(),
                    error: result.error.clone(),
                    active_handle: result.active_handle.clone(),
                };
                results.insert(node_id.clone(), res_clone);

                if let Some(neighbors) = adj_list.get(&node_id) {
                    for (edge, neighbor_id) in neighbors {
                        let should_dispatch = match &result.active_handle {
                            Some(handle) => edge.source_handle.as_deref() == Some(handle),
                            None => true 
                        };

                        if should_dispatch {
                            queue.push(neighbor_id.clone());
                        }
                    }
                }
            }
        }

        Ok((results, variables))
    }

    async fn execute_node(&self, node: &Node, prior_results: &HashMap<String, ExecutionResult>, rev_adj: &HashMap<String, Vec<String>>, variables: &mut HashMap<String, serde_json::Value>) -> ExecutionResult {
        match node.node_type.as_str() {
            "condition" => self.execute_condition_node(node, prior_results, rev_adj),
            "loop" => self.execute_loop_node(node, prior_results, rev_adj),
            "capture" => self.execute_capture_node(node, prior_results, rev_adj, variables),
            "input" => self.execute_input_node(node),
            "httpRequest" => self.execute_http_node(node, variables).await,
            "debug" => self.execute_debug_node(node, prior_results, rev_adj),
            "display" | "tabulize" | "valueselector" => self.execute_passthrough_node(node, prior_results, rev_adj),
            "start" | "output" => self.execute_passthrough_node(node, prior_results, rev_adj),
            "mapper" => self.execute_mapper_node(node, prior_results, rev_adj),
            "caseSuccess" => ExecutionResult {
                node_id: node.id.clone(),
                status: "success".to_string(),
                output: serde_json::json!({ "status": "completed" }),
                error: None,
                active_handle: None,
            },
            "caseFail" => ExecutionResult {
                node_id: node.id.clone(),
                status: "error".to_string(),
                output: serde_json::json!({ "status": "failed" }),
                error: Some("Explicit Failure Node Triggered".to_string()),
                active_handle: None,
            },
             _ => ExecutionResult {
                node_id: node.id.clone(),
                status: "skipped".to_string(),
                output: serde_json::json!({ "message": "Unknown node type" }),
                error: None,
                active_handle: None,
            },
        }
    }

    fn execute_input_node(&self, node: &Node) -> ExecutionResult {
        let val_str = node.data.get("value").and_then(|v| v.as_str()).unwrap_or("");
        let val_type = node.data.get("type").and_then(|v| v.as_str()).unwrap_or("string");
        
        let output_val = match val_type {
            "number" => {
                if let Ok(num) = val_str.parse::<f64>() {
                    serde_json::json!(num)
                } else {
                    serde_json::Value::String(val_str.to_string())
                }
            },
            "json" => {
                if let Ok(json_val) = serde_json::from_str::<serde_json::Value>(val_str) {
                    json_val
                } else {
                    serde_json::Value::String(val_str.to_string())
                }
            },
            _ => serde_json::Value::String(val_str.to_string()),
        };

        ExecutionResult {
            node_id: node.id.clone(),
            status: "success".to_string(),
            output: serde_json::json!({ "data": output_val }),
            error: None,
            active_handle: None,
        }
    }

    fn execute_condition_node(&self, node: &Node, prior_results: &HashMap<String, ExecutionResult>, rev_adj: &HashMap<String, Vec<String>>) -> ExecutionResult {
        let start_val = serde_json::Value::Null;
        let mut input_val = &start_val;
        
        if let Some(parents) = rev_adj.get(&node.id) {
            if let Some(first_parent) = parents.first() {
                if let Some(parent_res) = prior_results.get(first_parent) {
                    if let Some(d) = parent_res.output.get("data") {
                        input_val = d;
                    } else {
                        input_val = &parent_res.output;
                    }
                }
            }
        }

        let condition = node.data.get("condition").and_then(|v| v.as_str()).unwrap_or("equal");
        let target_val_str = node.data.get("targetValue").and_then(|v| v.as_str()).unwrap_or("");
        
        let input_str = input_val.as_str().map(|s| s.to_string()).unwrap_or_else(|| input_val.to_string());
        
        let is_true = match condition {
            "equal" => input_str == target_val_str,
            "notEqual" => input_str != target_val_str,
            "greaterThan" => input_str > target_val_str.to_string(),
            "lessThan" => input_str < target_val_str.to_string(),
            "contains" => input_str.contains(target_val_str),
            _ => false,
        };
        
        let active = if is_true { "true" } else { "false" };

        ExecutionResult {
            node_id: node.id.clone(),
            status: "success".to_string(),
            output: serde_json::json!({ "result": is_true, "input": input_val }),
            error: None,
            active_handle: Some(active.to_string()),
        }
    }
    
    fn execute_loop_node(&self, node: &Node, prior_results: &HashMap<String, ExecutionResult>, rev_adj: &HashMap<String, Vec<String>>) -> ExecutionResult {
        // Iterate on previous output index.
        let mut index = 0;
        if let Some(prev) = prior_results.get(&node.id) {
             index = prev.output.get("index").and_then(|v| v.as_u64()).unwrap_or(0) as usize + 1;
        }

        // Get Input Array
        let mut array_val = Vec::new();
        if let Some(parents) = rev_adj.get(&node.id) {
            for parent_id in parents {
                if let Some(res) = prior_results.get(parent_id) {
                    let val = res.output.get("data").unwrap_or(&res.output);
                    if let Some(arr) = val.as_array() {
                        if !arr.is_empty() {
                            array_val = arr.clone();
                            break; 
                        }
                    } else if let Some(arr) = res.output.as_array() {
                         if !arr.is_empty() {
                            array_val = arr.clone();
                            break; 
                        }
                    }
                }
            }
        }
        
        if index < array_val.len() {
            let item = &array_val[index];
            ExecutionResult {
                node_id: node.id.clone(),
                status: "success".to_string(),
                output: serde_json::json!({ "index": index, "item": item, "data": item }),
                error: None,
                active_handle: Some("body".to_string()),
            }
        } else {
             ExecutionResult {
                node_id: node.id.clone(),
                status: "success".to_string(),
                output: serde_json::json!({ "status": "done", "index": index }),
                error: None,
                active_handle: Some("done".to_string()),
            }
        }
    }

    fn execute_passthrough_node(&self, node: &Node, _prior_results: &HashMap<String, ExecutionResult>, _rev_adj: &HashMap<String, Vec<String>>) -> ExecutionResult {
        // Simple passthrough: look for upstream data or just succeed
        // In a real flow, we'd gather inputs from edges.
        // For now, these nodes (like Display) mostly consume data on the frontend or pass it along.
        // Returning success allows the flow to continue.
        ExecutionResult {
            node_id: node.id.clone(),
            status: "success".to_string(),
            output: serde_json::json!({ "status": "ok" }),
            error: None,
            active_handle: None,
        }
    }

    async fn execute_http_node(&self, node: &Node, variables: &HashMap<String, serde_json::Value>) -> ExecutionResult {
        let method = node.data.get("method").and_then(|v| v.as_str()).unwrap_or("GET");
        let mut url = node.data.get("endpoint").and_then(|v| v.as_str()).unwrap_or("").to_string();
        
        // Helper to substitute variables
        let substitute = |text: &str, vars: &HashMap<String, serde_json::Value>| -> String {
            let mut result = text.to_string();
            for (key, val) in vars {
                let placeholder = format!("{{{{{}}}}}", key);
                if result.contains(&placeholder) {
                    let val_str = val.as_str().map(|s| s.to_string()).unwrap_or_else(|| val.to_string());
                    result = result.replace(&placeholder, &val_str);
                }
            }
            result
        };

        url = substitute(&url, variables);

        let mut builder = match method {
            "GET" => self.client.get(&url),
            "POST" => self.client.post(&url),
            "PUT" => self.client.put(&url),
            "DELETE" => self.client.delete(&url),
            "PATCH" => self.client.patch(&url),
            _ => self.client.get(&url),
        };

        // Add Headers
        if let Some(headers) = node.data.get("headers").and_then(|h| h.as_object()) {
            for (k, v) in headers {
                if let Some(v_str) = v.as_str() {
                    let subbed_v = substitute(v_str, variables);
                    builder = builder.header(k, subbed_v);
                }
            }
        }

        // Add Body (if JSON)
        // Check content type. For now assuming mostly JSON or auto-detection if body is present
        if let Some(body) = node.data.get("body") {
            if body.is_object() || body.is_array() {
                // If it's already a JSON object in node.data, we might want to stringify -> substitute -> parse back?
                // Or just substitute values if they are strings.
                // For simplicity: stringify whole body, substitute, then parse back to json to send.
                let body_str = body.to_string();
                let subbed_body_str = substitute(&body_str, variables);
                if let Ok(parsed_body) = serde_json::from_str::<serde_json::Value>(&subbed_body_str) {
                    builder = builder.json(&parsed_body);
                } else {
                     // Fallback to text body if json parse fails?
                     builder = builder.body(subbed_body_str);
                }
            }
        }
        
        match builder.send().await {
            Ok(res) => {
                let status = res.status().as_u16();
                let body = res.json::<serde_json::Value>().await.ok();
                
                ExecutionResult {
                    node_id: node.id.clone(),
                    status: "success".to_string(),
                    output: serde_json::json!({
                        "status": status,
                        "data": body
                    }),
                    error: None,
                    active_handle: None,
                }
            }
            Err(e) => ExecutionResult {
                node_id: node.id.clone(),
                status: "error".to_string(),
                output: serde_json::Value::Null,
                error: Some(e.to_string()),
                active_handle: None,
            }
        }
    }

    fn execute_debug_node(&self, node: &Node, _prior_results: &HashMap<String, ExecutionResult>, _rev_adj: &HashMap<String, Vec<String>>) -> ExecutionResult {
        // Collect inputs from upstream? 
        ExecutionResult {
            node_id: node.id.clone(),
            status: "success".to_string(),
            output: serde_json::json!({ "connected_results": "TODO" }), 
            error: None,
            active_handle: None,
        }
    }

    fn execute_capture_node(&self, node: &Node, prior_results: &HashMap<String, ExecutionResult>, rev_adj: &HashMap<String, Vec<String>>, variables: &mut HashMap<String, serde_json::Value>) -> ExecutionResult {
        let path = node.data.get("path").and_then(|v| v.as_str()).unwrap_or("");
        let variable_name = node.data.get("variable").and_then(|v| v.as_str()).unwrap_or("");

        let mut input_val = &serde_json::Value::Null;
         if let Some(parents) = rev_adj.get(&node.id) {
            if let Some(first_parent) = parents.first() {
                if let Some(parent_res) = prior_results.get(first_parent) {
                    if let Some(d) = parent_res.output.get("data") {
                        input_val = d;
                    } else {
                        input_val = &parent_res.output;
                    }
                }
            }
        }

        let mut extracted = input_val;
        if !path.is_empty() {
            for part in path.split('.') {
                if let Some(val) = extracted.get(part) {
                    extracted = val;
                } else {
                    extracted = &serde_json::Value::Null;
                    break;
                }
            }
        }

        if !variable_name.is_empty() {
            variables.insert(variable_name.to_string(), extracted.clone());
        }

        ExecutionResult {
            node_id: node.id.clone(),
            status: "success".to_string(),
            output: serde_json::json!({ "variable": variable_name, "data": extracted }),
            error: None,
            active_handle: None,
        }
    }

    fn execute_mapper_node(&self, node: &Node, prior_results: &HashMap<String, ExecutionResult>, rev_adj: &HashMap<String, Vec<String>>) -> ExecutionResult {
        let mut input_val = &serde_json::Value::Null;
        if let Some(parents) = rev_adj.get(&node.id) {
            if let Some(first_parent) = parents.first() {
                if let Some(parent_res) = prior_results.get(first_parent) {
                    input_val = parent_res.output.get("data").unwrap_or(&parent_res.output);
                }
            }
        }

        let mapping = node.data.get("mapping").and_then(|m| m.as_object());
        let fallback = node.data.get("fallback").cloned().unwrap_or(serde_json::json!("Unknown"));

        let key = if input_val.is_number() {
            input_val.to_string()
        } else if let Some(s) = input_val.as_str() {
            s.to_string()
        } else {
            "".to_string()
        };

        let result = mapping
            .and_then(|m| m.get(&key))
            .cloned()
            .unwrap_or(fallback);

        ExecutionResult {
            node_id: node.id.clone(),
            status: "success".to_string(),
            output: serde_json::json!({ "data": result }),
            error: None,
            active_handle: None,
        }
    }
}
