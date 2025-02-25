import type { Node } from "reactflow"

export interface HttpRequestNodeData {
  method: string
  endpoint: string
  params: Record<string, string>
  body: any
  headers: Record<string, string>
  onSave: (id: string, newData: HttpRequestNodeData) => void
}

export interface ApiResponseNodeData {
  status: number
  response: any
  latency?: number
  error?: string
}
export interface ValueSelector {
  selectedValue?:any
}
export interface conditional {
  istrue?:boolean|null
}
export interface Debug {
  input?:any
}

export type NodeData = HttpRequestNodeData | ApiResponseNodeData | ValueSelector | conditional | Debug

export interface FlowNode extends Node {
  data: NodeData
}

export interface NodeType {
  type: string
  label: string
  data: NodeData
}


