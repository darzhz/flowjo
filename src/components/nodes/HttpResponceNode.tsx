import { Handle, Position, useEdges, useNodes, useReactFlow } from "reactflow";
import { useEffect, useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { ApiResponse } from "../../lib/ApiFactroy";
import { HttpRequestNodeData } from "./HttpRequestNode";

interface ResponseNodeData {
  id: string;
  status?: number,
  response?: ApiResponse,
}

export default function HttpResponseNode({
  data,
  id,
}: {
  data: ResponseNodeData;
  id: string;
}) {
  const { setEdges } = useReactFlow();
  const edges = useEdges();
  const nodes = useNodes();
  const [response, setResponse] = useState<ApiResponse | undefined>(undefined);

  // Find the source node that's connected to this response node
  const sourceEdge = edges.find((edge) => edge.target === id);
  const sourceNode = sourceEdge
    ? nodes.find((node) => node.id === sourceEdge.source)
    : null;

  useEffect(() => {
    const sourceData = sourceNode?.data as HttpRequestNodeData | undefined;
    const response = sourceData?.lastResponse;
    if(sourceEdge?.sourceHandle === "success" && response?.success){
      setResponse(response);
      data.response = response;
    }
    if(sourceEdge?.sourceHandle === "failure" && !response?.success){
      setResponse(response);
      data.response = response;
    }
  }, [sourceEdge, sourceNode]);

  const hasResponse = !!response;
  const isSuccess = response?.success ?? false;
  const status = response?.status ?? 0;

  return (
    <Card key={id} className="min-w-[300px] max-w-[400px] bg-white  text-foreground dark:bg-gray-900 dark:text-gray-300">
      <Handle type="target" position={Position.Top} className="w-2 h-2" style={{width:"10px",height:"10px"}} />
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline">Response</Badge>
          {hasResponse ? (
            <Badge variant={status < 400 ? "default" : "destructive"}>
              {status}
            </Badge>
          ) : (
            <Badge variant="outline">Waiting...</Badge>
          )}
        </div>
        <ScrollArea className="h-[200px] w-full rounded-md  p-2">
          {hasResponse ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Status: {status}</span>
                <span>{isSuccess ? "Success" : "Failed"}</span>
              </div>
              <pre className="text-xs whitespace-pre-wrap">
                {response.error ? (
                  <span className="text-red-500">{response.error}</span>
                ) : (
                  JSON.stringify(response.data, null, 2)
                )}
              </pre>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center pt-4">
              No response data available.
              {!sourceNode && (
                <div className="mt-2 text-yellow-500">
                  Connect this node to a request node to see responses.
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
      <Handle
        type="source"
        id="output"
        position={Position.Bottom}
        className="w-2 h-2"
        style={{ width: "10px", height: "10px" }}
      />
    </Card>
  );
}
