import type { Node, Edge } from "reactflow"

export interface HttpRequestNodeData {
  method: string
  endpoint: string
  params?: Record<string, string>
  body?: any
  headers?: Record<string, string>
  onSave: (id: string, newData: HttpRequestNodeData) => void
}

export interface ApiResponseNodeData {
  status: number
  response: any
  latency?: number
  error?: string
}
export interface ValueSelector {
  selectedValue?: any
}
export interface Conditional {
  input?: any
  condition?: "equal" | "notEqual" | "greaterThan" | "lessThan" | "contains"
  targetValue?: string
}

export interface InputNodeData {
  key: string
  value: string
  type: "string" | "number" | "json"
  onSave?: (id: string, newData: InputNodeData) => void
}

export interface OutputNodeData {
  label: string
}

export interface DisplayNodeData {
  input: any
}

export interface TabulizeNodeData {
  input: any[]
}

export interface CaptureNodeData {
  path: string
  variable: string
  onSave?: (id: string, newData: CaptureNodeData) => void
}

export interface MapperNodeData {
  mapping: Record<string, any>
  fallback: any
  onSave?: (id: string, newData: MapperNodeData) => void
}

export type NodeData =
  | HttpRequestNodeData
  | ApiResponseNodeData
  | ValueSelector
  | Conditional
  | InputNodeData
  | OutputNodeData
  | DisplayNodeData
  | TabulizeNodeData
  | CaptureNodeData
  | MapperNodeData

export interface FlowNode extends Node {
  data: NodeData
}

export interface NodeType {
  type: string
  label: string
  data: NodeData
}

export interface ExecutionResult {
  node_id: string
  status: "success" | "error" | "skipped"
  output: any
  error?: string
}

export interface Flow {
  nodes: Node[]
  edges: Edge[]
}



