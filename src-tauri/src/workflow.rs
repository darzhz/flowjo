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
            if *visited_count.get(&node_id).unwrap() > 10000 {
                continue; 
            }

// ... (inside execute loop)

                if let Some(node) = node_map.get(&node_id) {
                    let result = self.execute_node(node, &results, &rev_adj_list, &mut variables).await;
                    
                    // ... result storage ...
                    let res_clone = ExecutionResult {
                        node_id: result.node_id.clone(),
                        status: result.status.clone(),
                        output: result.output.clone(),
                        error: result.error.clone(),
                        active_handle: result.active_handle.clone(),
                    };
                    results.insert(node_id.clone(), res_clone);

                    // Re-queue loop node if it's continuing
                    if node.node_type == "loop" {
                        if let Some(handle) = &result.active_handle {
                            if handle == "body" {
                                queue.push(node_id.clone());
                            }
                        }
                    }

                    if let Some(neighbors) = adj_list.get(&node_id) {
                        for (edge, neighbor_id) in neighbors {
// ...
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
            "counter" => self.execute_counter_node(node, prior_results, rev_adj, variables),
            "input" => self.execute_input_node(node, variables),
            "httpRequest" => self.execute_http_node(node, variables).await,
            "debug" => self.execute_debug_node(node, prior_results, rev_adj),
            "carousel" => self.execute_passthrough_node(node, prior_results, rev_adj), 
            "start" | "output" | "comment" | "group" => self.execute_passthrough_node(node, prior_results, rev_adj),
            "serverTrigger" => self.execute_server_trigger_node(node, variables),
            "serverResponse" => self.execute_server_response_node(node, prior_results, rev_adj, variables),
            "mapper" => self.execute_mapper_node(node, prior_results, rev_adj),
            "scraper" => self.execute_scraper_node(node, prior_results, rev_adj),
            "filter" => self.execute_filter_node(node, prior_results, rev_adj),
            "arrayMap" => self.execute_array_map_node(node, prior_results, rev_adj),
            "assert" => self.execute_assert_node(node, prior_results, rev_adj),

            // Remainder are skipped or unknown
             _ => ExecutionResult {
                node_id: node.id.clone(),
                status: "skipped".to_string(),
                output: serde_json::json!({ "message": "Unknown node type" }),
                error: None,
                active_handle: None,
            },
        }
    }



    fn execute_scraper_node(&self, node: &Node, prior_results: &HashMap<String, ExecutionResult>, rev_adj: &HashMap<String, Vec<String>>) -> ExecutionResult {
        let input_html = if let Some(parents) = rev_adj.get(&node.id) {
            parents.first().and_then(|id| prior_results.get(id)).and_then(|res| {
                res.output.get("data").and_then(|d| d.as_str()).or_else(|| res.output.as_str())
            }).unwrap_or("")
        } else {
            ""
        };

        if input_html.is_empty() {
            return ExecutionResult {
                node_id: node.id.clone(),
                status: "success".to_string(),
                output: serde_json::json!({ "items": [] }),
                error: None,
                active_handle: None,
            };
        }

        let document = scraper::Html::parse_document(input_html);
        let rules = node.data.get("rules").and_then(|r| r.as_array());
        
        // Universal Scraping: List or Single Item
        // If "container_selector" is present, we extract multiple items.
        let container_selector_str = node.data.get("container_selector").and_then(|s| s.as_str()).unwrap_or("");
        
        let mut results = Vec::new();

        if !container_selector_str.is_empty() {
             if let Ok(selector) = scraper::Selector::parse(container_selector_str) {
                 for element in document.select(&selector) {
                     let mut item = serde_json::Map::new();
                     if let Some(extraction_rules) = rules {
                         for rule in extraction_rules {
                             let sel_str = rule.get("selector").and_then(|s| s.as_str()).unwrap_or("");
                             let attr = rule.get("attribute").and_then(|s| s.as_str()).unwrap_or("text");
                             let key = rule.get("key").and_then(|s| s.as_str()).unwrap_or("value");
                             
                             if let Ok(inner_sel) = scraper::Selector::parse(sel_str) {
                                  if let Some(inner_el) = element.select(&inner_sel).next() {
                                      let val = if attr == "text" {
                                          inner_el.text().collect::<Vec<_>>().join(" ").trim().to_string()
                                      } else {
                                          inner_el.value().attr(attr).unwrap_or("").to_string()
                                      };
                                      item.insert(key.to_string(), serde_json::json!(val));
                                  }
                             }
                         }
                     }
                     if !item.is_empty() {
                        results.push(serde_json::Value::Object(item));
                     }
                 }
             }
        } else {
            // Single object extraction from root
            let mut item = serde_json::Map::new();
            if let Some(extraction_rules) = rules {
                for rule in extraction_rules {
                    let sel_str = rule.get("selector").and_then(|s| s.as_str()).unwrap_or("");
                    let attr = rule.get("attribute").and_then(|s| s.as_str()).unwrap_or("text");
                    let key = rule.get("key").and_then(|s| s.as_str()).unwrap_or("value");
                    
                    if let Ok(sel) = scraper::Selector::parse(sel_str) {
                         if let Some(el) = document.select(&sel).next() {
                             let val = if attr == "text" {
                                 el.text().collect::<Vec<_>>().join(" ").trim().to_string()
                             } else {
                                 el.value().attr(attr).unwrap_or("").to_string()
                             };
                             item.insert(key.to_string(), serde_json::json!(val));
                         }
                    }
                }
            }
            if !item.is_empty() {
                results.push(serde_json::Value::Object(item));
            }
        }

        ExecutionResult {
            node_id: node.id.clone(),
            status: "success".to_string(),
            output: serde_json::json!({ "items": results, "data": results }),
            error: None,
            active_handle: None,
        }
    }

    fn execute_filter_node(&self, node: &Node, prior_results: &HashMap<String, ExecutionResult>, rev_adj: &HashMap<String, Vec<String>>) -> ExecutionResult {
        let input_val = if let Some(parents) = rev_adj.get(&node.id) {
             parents.first().and_then(|id| prior_results.get(id)).and_then(|res| {
                 res.output.get("data").or_else(|| Some(&res.output))
             })
        } else {
            None
        };

        if input_val.is_none() {
             return ExecutionResult {
                node_id: node.id.clone(),
                status: "success".to_string(),
                output: serde_json::json!({ "items": [], "total": 0, "data": [] }),
                error: None,
                active_handle: None,
            };
        }

        let val = input_val.unwrap();
        let array = if let Some(arr) = val.as_array() {
            arr.clone()
        } else {
            vec![val.clone()]
        };

        let property = node.data.get("property").and_then(|p| p.as_str()).unwrap_or("");
        let condition = node.data.get("condition").and_then(|c| c.as_str()).unwrap_or("equals");
        let query_value = node.data.get("value").and_then(|v| v.as_str()).unwrap_or("");

        let mut filtered = Vec::new();
        for item in array {
            let item_prop = if property.is_empty() {
                Some(item.clone())
            } else {
                item.get(property).cloned()
            };

            let matches = match condition {
                "exists" => item_prop.is_some() && !item_prop.as_ref().unwrap().is_null(),
                "notExists" => item_prop.is_none() || item_prop.as_ref().unwrap().is_null(),
                _ => {
                    let item_str = item_prop.map(|v| {
                        if v.is_string() { v.as_str().unwrap().to_string() } else { v.to_string() }
                    }).unwrap_or_else(|| "".to_string());

                    match condition {
                        "equals" => item_str == query_value,
                        "notEquals" => item_str != query_value,
                        "contains" => item_str.contains(query_value),
                        "regex" => {
                            if let Ok(re) = regex::Regex::new(query_value) {
                                re.is_match(&item_str)
                            } else {
                                false
                            }
                        },
                        "extension" => {
                            let exts: Vec<&str> = query_value.split(',').map(|s| s.trim()).collect();
                            exts.iter().any(|&e| item_str.ends_with(e))
                        },
                        _ => false,
                    }
                }
            };

            if matches {
                filtered.push(item);
            }
        }

        ExecutionResult {
            node_id: node.id.clone(),
            status: "success".to_string(),
            output: serde_json::json!({ "items": filtered, "total": filtered.len(), "data": filtered }),
            error: None,
            active_handle: None,
        }
    }

    fn execute_array_map_node(&self, node: &Node, prior_results: &HashMap<String, ExecutionResult>, rev_adj: &HashMap<String, Vec<String>>) -> ExecutionResult {
        let input_val = if let Some(parents) = rev_adj.get(&node.id) {
             parents.first().and_then(|id| prior_results.get(id)).and_then(|res| {
                 res.output.get("data").or_else(|| Some(&res.output))
             })
        } else {
            None
        };

        if input_val.is_none() {
             return ExecutionResult {
                node_id: node.id.clone(),
                status: "success".to_string(),
                output: serde_json::json!({ "items": [], "total": 0, "data": [] }),
                error: None,
                active_handle: None,
            };
        }

        let val = input_val.unwrap();
        let array = if let Some(arr) = val.as_array() {
            arr.clone()
        } else {
            vec![val.clone()]
        };

        let path = node.data.get("path").and_then(|p| p.as_str()).unwrap_or("");
        
        let mut results = Vec::new();
        for item in array {
            let mut extracted = item.clone();
            if !path.is_empty() {
                for part in path.split('.') {
                    if let Some(val) = extracted.get(part) {
                        extracted = val.clone();
                    } else {
                        extracted = serde_json::Value::Null;
                        break;
                    }
                }
            }
            if !extracted.is_null() {
                results.push(extracted);
            }
        }

        ExecutionResult {
            node_id: node.id.clone(),
            status: "success".to_string(),
            output: serde_json::json!({ "items": results, "total": results.len(), "data": results }),
            error: None,
            active_handle: None,
        }
    }

    fn substitute(&self, text: &str, vars: &HashMap<String, serde_json::Value>) -> String {
        let mut result = text.to_string();
        for (key, val) in vars {
            let placeholder = format!("{{{{{}}}}}", key);
            if result.contains(&placeholder) {
                let val_str = if val.is_string() {
                    val.as_str().unwrap().to_string()
                } else {
                    val.to_string()
                };
                result = result.replace(&placeholder, &val_str);
            }
        }
        result
    }

    fn execute_input_node(&self, node: &Node, variables: &HashMap<String, serde_json::Value>) -> ExecutionResult {
        let raw_val = node.data.get("value").and_then(|v| v.as_str()).unwrap_or("");
        let val_str = self.substitute(raw_val, variables);
        let val_type = node.data.get("type").and_then(|v| v.as_str()).unwrap_or("string");
        
        let output_val = match val_type {
            "number" => {
                if let Ok(num) = val_str.parse::<f64>() {
                    serde_json::json!(num)
                } else {
                    serde_json::Value::String(val_str)
                }
            },
            "json" => {
                if let Ok(json_val) = serde_json::from_str::<serde_json::Value>(&val_str) {
                    json_val
                } else {
                    serde_json::Value::String(val_str)
                }
            },
            _ => serde_json::Value::String(val_str),
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
        
        let is_true = if let (Some(iv), Ok(tv)) = (input_val.as_f64().or_else(|| input_str.parse::<f64>().ok()), target_val_str.parse::<f64>()) {
            match condition {
                "equal" => (iv - tv).abs() < f64::EPSILON,
                "notEqual" => (iv - tv).abs() >= f64::EPSILON,
                "greaterThan" => iv > tv,
                "lessThan" => iv < tv,
                _ => false,
            }
        } else {
            match condition {
                "equal" => input_str == target_val_str,
                "notEqual" => input_str != target_val_str,
                "greaterThan" => input_str > target_val_str.to_string(),
                "lessThan" => input_str < target_val_str.to_string(),
                "contains" => input_str.contains(target_val_str),
                _ => false,
            }
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

    fn execute_passthrough_node(&self, node: &Node, prior_results: &HashMap<String, ExecutionResult>, rev_adj: &HashMap<String, Vec<String>>) -> ExecutionResult {
        let mut input_val = serde_json::Value::Null;
        
        // Try to get data from first parent
        if let Some(parents) = rev_adj.get(&node.id) {
            if let Some(first_parent) = parents.first() {
                if let Some(parent_res) = prior_results.get(first_parent) {
                    if let Some(d) = parent_res.output.get("data") {
                        input_val = d.clone();
                    } else {
                        input_val = parent_res.output.clone();
                    }
                }
            }
        }

        ExecutionResult {
            node_id: node.id.clone(),
            status: "success".to_string(),
            output: serde_json::json!({ "status": "ok", "data": input_val }),
            error: None,
            active_handle: None,
        }
    }

    async fn execute_http_node(&self, node: &Node, variables: &HashMap<String, serde_json::Value>) -> ExecutionResult {
        let method = node.data.get("method").and_then(|v| v.as_str()).unwrap_or("GET");
        let mut url = node.data.get("endpoint").and_then(|v| v.as_str()).unwrap_or("").to_string();
        url = self.substitute(&url, variables);

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
                    let subbed_v = self.substitute(v_str, variables);
                    builder = builder.header(k, subbed_v);
                }
            }
        }

        // Add Body (if JSON)
        if let Some(body) = node.data.get("body") {
            if body.is_object() || body.is_array() {
                let body_str = body.to_string();
                let subbed_body_str = self.substitute(&body_str, variables);
                if let Ok(parsed_body) = serde_json::from_str::<serde_json::Value>(&subbed_body_str) {
                    builder = builder.json(&parsed_body);
                } else {
                     builder = builder.body(subbed_body_str);
                }
            }
        }

        match builder.send().await {
            Ok(res) => {
                let status = res.status().as_u16();
                let output = if res.headers().get("content-type").and_then(|h| h.to_str().ok()).map(|s| s.contains("json")).unwrap_or(false) {
                    let body = res.json::<serde_json::Value>().await.ok();
                     serde_json::json!({
                        "status": status,
                        "data": body
                    })
                } else {
                    let text = res.text().await.unwrap_or_default();
                    if let Ok(json_val) = serde_json::from_str::<serde_json::Value>(&text) {
                         serde_json::json!({
                            "status": status,
                            "data": json_val
                        })
                    } else {
                         serde_json::json!({
                            "status": status,
                            "data": text
                        })
                    }
                };
                
                ExecutionResult {
                    node_id: node.id.clone(),
                    status: "success".to_string(),
                    output,
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

    fn execute_debug_node(&self, node: &Node, prior_results: &HashMap<String, ExecutionResult>, rev_adj: &HashMap<String, Vec<String>>) -> ExecutionResult {
        let mut debug_data = HashMap::new();
        
        if let Some(parents) = rev_adj.get(&node.id) {
            for parent_id in parents {
                if let Some(res) = prior_results.get(parent_id) {
                    debug_data.insert(parent_id.clone(), res.output.clone());
                }
            }
        }

        ExecutionResult {
            node_id: node.id.clone(),
            status: "success".to_string(),
            output: serde_json::json!({ "debug": debug_data, "message": "Debug info captured" }), 
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

    fn execute_counter_node(&self, node: &Node, prior_results: &HashMap<String, ExecutionResult>, rev_adj: &HashMap<String, Vec<String>>, variables: &mut HashMap<String, serde_json::Value>) -> ExecutionResult {
        let variable_name = node.data.get("variable").and_then(|v| v.as_str()).unwrap_or("");
        let operation = node.data.get("operation").and_then(|v| v.as_str()).unwrap_or("increment");
        
        // Amount can now be a string for substitution or a number
        let default_amount = serde_json::json!(0.0);
        let raw_amount = node.data.get("amount").unwrap_or(&default_amount);
        let amount_str = if raw_amount.is_string() {
            raw_amount.as_str().unwrap().to_string()
        } else {
            raw_amount.to_string()
        };
        
        let subbed_amount = self.substitute(&amount_str, variables);
        let amount_val = subbed_amount.parse::<f64>().unwrap_or(0.0);

        if !variable_name.is_empty() {
            let current_val = variables.get(variable_name).and_then(|v| v.as_f64()).unwrap_or(0.0);
            
            let new_val = match operation {
                "increment" => serde_json::json!(current_val + amount_val),
                "decrement" => serde_json::json!(current_val - amount_val),
                "set" => serde_json::json!(amount_val),
                "assign" => {
                    // Get data from first parent
                    let mut input_data = serde_json::Value::Null;
                    if let Some(parents) = rev_adj.get(&node.id) {
                        if let Some(first_parent) = parents.first() {
                            if let Some(parent_res) = prior_results.get(first_parent) {
                                input_data = parent_res.output.get("data").cloned().unwrap_or(parent_res.output.clone());
                            }
                        }
                    }
                    input_data
                },
                "append" => {
                    // Logic for append (existing)
                    // ... (keep append logic above or copy it if needed context)
                    // Wait, I need to match the existing context properly. 
                    // To be safe, I will replace the whole block or append new cases.
                    // Let's rewrite the append block and new ones.
                    
                    let input_data = self.get_first_parent_data(node, prior_results, rev_adj);
                    
                    let mut arr = self.get_variable_as_array(variables, variable_name);
                    
                    if !input_data.is_null() {
                        arr.push(input_data);
                    }
                    
                    serde_json::Value::Array(arr)
                },
                "prepend" => {
                    let input_data = self.get_first_parent_data(node, prior_results, rev_adj);
                    let mut arr = self.get_variable_as_array(variables, variable_name);
                    
                    if !input_data.is_null() {
                        arr.insert(0, input_data);
                    }
                    
                    serde_json::Value::Array(arr)
                },
                "pop" => {
                    let mut arr = self.get_variable_as_array(variables, variable_name);
                    arr.pop();
                    serde_json::Value::Array(arr)
                },
                "shift" => {
                    let mut arr = self.get_variable_as_array(variables, variable_name);
                    if !arr.is_empty() {
                        arr.remove(0);
                    }
                    serde_json::Value::Array(arr)
                },
                _ => serde_json::json!(current_val),
            };
            
            variables.insert(variable_name.to_string(), new_val);
        }

        ExecutionResult {
            node_id: node.id.clone(),
            status: "success".to_string(),
            output: serde_json::json!({ "variable": variable_name, "status": "updated" }),
            error: None,
            active_handle: None,
        }
    }

    fn execute_assert_node(&self, node: &Node, prior_results: &HashMap<String, ExecutionResult>, rev_adj: &HashMap<String, Vec<String>>) -> ExecutionResult {
        // 1. Get Input
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

        // 2. Get Config
        let condition = node.data.get("condition").and_then(|v| v.as_str()).unwrap_or("equals");
        let query_value = node.data.get("value").and_then(|v| v.as_str()).unwrap_or("");
        let message = node.data.get("message").and_then(|v| v.as_str()).unwrap_or("Assertion failed");

        let input_str = if input_val.is_string() {
            input_val.as_str().unwrap().to_string()
        } else {
            input_val.to_string()
        };

        // 3. Evaluate
        let passed = match condition {
            "equals" => input_str == query_value,
            "notEquals" => input_str != query_value,
            "contains" => input_str.contains(query_value),
            "notContains" => !input_str.contains(query_value),
            "greaterThan" => {
                 if let (Ok(curr), Ok(target)) = (input_str.parse::<f64>(), query_value.parse::<f64>()) {
                     curr > target
                 } else {
                     false
                 }
            },
            "lessThan" => {
                 if let (Ok(curr), Ok(target)) = (input_str.parse::<f64>(), query_value.parse::<f64>()) {
                     curr < target
                 } else {
                     false
                 }
            },
             "regex" => {
                if let Ok(re) = regex::Regex::new(query_value) {
                    re.is_match(&input_str)
                } else {
                    false
                }
            },
            _ => false,
        };

        // 4. Return Result
        if passed {
            ExecutionResult {
                node_id: node.id.clone(),
                status: "success".to_string(),
                output: serde_json::json!({ "status": "passed", "data": input_val }),
                error: None,
                active_handle: None,
            }
        } else {
             ExecutionResult {
                node_id: node.id.clone(),
                status: "error".to_string(),
                output: serde_json::json!({ "status": "failed", "actual": input_val, "expected": query_value }),
                error: Some(format!("{}: Expected {} '{}', got '{}'", message, condition, query_value, input_str)),
                active_handle: None,
            }
        }
    }


    // Helper methods for Variable Ops
    fn get_first_parent_data(&self, node: &Node, prior_results: &HashMap<String, ExecutionResult>, rev_adj: &HashMap<String, Vec<String>>) -> serde_json::Value {
        if let Some(parents) = rev_adj.get(&node.id) {
            if let Some(first_parent) = parents.first() {
                if let Some(parent_res) = prior_results.get(first_parent) {
                    return parent_res.output.get("data").cloned().unwrap_or(parent_res.output.clone());
                }
            }
        }
        serde_json::Value::Null
    }

    fn get_variable_as_array(&self, variables: &HashMap<String, serde_json::Value>, variable_name: &str) -> Vec<serde_json::Value> {
        if let Some(curr) = variables.get(variable_name) {
            if let Some(a) = curr.as_array() {
                a.clone()
            } else if curr.is_null() {
                Vec::new()
            } else {
                vec![curr.clone()]
            }
        } else {
            Vec::new()
        }
    }

    // Server Trigger Node
    fn execute_server_trigger_node(&self, node: &Node, variables: &HashMap<String, serde_json::Value>) -> ExecutionResult {
        // If we are in 'serve' mode, these variables should be populated
        let method = variables.get("req_method").cloned().unwrap_or(serde_json::Value::Null);
        let body = variables.get("req_body").cloned().unwrap_or(serde_json::Value::Null);
        let query = variables.get("req_query").cloned().unwrap_or(serde_json::Value::Null);

        ExecutionResult {
            node_id: node.id.clone(),
            status: "success".to_string(),
            output: serde_json::json!({
                "method": method,
                "body": body,
                "query": query,
                // "data" field for compatibility with generic nodes that expect "data"
                "data": body 
            }),
            error: None,
            active_handle: None,
        }
    }

    // Server Response Node
    fn execute_server_response_node(&self, node: &Node, prior_results: &HashMap<String, ExecutionResult>, rev_adj: &HashMap<String, Vec<String>>, variables: &HashMap<String, serde_json::Value>) -> ExecutionResult {
        let input_data = self.get_first_parent_data(node, prior_results, rev_adj);
        
        let status = node.data.get("status").and_then(|v| v.as_i64()).unwrap_or(200);
        let body = node.data.get("body").cloned().unwrap_or(serde_json::Value::Null);
        
        let processed_body = if let Some(body_str) = body.as_str() {
            serde_json::Value::String(self.substitute(body_str, variables))
        } else {
            body
        };

        ExecutionResult {
            node_id: node.id.clone(),
            status: "completed".to_string(),
            output: serde_json::json!({
                "server_response": {
                    "status": status,
                    "body": processed_body,
                    "source_data": input_data
                }
            }),
            error: None,
            active_handle: None,
        }
    }
}
