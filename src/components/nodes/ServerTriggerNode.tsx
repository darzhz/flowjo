import { Handle, Position, NodeProps } from "reactflow";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Server } from "lucide-react";
import { useState } from "react";

const SUPPORTED_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];

export default function ServerTriggerNode({ data, id }: NodeProps) {
    const [method, setMethod] = useState(data.method || "GET");
    const [path, setPath] = useState(data.path || "/webhook");
    const [port, setPort] = useState(data.port || 3000);

    const onMethodChange = (val: string) => {
        setMethod(val);
        data.method = val;
        if (data.onSave) data.onSave(id, data);
    };

    const onPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPath(e.target.value);
        data.path = e.target.value;
        if (data.onSave) data.onSave(id, data);
    };

    const onPortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value) || 3000;
        setPort(val);
        data.port = val;
        if (data.onSave) data.onSave(id, data);
    };

    return (
        <Card className="min-w-[300px] border-emerald-500 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-t-lg">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-600" />
                    Server Trigger
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-xs">Method</Label>
                        <Select value={method} onValueChange={onMethodChange}>
                            <SelectTrigger className="h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SUPPORTED_METHODS.map((m) => (
                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Port</Label>
                        <Input className="h-8" type="number" value={port} onChange={onPortChange} />
                    </div>
                </div>

                <div className="space-y-1">
                    <Label className="text-xs">Path</Label>
                    <Input className="h-8" value={path} onChange={onPathChange} placeholder="/webhook" />
                </div>

                <div className="text-xs text-muted-foreground mt-2">
                    Outputs specific to request: <code>body</code>, <code>query</code>, <code>headers</code>
                </div>
            </CardContent>
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 bg-emerald-500"
            />
        </Card>
    );
}
