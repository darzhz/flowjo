import { Handle, Position, useEdges, useNodes, useReactFlow } from "reactflow";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
export interface GrabValueNodeData {
    key: string;
    id: string;
}

export default function GrabValueNode() {
  const [path, setPath] = useState('');
  const [selectedValue, setSelectedValue] = useState(null);
  const [error, setError] = useState('');
  const edges = useEdges();
  const nodes = useNodes();

  const data = nodes.find((node) => node.id === edges.find((edge) => edge.target === 'value')?.source);
  const parentNodeData = data?.data;
  //find connected node
  // const parentNodeData = nodes.find((node) => node.id === edges.find((edge) => edge.target === 'value')?.source)?.data;
  useEffect(() => {
    console.log('parentNodeData', edges);
  }, [data]);

  useEffect(() => {
    if (!data) return;

    try {
      const value = eval(`parentNodeData.${path}`);
      setSelectedValue(value);
      setError('');
    } catch (e) {
      setSelectedValue(null);
      // setError(e.message as string);
    }
  }, [path, parentNodeData]);
  

  return (
    <Card className="w-64 bg-white dark:bg-gray-900 dark:text-gray-300">
    <Handle
      type="target"
      position={Position.Top}
      style={{ background: '#555' }}
      onConnect={(params) => {
        console.log('Handle onConnect', params);
      }}
    />

    <CardHeader className="pb-4">
      <CardTitle className="text-sm">JSON Selector</CardTitle>
    </CardHeader>

    <CardContent>
      <div className="space-y-4">
        <div className="text-inherit">
          <Label htmlFor="path">Path (dot notation)</Label>
          <Input
            id="path"
            placeholder="e.g. data.users[0].name"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Input Data</Label>
          <div className="mt-1 p-2 bg-gray-100 rounded min-h-8 text-sm break-all">
            {parentNodeData ? (
              JSON.stringify(parentNodeData).slice(0, 100) + '...'
            ) : (
              'No input data'
            )}
          </div>
        </div>

        <div>
          <Label>Selected Value</Label>
          <div className="mt-1 p-2 bg-gray-100 rounded min-h-8 break-all">
            {error ? (
              <span className="text-red-500 text-sm">{error}</span>
            ) : (
              <span className="text-sm">
                {selectedValue !== null 
                  ? typeof selectedValue === 'object'
                    ? JSON.stringify(selectedValue)
                    : String(selectedValue)
                  : 'No value selected'}
              </span>
            )}
          </div>
        </div>
      </div>
    </CardContent>

    <Handle
      type="source"
      position={Position.Bottom}
      style={{ background: '#555' }}
      id="value"
    />
  </Card>
  );
}
