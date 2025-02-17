import { Handle, Position, useEdges, useNodes, } from "reactflow";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { useState } from "react";
export default function DebugNode({ id, data }: { id: string, data: any }){
    const edges = useEdges();
    const nodes = useNodes();
    const incomingEdges = edges.filter(edge => edge.target === id);
    const [isConnectable,setIsConnectable] = useState(true);
    const parentNode = incomingEdges.length > 0 ? nodes.find(node => node.id === incomingEdges[0].source) : null;
    const onConnect = () => {
        if(incomingEdges.length>1){
            setIsConnectable(false)
        }
      };


    console.log(id,incomingEdges);
    return(
        <Card className="bg-white shadow text-foreground dark:bg-gray-900 dark:text-gray-300">
            <Handle type="target" position={Position.Left} className="w-2 h-2" style={{ width: "10px", height: "10px" }} onConnect={onConnect} />
            <CardHeader className="m-0 pl-2 pt-2">
                <Badge className="bg-red-900 text-white dark:bg-white dark:text-red-900 p-1">
                    Debug Node {id}
                </Badge>
            </CardHeader>
            <CardContent>
                {JSON.stringify(data)}
            </CardContent>
        </Card>
    )

}