import { Handle, Position, useEdges, useNodes } from "reactflow";
import { Card, CardContent, CardHeader } from "../ui/card";
import { useState, useEffect } from "react";
import { NodeData } from "../../types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export default function ValueSelector({ id, data }: { id: string, data: any }) {
  const edges = useEdges();
  const nodes = useNodes();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [jsonData, setJsonData] = useState<any>(null);

  // Find the source node connected to this value selector component
  const sourceEdge = edges.find(edge => edge.target === id);
  const sourceNode = sourceEdge ? nodes.find(node => node.id === sourceEdge.source) : null;
  const currentNode = nodes.find(node=> node.id === id);

  useEffect(() => {
    // Fetch the JSON data from the source node when it changes
    const Sdata = (sourceNode?.data as any)?.response?.data;
    setJsonData(Sdata);
    if (Sdata && Object.keys(Sdata).length > 0) {
      setSelectedKey(Object.keys(Sdata)[0]); // Automatically select the first key
    }
  }, []);
  useEffect(() => {
    // Set Json data
    const Sdata = (sourceNode?.data as any)?.response?.data;
    setJsonData(Sdata);
    if(selectedKey !== null && sourceNode?.data)
        data.selectedValue = Sdata[selectedKey];
  }, [JSON.stringify(sourceNode?.data),selectedKey]);

  const handleSelectionChange = (selected: string) => {
    setSelectedKey(selected);
  };

  const renderJsonData = (data: any) => {
    if (!data) return <div>No data available</div>;

    const keys = Object.keys(data);

    return (
      <div>
        <h3 className="font-bold text-sm">Select a Value:</h3>
        <Select value={selectedKey || ''} onValueChange={handleSelectionChange}>
          <SelectTrigger className="w-full p-2 border border-gray-300 rounded dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
            <SelectValue placeholder="Select a Key" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-300 rounded dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
            {keys.map((key) => (
              <SelectItem key={key} value={key}>
                {key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedKey && (
          <div className="mt-4">
            <strong>Selected Value:</strong>
            <div>{jsonData[selectedKey]}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="max-w-[400px] bg-white  border-gray-300 shadow-lg text-foreground dark:bg-gray-900 dark:text-gray-300 min-w-[300px]">
      <Handle type="target" position={Position.Left} className="w-2 h-2" style={{ width: "10px", height: "10px" }} />
      <CardHeader>Value Selector #{id}</CardHeader>
      <CardContent>
        {renderJsonData(jsonData)}

        {/* {selectedKey && (
          <div className="mt-4">
            <h3 className="font-semibold text-sm">Currently Selected:</h3>
            <div>{selectedKey}: {jsonData[selectedKey]}</div>
          </div>
        )} */}
      </CardContent>
      <Handle type="source" position={Position.Right} className="w-2 h-2" style={{ width: "10px", height: "10px" }} />
    </Card>
  );
}
