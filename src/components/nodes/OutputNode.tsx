import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Card, CardContent } from "../ui/card";

export default memo(({ data }: { data: { label?: string } }) => {
    return (
        <div className="min-w-[150px]">
            <Card className="border-2 border-green-500 shadow-md bg-green-50 dark:bg-green-900/20">
                <CardContent className="p-3 flex items-center justify-center font-bold text-green-700 dark:text-green-300">
                    {data.label || "Output"} 🏁
                </CardContent>
                <Handle type="target" position={Position.Left} className="w-3 h-3 bg-green-500" />
            </Card>
        </div>
    );
});
