import { useState, useCallback, useRef } from "react";
import ReactFlow, {
  type Node,
  Background,
  type NodeTypes,
  type Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  ConnectionMode,
} from "reactflow";
import { invoke } from "@tauri-apps/api/core";
import { FilesSidebar } from "./files-sidebar";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent
} from "../components/ui/context-menu";

import "reactflow/dist/style.css";
import { FlowControlsDock } from "./FlowControlsDock";
import HttpRequestNode from "./nodes/HttpRequestNode";
import { NodeType } from "../types";
import { X } from "lucide-react";
import HttpResponceNode from "./nodes/HttpResponceNode";
import ValueSelector from "./nodes/ValueSelector";
import ConditionalNode from "./nodes/ConditionalNode";
import DebugNode from "./nodes/DebugNode";
import InputNode from "./nodes/InputNode";
import OutputNode from "./nodes/OutputNode";
import DisplayNode from "./nodes/DisplayNode";
import TabulizeNode from "./nodes/TabulizeNode";
import StartNode from "./nodes/StartNode";

import LoopNode from "./nodes/LoopNode";
import CaptureNode from "./nodes/CaptureNode";
import CaseNode from "./nodes/CaseNode";
import MapperNode from "./nodes/MapperNode";
import { EnvironmentManager } from "./EnvironmentManager";

// ...

const nodeTypes: NodeTypes = {
  httpRequest: HttpRequestNode,
  response: HttpResponceNode,
  valueselector: ValueSelector,
  condition: ConditionalNode,
  debug: DebugNode,
  input: InputNode,
  output: OutputNode,
  display: DisplayNode,
  tabulize: TabulizeNode,
  start: StartNode,
  loop: LoopNode,
  capture: CaptureNode,
  caseSuccess: CaseNode,
  caseFail: CaseNode,
  mapper: MapperNode,
};

const initialNodes: Node[] = [];

const NODE_TYPES: NodeType[] = [
  // ... existing nodes
  {
    type: "capture",
    label: "Capture Value",
    data: { path: "", variable: "" }
  },
  // ... existing nodes
  {
    type: "loop",
    label: "Loop (ForEach)",
    data: { input: [] }
  },
  {
    type: "httpRequest",
    label: "HTTP Request",
    data: {
      method: "GET",
      endpoint: "https://dummyjson.com/quotes/random",
      params: {},
      body: {},
      headers: {},
      onSave: (id: string, newData: any) => console.log(id, newData),
    },
  },
  {
    type: "start",
    label: "Start Flow",
    data: { label: "Start" }
  },
  {
    type: "response",
    label: "Response Display",
    data: {
      status: 200,
      response: { message: "Waiting for response..." },
    },
  },
  {
    type: "valueselector",
    label: "Value Selector",
    data: {
      selectedValue: "",
    },
  },
  {
    type: "condition",
    label: "Conditional Logic",
    data: {
      input: ""
    }
  },
  {
    type: "debug",
    label: "Debug Node",
    data: {
      input: ""
    }
  },
  { type: "input", label: "Input", data: { key: "", value: "", type: "string" } },
  { type: "output", label: "Output", data: { label: "End" } },
  { type: "display", label: "Display", data: { input: "Waiting for data..." } },
  { type: "tabulize", label: "Tabulize", data: { input: [] } },
  { type: "caseSuccess", label: "Case Success", data: {} },
  { type: "caseFail", label: "Case Fail", data: {} },
  { type: "mapper", label: "Value Mapper", data: { mapping: {}, fallback: "Unknown" } },
];

export default function ApiFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      const { source, target } = params;
      if (source && target) {
        setEdges((eds) => {
          return addEdge(
            {
              ...params,
              style: { stroke: params.sourceHandle === "success" ? "#00cc66" : "#ff4444" },
            },
            eds
          );
        });
      }
    },
    [setEdges]
  );


  // Removed manual onContextMenu handler using menuPosition

  const onNodeSave = useCallback((id: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...newData, onSave: onNodeSave } } : node
      )
    );
  }, [setNodes]);

  const addNode = useCallback(
    (type: string) => {
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const position = reactFlowInstance?.project({
        x: (reactFlowBounds?.width || 500) / 2,
        y: (reactFlowBounds?.height || 500) / 2,
      }) || { x: 100, y: 100 };

      const nodeType = NODE_TYPES.find((t) => t.type === type);
      if (!nodeType) return;


      const newNode = {
        id: `node_${Date.now()}`,
        type: nodeType.type,
        position: position,
        data: {
          ...nodeType.data,
          onSave: onNodeSave,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes, onNodeSave]
  );
  const mousePosRef = useRef({ x: 0, y: 0 });

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== id));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== id && edge.target !== id)
      );
    },
    [setNodes, setEdges]
  );
  const loadFlowFromFile = async (path: string) => {
    try {
      const flow: any = await invoke("load_flow", { path });
      const nodesWithHandlers = (flow.nodes || []).map((node: any) => ({
        ...node,
        data: {
          ...node.data,
          onSave: onNodeSave
        }
      }));
      setNodes(nodesWithHandlers);
      setEdges(flow.edges || []);
    } catch (error) {
      console.error("Load failed:", error);
      alert("Load failed: " + error);
    }
  };

  return (
    <div className="flex w-full h-screen bg-white dark:bg-gray-950">
      <FilesSidebar onLoadFlow={loadFlowFromFile} variables={variables} />
      <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
        <ContextMenu>
          <ContextMenuTrigger
            onContextMenuCapture={(e) => {
              // ...
              mousePosRef.current = { x: e.clientX, y: e.clientY };
            }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onInit={setReactFlowInstance}
              onNodeContextMenu={(_, node) => {
                setSelectedNode(node.id);
              }}
              onPaneContextMenu={() => {
                setSelectedNode(null);
              }}
              connectionMode={ConnectionMode.Strict}
              fitView
            >
              <div className="fixed z-50 flex items-center justify-center bottom-0 w-full pointer-events-none">
                <div className="pointer-events-auto flex gap-2 items-center mb-4">
                  <EnvironmentManager />
                  <FlowControlsDock onExecutionComplete={setVariables} />
                </div>
              </div>
              <Background gap={12} size={2} color="purple" className="bg-white dark:bg-gray-800" />

            </ReactFlow>
          </ContextMenuTrigger>

          <ContextMenuContent className="w-64">
            {selectedNode ? (
              <ContextMenuItem
                inset
                onClick={() => deleteNode(selectedNode)}
                className="text-red-500 focus:text-red-500"
              >
                <X className="mr-2 h-4 w-4" />
                Delete Node
              </ContextMenuItem>
            ) : (
              <>
                {/* Logic Nodes */}
                <ContextMenuSub>
                  <ContextMenuSubTrigger inset>Logic</ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-48 bg-white dark:bg-gray-900">
                    <ContextMenuItem inset onClick={() => addNode('condition')}>Conditional</ContextMenuItem>
                    <ContextMenuItem inset onClick={() => addNode('loop')}>Loop (ForEach)</ContextMenuItem>
                    <ContextMenuItem inset onClick={() => addNode('caseSuccess')}>Case Success</ContextMenuItem>
                    <ContextMenuItem inset onClick={() => addNode('caseFail')}>Case Fail</ContextMenuItem>
                  </ContextMenuSubContent>
                </ContextMenuSub>

                {/* IO Nodes */}
                <ContextMenuSub>
                  <ContextMenuSubTrigger inset>I/O & Display</ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-48 bg-white dark:bg-gray-900">
                    <ContextMenuItem inset onClick={() => addNode('start')}>Start Flow</ContextMenuItem>
                    <ContextMenuItem inset onClick={() => addNode('valueselector')}>Value Selector</ContextMenuItem>
                    <ContextMenuItem inset onClick={() => addNode('input')}>Input Block</ContextMenuItem>
                    <ContextMenuItem inset onClick={() => addNode('output')}>Output Block</ContextMenuItem>
                    <ContextMenuItem inset onClick={() => addNode('display')}>Display Block</ContextMenuItem>
                    <ContextMenuItem inset onClick={() => addNode('tabulize')}>Tabulize</ContextMenuItem>
                  </ContextMenuSubContent>
                </ContextMenuSub>

                {/* Data Nodes */}
                <ContextMenuSub>
                  <ContextMenuSubTrigger inset>Data & Variables</ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-48 bg-white dark:bg-gray-900">
                    <ContextMenuItem inset onClick={() => addNode('capture')}>Capture Block</ContextMenuItem>
                    <ContextMenuItem inset onClick={() => addNode('mapper')}>Value Mapper</ContextMenuItem>
                  </ContextMenuSubContent>
                </ContextMenuSub>

                {/* Network Nodes */}
                <ContextMenuSub>
                  <ContextMenuSubTrigger inset>Network</ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-48">
                    <ContextMenuItem inset onClick={() => addNode('httpRequest')}>HTTP Request</ContextMenuItem>
                  </ContextMenuSubContent>
                </ContextMenuSub>

                <ContextMenuSub>
                  <ContextMenuSubTrigger inset>Debug</ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-48">
                    <ContextMenuItem inset onClick={() => addNode('debug')}>Debug Node</ContextMenuItem>
                    <ContextMenuItem inset onClick={() => addNode('response')}>Response Display</ContextMenuItem>
                  </ContextMenuSubContent>
                </ContextMenuSub>
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>
      </div>
    </div>
  );
}

