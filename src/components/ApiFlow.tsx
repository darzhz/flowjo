import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import ReactFlow, {
  type Node,
  Background,
  type NodeTypes,
  type Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type XYPosition,
} from "reactflow";

import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../components/ui/context-menu";
import "reactflow/dist/style.css";
import { FlowControlsDock } from "./FlowControlsDock";
import HttpRequestNode from "./nodes/HttpRequestNode";
import { NodeData, NodeType } from "../types";
import { X } from "lucide-react";
import HttpResponceNode from "./nodes/HttpResponceNode";



// const ResponseNode = ({ data }: { data: any }) => {
 

//   return (
//   <Card className="min-w-[300px] max-w-[400px] bg-white border text-foreground dark:bg-gray-900">
//     <Handle type="target" position={Position.Top} className="w-2 h-2" />
//     <div className="p-4 space-y-4">
//       <div className="flex items-center justify-between">
//         <Badge variant="outline">Response</Badge>
//         <Badge variant={data.status < 400 ? "default" : "destructive"}>
//           {data.status}
//         </Badge>
//       </div>
//       <ScrollArea className="h-[200px] w-full rounded-md border p-2">
//         <pre className="text-xs">{JSON.stringify(data.response, null, 2)}</pre>
//       </ScrollArea>
//     </div>
//     <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
//   </Card>
// )};

const nodeTypes: NodeTypes = {
  httpRequest: HttpRequestNode,
  response: HttpResponceNode,
};

const initialNodes: Node[] = [];

const NODE_TYPES: NodeType[] = [
  {
    type: "httpRequest",
    label: "HTTP Request",
    data: {
      method: "GET",
      endpoint: "https://dummyjson.com/quotes/random",
      params: {},
      body: {},
      headers: {},
      onSave: (id, newData) => console.log(id, newData),
    },
  },
  {
    type: "response",
    label: "Response Display",
    data: {
      status: 200,
      response: { message: "Waiting for response..." },
    },
  },
];

export default function ApiFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [menuPosition, setMenuPosition] = useState<XYPosition | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      setMenuPosition({
        x: event.clientX, // Use clientX directly
        y: event.clientY, // Use clientY directly
      });
    },
    [reactFlowInstance]
  );

  const addNode = useCallback(
    (type: string) => {
      if (!menuPosition) return;

      const nodeType = NODE_TYPES.find((t) => t.type === type);
      if (!nodeType) return;

      const reactFlowPosition = reactFlowInstance.project({
        x: menuPosition.x,
        y: menuPosition.y,
      });

      const newNode = {
        id: `node_${nodes.length + 1}`,
        type: nodeType.type,
        position: reactFlowPosition,
        data: {
          ...nodeType.data,
          onSave: (id: string, newData: NodeData) => {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === id ? { ...node, data: newData } : node
              )
            );
          },
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setMenuPosition(null);
    },
    [menuPosition, nodes, setNodes]
  );

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== id));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== id && edge.target !== id)
      );
      console.log("Deleted node", id);
      setMenuPosition(null);
    },
    [setNodes, setEdges]
  );
  return (
    <div className="w-full h-screen bg-white" ref={reactFlowWrapper}>
      <ContextMenu >
        <ContextMenuTrigger onContextMenuCapture={()=>{setSelectedNode(null)}}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onContextMenu={onContextMenu}
            onInit={setReactFlowInstance}
            onNodeContextMenu={(event, node) => {
              event.preventDefault();
              setSelectedNode(node.id);
            }}
            fitView
          >
            <div className="fixed z-50 flex items-center justify-center bottom-0 w-full">
            <FlowControlsDock />
            </div>
            <Background gap={12} size={2} color="purple" className="bg-white dark:bg-gray-800"/>

            {/* Node Creation Menu */}
            {menuPosition && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{
                  left: menuPosition.x,
                  top: menuPosition.y,
                }}
                className="fixed z-50 bg-white dark:bg-gray-800 border border-border dark:border-gray-700 
                rounded-lg shadow-xl p-2 min-w-[180px] text-foreground dark:text-gray-300"
              >
                {selectedNode ?(
                  <>
                  <button
                    className="w-full text-left px-3 py-2 text-sm rounded-md transition-colors 
                    hover:bg-muted dark:hover:bg-gray-700 flex dark:text-gray-300"
                    onClick={(e) => {
                      e.preventDefault()
                      deleteNode(selectedNode)
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Delete Node
                  </button>
                  </>
                ):(
                  <>
                  {NODE_TYPES.map((nodeType) => (
                  <button
                    key={nodeType.type}
                    className="w-full text-left px-3 py-2 text-sm rounded-md transition-colors 
                    hover:bg-muted dark:hover:bg-gray-700 flex dark:text-gray-300"
                    onClick={() => addNode(nodeType.type)}
                  >
                    {nodeType.label}
                  </button>
                ))}
                  </>
                )}
                
              </motion.div>
            )}
            {/* {selectedNode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{
                  left: menuPosition.x,
                  top: menuPosition.y,
                }}
                className="fixed z-50 bg-white dark:bg-gray-800 border border-border dark:border-gray-700 
                rounded-lg shadow-xl p-2 min-w-[180px] text-foreground"
              >
                <button
                  className="w-full text-left px-3 py-2 text-sm rounded-md transition-colors 
                  hover:bg-muted dark:hover:bg-gray-700"
                  onClick={() => deleteNode(selectedNode)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Delete Node
                </button>
              </motion.div>
            )} */}

          </ReactFlow>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {NODE_TYPES.map((nodeType) => (
            <ContextMenuItem
              key={nodeType.type}
              onClick={() => addNode(nodeType.type)}
            >
              {nodeType.label}
            </ContextMenuItem>
          ))}
          {selectedNode && (
            <ContextMenuItem onClick={() => deleteNode(selectedNode)}>
              <X className="h-4 w-4 mr-2" />
              Delete Node
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
