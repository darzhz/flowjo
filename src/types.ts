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

export interface CounterNodeData {
  variable: string
  operation: "increment" | "decrement" | "set"
  amount: number
  onSave?: (id: string, newData: CounterNodeData) => void
}

export interface ScraperRule {
  selector: string
  attribute: string
  key: string
}

export interface ScraperNodeData {
  container_selector?: string
  rules: ScraperRule[]
  onSave?: (id: string, newData: ScraperNodeData) => void
}

export interface FilterNodeData {
  property: string
  condition: "equals" | "notEquals" | "contains" | "regex" | "extension"
  value: string
  onSave?: (id: string, newData: FilterNodeData) => void
}

export interface CarouselNodeData {
  items?: any[]
}

export interface ArrayMapNodeData {
  path: string
  onSave?: (id: string, newData: ArrayMapNodeData) => void
}

export interface AssertNodeData {
  condition: "equals" | "notEquals" | "contains" | "notContains" | "greaterThan" | "lessThan" | "regex"
  value: string
  message?: string
  onSave?: (id: string, newData: AssertNodeData) => void
}

export interface CommentNodeData {
  text: string
}

export interface GroupNodeData {
  label: string
}

export interface ServerTriggerNodeData {
  port: number
  method: string
  path: string
  onSave?: (id: string, newData: ServerTriggerNodeData) => void
}

export interface ServerResponseNodeData {
  status: number
  body: any
  onSave?: (id: string, newData: ServerResponseNodeData) => void
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
  | CounterNodeData
  | ScraperNodeData
  | FilterNodeData
  | CarouselNodeData
  | ArrayMapNodeData
  | AssertNodeData
  | CommentNodeData
  | GroupNodeData
  | ServerTriggerNodeData
  | ServerResponseNodeData

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



