import { IconBox, IconLock, IconLockOpen, IconRefresh, IconZoomIn, IconZoomOut, IconDeviceFloppy, IconFolderOpen, IconSettings } from "@tabler/icons-react";
import { useReactFlow } from "reactflow";
import { FloatingDock } from "./ui/floating-dock";
import { useState } from "react";
import { Moon, Play, Sun } from "lucide-react";
import useThemes from "../hooks/useThemes";
import { invoke } from "@tauri-apps/api/core";
import { ExecutionResult } from "../types";
import { toast } from "sonner";
import { EnvironmentManager } from "./EnvironmentManager";

export const FlowControlsDock = ({ className, onExecutionComplete }: { className?: string, onExecutionComplete?: (vars: Record<string, any>) => void }) => {
  const { setNodes, getNodes, getEdges, zoomIn, zoomOut, fitView, setEdges } = useReactFlow();
  const [locked, setLocked] = useState(false);
  const [isEnvModalOpen, setEnvModalOpen] = useState(false);
  const { theme, toggleTheme } = useThemes()
  const [isRunning, setIsRunning] = useState(false);

  const runFlow = async () => {
    console.log("Run flow");
    setIsRunning(true);
    const nodes = getNodes();
    const edges = getEdges();

    try {
      const env = await invoke<Record<string, string>>("load_environment").catch(() => ({}));

      const [results, variables] = await invoke<[Record<string, ExecutionResult>, Record<string, any>]>("execute_flow", {
        flow: { nodes, edges },
        env
      });

      console.log("Execution results:", results);
      if (onExecutionComplete) onExecutionComplete(variables);

      const errors = Object.values(results).filter(r => r.status === 'error');
      if (errors.length > 0) {
        toast.error(`Flow failed: ${errors[0].error || 'Unknown error'}`);
      } else {
        toast.success("Flow executed successfully!");
      }

      setNodes((nds) => nds.map((node) => {
        if (results[node.id]) {
          const result = results[node.id];
          return {
            ...node,
            data: {
              ...node.data,
              executionResult: result,
            }
          };
        }
        return node;
      }));

      const newNodes = getNodes();
      edges.forEach(edge => {
        const sourceNode = newNodes.find(n => n.id === edge.source);
        const targetNode = newNodes.find(n => n.id === edge.target);

        if (!sourceNode || !targetNode) return;

        const sourceResult = results[sourceNode.id];
        if (sourceResult && sourceResult.status === 'success') {
          if (sourceNode.type === 'httpRequest' && targetNode.type === 'response') {
            setNodes(nds => nds.map(n => {
              if (n.id === targetNode.id) {
                return { ...n, data: { ...n.data, status: sourceResult.output.status, response: sourceResult.output.data } }
              }
              return n;
            }));
          }

          if (['display', 'tabulize', 'debug'].includes(targetNode.type || '')) {
            let dataToPass = sourceResult.output;
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
    } finally {
      setIsRunning(false);
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
    { title: "Run flow", icon: isRunning ? <IconRefresh className="h-6 w-6 animate-spin" /> : <Play className="h-6 w-6" />, action: () => runFlow() },
    { title: "Save Flow", icon: <IconDeviceFloppy />, action: saveFlow },
    { title: "Load Flow", icon: <IconFolderOpen />, action: loadFlow },
    { title: "Environment", icon: <IconSettings />, action: () => setEnvModalOpen(true) },
    {
      title: locked ? "Unlock Flow" : "Lock Flow",
      icon: locked ? <IconLock /> : <IconLockOpen />,
      action: toggleLock,
    },
    { title: "Fit View", icon: <IconBox />, action: () => fitView() },
    { title: "Toggle Night Mode", icon: theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />, action: toggleTheme },
  ];

  return (
    <>
      <EnvironmentManager open={isEnvModalOpen} onOpenChange={setEnvModalOpen} />
      <FloatingDock items={items} desktopClassName={className} mobileClassName="translate-y-20" />
    </>
  );
};