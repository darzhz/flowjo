import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Card, CardContent } from "../ui/card";
import { Play } from "lucide-react";

export default memo(() => {
    return (
        <div className="min-w-[100px]">
            <Card className="border-2 border-blue-600 shadow-xl bg-blue-500 dark:bg-blue-600 text-white rounded-full">
                <CardContent className="p-3 flex items-center justify-center font-bold gap-2">
                    <Play className="fill-current w-4 h-4" /> Start
                </CardContent>
                <Handle type="source" position={Position.Right} className="w-4 h-4 bg-white border-2 border-blue-600" />
            </Card>
        </div>
    );
});
