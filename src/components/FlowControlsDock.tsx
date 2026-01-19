import { IconBox, IconLock, IconLockOpen, IconRefresh, IconZoomIn, IconZoomOut, IconDeviceFloppy, IconFolderOpen } from "@tabler/icons-react";
import { useReactFlow } from "reactflow";
import { FloatingDock } from "./ui/floating-dock";
import { useState } from "react";
import { Moon, Play, Sun } from "lucide-react";
import useThemes from "../hooks/useThemes";
import { invoke } from "@tauri-apps/api/core";
import { ExecutionResult } from "../types";
import { toast } from "sonner";

export const FlowControlsDock = ({ className, onExecutionComplete }: { className?: string, onExecutionComplete?: (vars: Record<string, any>) => void }) => {
  const { setNodes, getNodes, getEdges, zoomIn, zoomOut, fitView, setEdges } = useReactFlow();
  const [locked, setLocked] = useState(false);
  const { theme, toggleTheme } = useThemes()

  const runFlow = async () => {
    console.log("Run flow");
    const nodes = getNodes();
    const edges = getEdges();

    // Sanitize nodes for backend (remove excess data if needed, but strict serde should handle it)
    // Sanitize nodes for backend (remove excess data if needed, but strict serde should handle it)
    try {
      // Load environment variables first
      const env = await invoke<Record<string, string>>("load_environment").catch(() => ({}));

      const [results, variables] = await invoke<[Record<string, ExecutionResult>, Record<string, any>]>("execute_flow", {
        flow: { nodes, edges },
        env
      });

      console.log("Execution results:", results);
      if (onExecutionComplete) onExecutionComplete(variables);

      // Check for failures
      const errors = Object.values(results).filter(r => r.status === 'error');
      if (errors.length > 0) {
        toast.error(`Flow failed: ${errors[0].error || 'Unknown error'}`);
      } else {
        toast.success("Flow executed successfully!");
      }

      setNodes((nds) => nds.map((node) => {
        if (results[node.id]) {
          const result = results[node.id];
          // Update node data with result
          // For HttpRequestNode, we might want to store the response
          // For now, let's just log it or update a generic 'lastResult' field
          return {
            ...node,
            data: {
              ...node.data,
              // If it's a response node, we might want to feed it?
              // Or if we executed an HTTP node, keep the result there.
              executionResult: result,
              // If this node is connected to a response node, 
              // the response node update logic should arguably happen in the backend execution or here.
              // For this prototype, I'll update the node's data.executionResult
            }
          };
        }
        return node;
      }));

      // Special handling: Passing data to Response/Display/Tabulize Nodes
      const newNodes = getNodes(); // refreshed
      edges.forEach(edge => {
        const sourceNode = newNodes.find(n => n.id === edge.source);
        const targetNode = newNodes.find(n => n.id === edge.target);

        if (!sourceNode || !targetNode) return;

        // If source executed successfully
        const sourceResult = results[sourceNode.id];
        if (sourceResult && sourceResult.status === 'success') {
          // For Response Node (specific to HTTP)
          if (sourceNode.type === 'httpRequest' && targetNode.type === 'response') {
            setNodes(nds => nds.map(n => {
              if (n.id === targetNode.id) {
                return { ...n, data: { ...n.data, status: sourceResult.output.status, response: sourceResult.output.data } }
              }
              return n;
            }));
          }

          // For Display/Tabulize/Debug Nodes: generic input consumers
          if (['display', 'tabulize', 'debug'].includes(targetNode.type || '')) {
            // Determine what data to pass. 
            // If source was HTTP, pass the body data.
            // If source was something else, pass its output.
            let dataToPass = sourceResult.output;

            // Refinement for HTTP sources feeding into Display:
            // Users usually want to see the body 'data'.
            if (sourceNode.type === 'httpRequest' && sourceResult.output.data) {
              dataToPass = sourceResult.output.data;
            }

            setNodes(nds => nds.map(n => {
              if (n.id === targetNode.id) {
                return { ...n, data: { ...n.data, input: dataToPass } }
              }
              return n;
            }));
          }
        }
      });

    } catch (error) {
      console.error("Flow execution failed:", error);
      alert("Flow execution failed: " + error);
    }
  };

  const saveFlow = async () => {
    const path = window.prompt("Enter file path to save (e.g., /tmp/flow.json):");
    if (!path) return;

    const nodes = getNodes();
    const edges = getEdges();

    try {
      await invoke("save_flow", { path, flow: { nodes, edges } });
      alert("Flow saved successfully!");
    } catch (error) {
      console.error("Save failed:", error);
      alert("Save failed: " + error);
    }
  };

  const loadFlow = async () => {
    const path = window.prompt("Enter file path to load:");
    if (!path) return;

    try {
      const flow: any = await invoke("load_flow", { path });
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
      alert("Flow loaded successfully!");
    } catch (error) {
      console.error("Load failed:", error);
      alert("Load failed: " + error);
    }
  };

  const toggleLock = () => {
    setLocked((prev) => !prev);

    if (!locked) {
      setNodes((nodes) => nodes.map((node) => ({ ...node, draggable: false })));
    } else {
      setNodes((nodes) => nodes.map((node) => ({ ...node, draggable: true })));
    }
  };

  const items = [
    { title: "Zoom In", icon: <IconZoomIn />, action: () => zoomIn() },
    { title: "Zoom Out", icon: <IconZoomOut />, action: () => zoomOut() },
    { title: "Reset", icon: <IconRefresh />, action: () => fitView({ duration: 1000 }) },
    { title: "Run flow", icon: <Play className="h-4 w-4 mr-1" />, action: () => runFlow() },
    { title: "Save Flow", icon: <IconDeviceFloppy />, action: saveFlow },
    { title: "Load Flow", icon: <IconFolderOpen />, action: loadFlow },
    {
      title: locked ? "Unlock Flow" : "Lock Flow",
      icon: locked ? <IconLock /> : <IconLockOpen />,
      action: toggleLock,
    },
    { title: "Fit View", icon: <IconBox />, action: () => fitView() },
    { title: "Toggle Night Mode", icon: theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />, action: toggleTheme },
  ];

  return <FloatingDock items={items} desktopClassName={className} mobileClassName="translate-y-20" />;
};