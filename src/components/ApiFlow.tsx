import { useState, useCallback } from "react";
import ReactFlow, {
  type Node,
  Background,
  type NodeTypes,
  type Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
  ReactFlowProvider,
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
  ContextMenuSubContent,
  ContextMenuSeparator
} from "../components/ui/context-menu";

import "reactflow/dist/style.css";
import { FlowControlsDock } from "./FlowControlsDock";
import HttpRequestNode from "./nodes/HttpRequestNode";
import HttpResponceNode from "./nodes/HttpResponceNode";
import ConditionalNode from "./nodes/ConditionalNode";
import DebugNode from "./nodes/DebugNode";
import InputNode from "./nodes/InputNode";
import OutputNode from "./nodes/OutputNode";
import StartNode from "./nodes/StartNode";
import LoopNode from "./nodes/LoopNode";
import CaptureNode from "./nodes/CaptureNode";
import MapperNode from "./nodes/MapperNode";
import CounterNode from "./nodes/CounterNode";
import ScraperNode from "./nodes/ScraperNode";
import FilterNode from "./nodes/FilterNode";
import ArrayMapNode from "./nodes/ArrayMapNode";
import CarouselNode from "./nodes/CarouselNode";
import AssertNode from "./nodes/AssertNode";
import CommentNode from "./nodes/CommentNode";
import GroupNode from "./nodes/GroupNode";
import ServerTriggerNode from "./nodes/ServerTriggerNode";
import ServerResponseNode from "./nodes/ServerResponseNode";

const nodeTypes: NodeTypes = {
  httpRequest: HttpRequestNode,
  response: HttpResponceNode,
  condition: ConditionalNode,
  debug: DebugNode,
  input: InputNode,
  output: OutputNode,
  start: StartNode,
  loop: LoopNode,
  capture: CaptureNode,
  mapper: MapperNode,
  counter: CounterNode,
  scraper: ScraperNode,
  filter: FilterNode,
  arrayMap: ArrayMapNode,
  carousel: CarouselNode,
  assert: AssertNode,
  comment: CommentNode,
  group: GroupNode,
  serverTrigger: ServerTriggerNode,
  serverResponse: ServerResponseNode,
};

const initialNodes: Node[] = [];

export default function ApiFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [variables] = useState<Record<string, any>>({});

  const onLoadFlow = useCallback(async (path: string) => {
    try {
      const flow = await invoke<any>("load_flow", { path });
      if (flow && flow.nodes && flow.edges) {
        setNodes(flow.nodes);
        setEdges(flow.edges);
      }
    } catch (e) {
      console.error("Failed to load flow:", e);
    }
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback((type: string, data?: any) => {
    const id = `${type}-${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: data || {},
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const deleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => eds.filter((edge) => !edge.selected));
  }, [setNodes, setEdges]);

  const clearAll = useCallback(() => {
    if (window.confirm("Are you sure you want to clear the entire flow?")) {
      setNodes([]);
      setEdges([]);
    }
  }, [setNodes, setEdges]);

  return (
    <ReactFlowProvider>
      <div className="w-full h-screen flex overflow-hidden">
        <FilesSidebar onLoadFlow={onLoadFlow} variables={variables} />
        <div className="flex-grow h-full relative overflow-hidden">
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div className="w-full h-full">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  nodeTypes={nodeTypes}
                  connectionMode={ConnectionMode.Loose}
                  fitView
                  className="bg-gray-50 dark:bg-black"
                >
                  <Background color="#999" gap={16} />
                  <Panel position="bottom-center" className="pb-4">
                    <FlowControlsDock />
                  </Panel>
                </ReactFlow>
              </div>
            </ContextMenuTrigger>

            <ContextMenuContent className="w-56 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
              {/* Documentation Nodes */}
              <ContextMenuSub>
                <ContextMenuSubTrigger inset>Documentation</ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  <ContextMenuItem inset onClick={() => addNode('comment')}>Note / Comment</ContextMenuItem>
                  <ContextMenuItem inset onClick={() => addNode('group')}>Visual Group</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>

              {/* Logic Nodes */}
              <ContextMenuSub>
                <ContextMenuSubTrigger inset>Logic</ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  <ContextMenuItem inset onClick={() => addNode('condition')}>Conditional</ContextMenuItem>
                  <ContextMenuItem inset onClick={() => addNode('assert')}>Assert (Test)</ContextMenuItem>
                  <ContextMenuItem inset onClick={() => addNode('loop')}>Loop (ForEach)</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>

              {/* IO Nodes */}
              <ContextMenuSub>
                <ContextMenuSubTrigger inset>I/O & Display</ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  <ContextMenuItem inset onClick={() => addNode('start')}>Start Flow</ContextMenuItem>
                  <ContextMenuItem inset onClick={() => addNode('input')}>Input Block</ContextMenuItem>
                  <ContextMenuItem inset onClick={() => addNode('output')}>Output Block</ContextMenuItem>
                  <ContextMenuItem inset onClick={() => addNode('carousel')}>Carousel Display</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>

              {/* Data Nodes */}
              <ContextMenuSub>
                <ContextMenuSubTrigger inset>Data & Variables</ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  <ContextMenuItem inset onClick={() => addNode('capture')}>Capture Block</ContextMenuItem>
                  <ContextMenuItem inset onClick={() => addNode('scraper')}>DOM Scraper</ContextMenuItem>
                  <ContextMenuItem inset onClick={() => addNode('filter', { property: "", condition: "equals", value: "" })}>Filter (Array/Item)</ContextMenuItem>
                  <ContextMenuItem inset onClick={() => addNode('arrayMap', { path: "" })}>Array Map (Extract)</ContextMenuItem>
                  <ContextMenuItem inset onClick={() => addNode('mapper')}>Value Mapper</ContextMenuItem>
                  <ContextMenuItem inset onClick={() => addNode('counter')}>Variable Op</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>

              {/* Network Nodes */}
              <ContextMenuSub>
                <ContextMenuSubTrigger inset>Network</ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  <ContextMenuItem inset onClick={() => addNode('httpRequest')}>HTTP Request</ContextMenuItem>
                  <ContextMenuItem inset onClick={() => addNode('serverTrigger')}>Server Trigger</ContextMenuItem>
                  <ContextMenuItem inset onClick={() => addNode('serverResponse')}>Server Response</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>

              <ContextMenuSub>
                <ContextMenuSubTrigger inset>Debug</ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  <ContextMenuItem inset onClick={() => addNode('debug')}>Debug Node</ContextMenuItem>
                  <ContextMenuItem inset onClick={() => addNode('response')}>Response Display</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>

              <ContextMenuSeparator className="bg-gray-100 dark:bg-gray-800" />

              <ContextMenuItem inset onClick={deleteSelected} className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300">
                Delete Selected
              </ContextMenuItem>
              <ContextMenuItem inset onClick={clearAll} className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300">
                Clear All Flow
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
