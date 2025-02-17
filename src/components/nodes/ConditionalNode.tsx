import { Handle, Position, useEdges, useNodes } from "reactflow";
import { Card, CardContent, CardHeader } from "../ui/card";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"; // Import the necessary components from ShadCN

export default function ConditionalNode({ id, data }: { id: string, data: any }) {
  const edges = useEdges();
  const nodes = useNodes();
  
  const [selectedCondition, setSelectedCondition] = useState<string>(''); // Selected condition
  const [conditionResult, setConditionResult] = useState<boolean | null>(null); // Condition evaluation result
  const [parentValues, setParentValues] = useState<any[]>([]); // Values from the parent nodes

  // Find the edges connected to the conditional node
  const incomingEdges = edges.filter(edge => edge.target === id);

  // Get the source nodes connected to this conditional node
  const parentNode1 = incomingEdges.length > 0 ? nodes.find(node => node.id === incomingEdges[0].source) : null;
  const parentNode2 = incomingEdges.length > 1 ? nodes.find(node => node.id === incomingEdges[1].source) : null;

  useEffect(() => {
    // Update parent values from both connected nodes
    if (parentNode1 && parentNode2) {
      const value1 = (parentNode1.data as any)?.selectedValue;
      const value2 = (parentNode2.data as any)?.selectedValue;
      setParentValues([value1, value2]);
    } else {
      setParentValues([]); // Reset if not enough parent nodes
    }
  }, [parentNode1, parentNode2]);

  // Automatically evaluate the condition whenever `parentValues` or `selectedCondition` changes
  useEffect(() => {
    if (parentValues.length === 2 && selectedCondition) {
      const value1 = parentValues[0];
      const value2 = parentValues[1];

      // Evaluate based on the selected condition
      switch (selectedCondition) {
        case 'greaterThan':
          setConditionResult(value1 > value2);
          break;
        case 'lessThan':
          setConditionResult(value1 < value2);
          break;
        case 'equal':
          setConditionResult(value1 === value2);
          break;
        default:
          setConditionResult(null); // Invalid condition
          break;
      }
    }
  }, [parentValues, selectedCondition]);

  const renderConditionResult = () => {
    if (conditionResult === null) {
      return <div className="text-red-500">Invalid Condition</div>;
    }
    return <div>{conditionResult ? 'Condition Met (True)' : 'Condition Not Met (False)'}</div>;
  };

  return (
    <Card className="max-w-[400px] bg-white border text-foreground dark:bg-gray-900 dark:text-gray-300">
      <Handle type="target" position={Position.Left} className="w-2 h-2" style={{ width: "10px", height: "10px" }} />
      <CardHeader>Conditional Node #{id}</CardHeader>
      <CardContent>
        <Select onValueChange={setSelectedCondition} value={selectedCondition}>
          <SelectTrigger className="w-full mb-4">
            <SelectValue placeholder="Select Condition" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="greaterThan">Greater Than</SelectItem>
            <SelectItem value="lessThan">Less Than</SelectItem>
            <SelectItem value="equal">Equal</SelectItem>
          </SelectContent>
        </Select>

        {renderConditionResult()}

        <div className="mt-4">
          <h3 className="font-semibold text-sm">Parent Node 1 Value:</h3>
          <pre>{JSON.stringify(parentValues[0], null, 2)}</pre>
        </div>
        <div className="mt-4">
          <h3 className="font-semibold text-sm">Parent Node 2 Value:</h3>
          <pre>{JSON.stringify(parentValues[1], null, 2)}</pre>
        </div>
      </CardContent>

      {/* True/False Handles with Labels */}
      <Handle
        type="source"
        id={conditionResult == true?"true":"false"}
        position={Position.Right}
        className="w-2 h-2"
        style={{
          width: "10px",
          height: "10px",
          borderColor: conditionResult === true ? 'green' : (conditionResult === null ? 'gray' : 'red'),
        }}
      >
        {conditionResult === true && <span className="absolute text-xs top-[-3px] right-4 rotate-270">True</span>}
      </Handle>

      <Handle
        type="source"
        id={conditionResult != true?"true":"false"}
        position={Position.Bottom}
        className="w-2 h-2"
        style={{
          width: "10px",
          height: "10px",
          borderColor: conditionResult === false ? 'green' : (conditionResult === null ? 'gray' : 'red'),
        }}
      >
        {conditionResult === false && <span className="absolute text-xs bottom-3 left-[-10px]">False</span>}
      </Handle>
    </Card>
  );
}
