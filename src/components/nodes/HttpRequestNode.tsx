import { useState, useEffect } from "react";
import { Handle, Position, useReactFlow } from "reactflow";
import { Edit, Save, Play } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { KeyValueList } from "../ui/key-value-list";
import { ApiResponse } from "../../lib/ApiFactroy";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export interface HttpRequestNodeData {
  method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  endpoint: string;
  params?: Record<string, string>;
  body?: any;
  headers?: Record<string, string>;
  contentType?: "json" | "formData" | "multipart";
  onSave: (id: string, data: HttpRequestNodeData) => void;
  lastResponse?: ApiResponse;
  executionResult?: {
    status: string;
    output: any;
    error?: string;
  };
}

interface RequestTemplate {
  id: string;
  name: string;
  method: string;
  endpoint: string;
  headers: any;
  body: any;
  params: any;
}

export default function HttpRequestNode({
  data,
  id,
}: {
  data: HttpRequestNodeData;
  id: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<HttpRequestNodeData>({
    ...data,
    params: data.params || {},
    headers: data.headers || {},
    body: data.body || {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<RequestTemplate[]>([]);
  const [lastResponse, setLastResponse] = useState<ApiResponse | undefined>(
    data.lastResponse
  );
  const { setEdges } = useReactFlow();

  // Sync editData when entering edit mode or when data updates
  useEffect(() => {
    if (isEditing) {
      setEditData({
        ...data,
        params: data.params || {},
        headers: data.headers || {},
        body: data.body || {}
      });
    }
  }, [isEditing, data]);

  const status = data.executionResult?.status;
  const statusColor = status === 'success' ? 'border-green-500 ring-1 ring-green-500 chain-success' : status === 'error' ? 'border-red-500 ring-1 ring-red-500 chain-error' : 'border-gray-200 dark:border-gray-800';

  useEffect(() => {
    if (isEditing) {
      invoke("load_request_templates").then((res: any) => setTemplates(res)).catch(console.error);
    }
  }, [isEditing]);

  const saveAsTemplate = async () => {
    const name = prompt("Enter template name:");
    if (!name) return;

    const template: RequestTemplate = {
      id: Math.random().toString(),
      name,
      method: editData.method,
      endpoint: editData.endpoint,
      headers: editData.headers,
      body: editData.body,
      params: editData.params
    };

    try {
      await invoke("save_request_template", { template });
      setTemplates([...templates, template]);
      alert("Template saved!");
    } catch (e) {
      console.error(e);
      alert("Failed to save template");
    }
  };

  const loadTemplate = (templateId: string) => {
    const t = templates.find(t => t.id === templateId);
    if (t) {
      setEditData({
        ...editData,
        method: t.method as any,
        endpoint: t.endpoint,
        headers: t.headers,
        body: t.body,
        params: t.params
      });
    }
  }


  const handleSave = () => {
    if (data.onSave) {
      data.onSave(id, editData);
    }
    setIsEditing(false);
  };

  const executeRequest = async () => {
    setIsLoading(true);
    setEdges((eds) =>
      eds.map((edge) =>
        edge.source === id ? { ...edge, animated: false } : edge
      )
    );
    try {
      setLastResponse({
        success: true,
        status: 200,
        data: {}
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBody = (val: string) => {
    try {
      setEditData({ ...editData, body: JSON.parse(val) });
    } catch (e) {
      // Ignore invalid JSON while typing
    }
  }

  if (isEditing) {
    return (
      <Card className={`min-w-[400px] max-w-lg p-0 bg-white shadow-lg dark:bg-gray-950 dark:text-gray-300 overflow-hidden ${statusColor}`}>
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Edit Request</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={saveAsTemplate}>Save Template</Button>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={handleSave}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b dark:border-gray-800 bg-transparent p-0">
            <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs">Settings</TabsTrigger>
            <TabsTrigger value="params" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs">Params</TabsTrigger>
            <TabsTrigger value="headers" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs">Headers</TabsTrigger>
            <TabsTrigger value="body" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs">Body</TabsTrigger>
            <TabsTrigger value="templates" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs">Templates</TabsTrigger>
          </TabsList>

          <div className="p-4">
            <TabsContent value="settings" className="space-y-4 m-0">
              <div className="grid gap-2">
                <label className="text-xs font-medium">HTTP Method</label>
                <Select value={editData.method} onValueChange={(val: any) => setEditData({ ...editData, method: val })}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Select a method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-medium">Endpoint URL</label>
                <Input
                  value={editData.endpoint}
                  onChange={(e) => setEditData({ ...editData, endpoint: e.target.value })}
                  placeholder="https://api.example.com/v1/resource"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </TabsContent>

            <TabsContent value="params" className="m-0">
              <KeyValueList
                initialData={editData.params || {}}
                onChange={(params) => setEditData({ ...editData, params })}
                placeholderKey="Query Param"
              />
            </TabsContent>

            <TabsContent value="headers" className="m-0">
              <KeyValueList
                initialData={editData.headers || {}}
                onChange={(headers) => setEditData({ ...editData, headers })}
                placeholderKey="Header (e.g. Authorization)"
              />
            </TabsContent>

            <TabsContent value="body" className="m-0 space-y-2">
              <Textarea
                defaultValue={JSON.stringify(editData.body, null, 2)}
                onChange={(e) => updateBody(e.target.value)}
                placeholder='{ "key": "value" }'
                className="h-[150px] font-mono text-xs"
              />
            </TabsContent>

            <TabsContent value="templates" className="m-0 space-y-2">
              <div className="space-y-1">
                {templates.map(t => (
                  <Button key={t.id} variant="ghost" className="w-full justify-start text-xs h-8" onClick={() => loadTemplate(t.id)}>
                    {t.name} ({t.method})
                  </Button>
                ))}
                {templates.length === 0 && <p className="text-xs text-muted-foreground p-2">No templates saved.</p>}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <Handle type="target" position={Position.Top} className="opacity-0" />
        <Handle type="source" position={Position.Bottom} className="opacity-0" />
      </Card>
    );
  }

  return (
    <Card className={`min-w-[300px] bg-white shadow-sm dark:bg-gray-900 dark:text-gray-300 ${statusColor}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400" />
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={data.method === "GET" ? "secondary" : "default"} className="text-[10px] px-1 py-0 h-5">
              {data.method}
            </Badge>
          </div>
          {lastResponse && (
            <Badge variant={lastResponse.success ? "outline" : "destructive"} className={`text-[10px] px-1 py-0 h-5 ${lastResponse.success ? "text-green-600 border-green-600 bg-green-50 dark:bg-green-900/20" : ""}`}>
              {lastResponse.status}
            </Badge>
          )}
        </div>

        <div className="font-mono text-xs truncate bg-muted/50 p-1.5 rounded text-muted-foreground select-all">
          {data.endpoint || "No endpoint set"}
        </div>

        <div className="flex justify-between items-center pt-1 border-t dark:border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs px-2 hover:bg-muted"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-3 w-3 mr-1" /> Edit
          </Button>
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={executeRequest} disabled={isLoading}>
            <Play className="h-3 w-3 mr-1" /> Test
          </Button>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="success" className="w-3 h-3 bg-green-500" style={{ left: "30%" }} />
      <Handle type="source" position={Position.Bottom} id="failure" className="w-3 h-3 bg-red-500" style={{ left: "70%" }} />
    </Card>
  );
}
