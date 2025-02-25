import { Handle, Position, useEdges, useNodes, } from "reactflow";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { RefreshCcwDot } from "lucide-react";
export default function DebugNode({ id, data }: { id: string, data: any }) {
    const edges = useEdges();
    const nodes = useNodes();
    const [refresh, setRefresh] = useState(true);
    const [parentData, setParentData] = useState(null);
    const incomingEdges = edges.filter(edge => edge.target === id);
    const [parentHandleId, setParentHandleId] = useState<string>('');
    const parentNode: any = incomingEdges.length > 0 ? nodes.find(node => node.id === incomingEdges[0].source) : null;
    useEffect(() => {
        if (incomingEdges.length > 0) {
            const parentEdge = incomingEdges[0]; // Assuming there's only one incoming edge for simplicity
            const handleId = parentEdge?.sourceHandle; // Get the handle id from the parent node's edge
            setParentHandleId(handleId || ''); // Update state with the handle id
        }
    }, [incomingEdges, id]);
    useEffect(() => {
        setParentData(parentNode?.data)
    }, [parentNode, refresh]);
    const toggleRefresh = () => {
        setRefresh((prev) => !prev);
    }
    //console.log(id,incomingEdges);
    return (
        <Card className="bg-white shadow text-foreground dark:bg-gray-900 dark:text-gray-300">
            <Handle type="target" position={Position.Left} className="w-2 h-2" style={{ width: "10px", height: "10px" }} />
            <CardHeader className="m-0 pl-2 pt-2 flex flex-row justify-between">
                <Badge className="bg-red-900 text-white dark:bg-white dark:text-red-900 p-1">
                    Debug Node {id}
                </Badge>
                <Button variant="outline" onClick={() => toggleRefresh()}>
                    <RefreshCcwDot />
                </Button>
            </CardHeader>
            <CardContent>
                <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(parentData, null, 4) || "N/A"}
                </pre>
                <p>connected to : {parentHandleId}</p>
            </CardContent>
        </Card>
    )

}