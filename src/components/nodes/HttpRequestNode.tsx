import { useEffect, useState } from "react";
import { Handle, Position, useEdges, useNodes, useReactFlow } from "reactflow";
import { Edit, Save } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { ApiRequestFactory, ApiResponse } from "../../lib/ApiFactroy";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

// Enhanced type definition
export interface HttpRequestNodeData {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  endpoint: string;
  params?: Record<string, string>;
  body?: any;
  headers?: Record<string, string>;
  contentType?: "json" | "formData" | "multipart";
  onSave: (id: string, data: HttpRequestNodeData) => void;
  lastResponse?: ApiResponse;
}

export default function HttpRequestNode({
  data,
  id,
}: {
  data: HttpRequestNodeData;
  id: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<ApiResponse | undefined>(
    data.lastResponse
  );
  const edges = useEdges();
  const nodes = useNodes();
  const [parentData, setParentData] = useState<any>(null);
  const [parentHandleId, setParentHandleId] = useState<string>('');
  const incomingEdges = edges.filter(edge => edge.target === id);
  const parentNode:any = incomingEdges.length > 0 ? nodes.find(node => node.id === incomingEdges[0].source) : null;
  useEffect(() => {
    if (incomingEdges.length > 0) {
      const parentEdge = incomingEdges[0]; // Assuming there's only one incoming edge for simplicity
      const handleId = parentEdge?.sourceHandle; // Get the handle id from the parent node's edge
      setParentHandleId(handleId || ''); // Update state with the handle id
    }
  }, [incomingEdges, id]);

  useEffect(() => {
    setParentData(parentNode?.data)
  }, [parentNode]);

  const handleSave = () => {
    data.onSave(id, editData);
    setIsEditing(false);
  };
  const { setEdges } = useReactFlow();

  useEffect(() => {
    console.log(parentData,parentHandleId);
    if(parentData?.istrue && parentHandleId == "true"){
      executeRequest();
      console.log("called");
    }
  },[parentNode])

  const executeRequest = async () => {
    setIsLoading(true);
    // First reset all animations
    setEdges((eds) =>
      eds.map((edge) =>
        edge.source === id ? { ...edge, animated: false } : edge
      )
    );
    try {
      let request;

      // Create appropriate request based on content type
      switch (editData.contentType) {
        case "formData":
          request = ApiRequestFactory.createFormDataRequest(
            editData.method as "POST" | "PATCH"
          );
          break;
        case "multipart":
          request = ApiRequestFactory.createMultipartRequest(
            editData.method as "POST" | "PATCH"
          );
          break;
        default:
          request = ApiRequestFactory.createJsonRequest(editData.method);
      }

      const response = await request.execute({
        url: editData.endpoint,
        params: editData.params,
        data: editData.body,
        headers: editData.headers,
      });

      setLastResponse(response);
      data.lastResponse = response;
      if (response.success) {
        setEdges((eds) =>
          eds.map((edge) =>
            edge.source === id && edge.sourceHandle === "success"
              ? { ...edge, animated: true }
              : edge
          )
        );
      } else {
        // Handle API-level failures
        setEdges((eds) =>
          eds.map((edge) =>
            edge.source === id && edge.sourceHandle === "failure"
              ? { ...edge, animated: true }
              : edge
          )
        );
      }
    } catch (error) {
      setLastResponse({
        success: false,
        error: "Request failed",
        status: 500,
      });
      setEdges((eds) =>
        eds.map((edge) =>
          edge.source === id && edge.sourceHandle === "failure"
            ? { ...edge, animated: true }
            : edge
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <Card className="min-w-[350px] max-w-lg p-6 bg-white  border-gray-300 shadow-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300">
        <div className="space-y-5">
          <div className="grid gap-2">
            <label className="text-sm font-medium">HTTP Method</label>
            <Select defaultValue={editData.method}>
              <SelectTrigger
                className="w-[180px]"
                onChange={(e: any) =>
                  setEditData({ ...editData, method: e.target.value })
                }
              >
                <SelectValue placeholder="Select a method" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700 dark:text-gray-300 dark:border-gray-700">
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Endpoint URL</label>
            <Input
              value={editData.endpoint}
              onChange={(e) =>
                setEditData({ ...editData, endpoint: e.target.value })
              }
              placeholder="Enter API endpoint"
              className="dark:bg-gray-800 dark:border-gray-600"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Content Type</label>
            <Select defaultValue={editData?.contentType}>
              <SelectTrigger
                className="w-[180px]"
                onChange={(e: any) =>
                  setEditData({ ...editData, contentType: e.target.value })
                }
              >
                <SelectValue placeholder="Select a content type" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700 dark:text-gray-300 dark:border-gray-700">
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="formData">Form Data</SelectItem>
                <SelectItem value="multipart">Multipart Form</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Query Params (JSON)</label>
            <Textarea
              value={JSON.stringify(editData.params, null, 2)}
              onChange={(e) => {
                try {
                  setEditData({
                    ...editData,
                    params: JSON.parse(e.target.value),
                  });
                } catch { }
              }}
              placeholder="Enter query parameters"
              className="dark:bg-gray-800 dark:border-gray-600"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Request Body (JSON)</label>
            <Textarea
              value={JSON.stringify(editData.body, null, 2)}
              onChange={(e) => {
                try {
                  setEditData({
                    ...editData,
                    body: JSON.parse(e.target.value),
                  });
                } catch { }
              }}
              placeholder="Enter request body"
              className="dark:bg-gray-800 dark:border-gray-600"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Headers (JSON)</label>
            <Textarea
              value={JSON.stringify(editData.headers, null, 2)}
              onChange={(e) => {
                try {
                  setEditData({
                    ...editData,
                    headers: JSON.parse(e.target.value),
                  });
                } catch { }
              }}
              placeholder="Enter headers"
              className="dark:bg-gray-800 dark:border-gray-600"
            />
          </div>

          <Button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark"
          >
            <Save className="h-5 w-5" />
            Save
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="min-w-[300px] bg-white dark:border-gray-700 text-foreground dark:bg-gray-900 dark:text-gray-300">
      <Handle type="target" position={Position.Top} className="w-8 h-8" style={{ width: "10px", height: "10px" }} />
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-primary/10 text-primary">
            HTTP Request
          </Badge>
          <Badge variant={data.method === "GET" ? "secondary" : "destructive"}>
            {data.method}
          </Badge>
        </div>
        <div className="text-sm truncate text-muted-foreground">
          {data.endpoint}
        </div>
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="default"
              className="text-xs"
              onClick={executeRequest}
              disabled={isLoading}
            >
              {isLoading ? "Running..." : "Execute"}
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              Success ({lastResponse?.success ? "1" : "0"})
            </Badge>
            <Badge variant="outline" className="text-xs">
              Fail ({!lastResponse?.success ? "1" : "0"})
            </Badge>
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="success"
        className="w-8 h-8 !bg-green-500"
        style={{ left: "30%", width: "10px", height: "10px" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="failure"
        className="w-8 h-8 !bg-red-500"
        style={{ left: "70%", width: "10px", height: "10px" }}
      />
    </Card>
  );
}
