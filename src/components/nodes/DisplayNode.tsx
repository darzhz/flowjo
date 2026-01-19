import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { DisplayNodeData } from "../../types";

export default memo(({ data }: { data: DisplayNodeData }) => {
    return (
        <Card className="min-w-[200px] max-w-[400px] bg-white border text-foreground dark:bg-gray-900 dark:text-gray-300 border-gray-400 shadow-md">
            <CardHeader className="p-3 pb-2 bg-gray-100 dark:bg-gray-800">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    Display
                </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
                <div className="bg-black/90 text-green-400 font-mono text-xs p-2 rounded max-h-[200px] overflow-auto whitespace-pre-wrap break-all">
                    {data.input ? (
                        typeof data.input === 'object' ? JSON.stringify(data.input, null, 2) : String(data.input)
                    ) : (
                        <span className="text-gray-500 italic">No input data...</span>
                    )}
                </div>
            </CardContent>
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-gray-400" />
        </Card>
    );
});
