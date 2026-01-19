import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { RefreshCw } from "lucide-react";

export default memo(({ id: _id, data: _data }: { id: string, data: any }) => {
    return (
        <Card className="min-w-[200px] bg-white border text-foreground dark:bg-gray-900 dark:text-gray-300 border-purple-500 shadow-md">
            {/* Input Array */}
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-purple-500" />

            <CardHeader className="p-3 pb-2 bg-purple-50 dark:bg-purple-900/20">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-700 dark:text-purple-400">
                    <RefreshCw className="w-4 h-4" /> Loop (ForEach)
                </CardTitle>
            </CardHeader>

            <CardContent className="p-3 text-xs text-muted-foreground relative min-h-[60px]">
                <p>Iterates over an array.</p>
                <p>Connect 'Body' to start loop.</p>
                <p>Connect end of loop back to Input!</p>

                {/* Body Handle */}
                <div className="absolute right-[-6px] top-[30px] flex items-center flex-row-reverse">
                    <Handle
                        id="body"
                        type="source"
                        position={Position.Right}
                        className="w-3 h-3 bg-blue-500 top-[37px]"
                    />
                    <span className="text-[10px] text-blue-600 font-bold mr-2 mt-[6px]">Item</span>
                </div>

                {/* Done Handle */}
                <div className="absolute right-[-6px] bottom-[5px] flex items-center flex-row-reverse">
                    <Handle
                        id="done"
                        type="source"
                        position={Position.Right}
                        className="w-3 h-3 bg-green-500 bottom-[15px]"
                    />
                    <span className="text-[10px] text-green-600 font-bold mr-2 mb-[2px]">Done</span>
                </div>
            </CardContent>
        </Card>
    );
});
