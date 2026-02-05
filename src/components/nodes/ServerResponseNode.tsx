import { Handle, Position, NodeProps } from "reactflow";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Server } from "lucide-react";
import { useState } from "react";

export default function ServerResponseNode({ data, id }: NodeProps) {
    const [status, setStatus] = useState(data.status || 200);
    const [body, setBody] = useState(typeof data.body === 'string' ? data.body : JSON.stringify(data.body, null, 2) || "{}");

    const onStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value) || 200;
        setStatus(val);
        data.status = val;
        if (data.onSave) data.onSave(id, data);
    };

    const onBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setBody(e.target.value);
        try {
            data.body = JSON.parse(e.target.value);
        } catch {
            data.body = e.target.value;
        }
        if (data.onSave) data.onSave(id, data);
    };

    return (
        <Card className="min-w-[300px] border-emerald-500 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-t-lg">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-600" />
                    Server Response
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                <div className="space-y-1">
                    <Label className="text-xs">Status Code</Label>
                    <Input className="h-8" type="number" value={status} onChange={onStatusChange} />
                </div>

                <div className="space-y-1">
                    <Label className="text-xs">Response Body (JSON or Text)</Label>
                    <Textarea
                        className="font-mono text-xs min-h-[100px]"
                        value={body}
                        onChange={onBodyChange}
                        placeholder='{ "status": "ok" }'
                    />
                </div>
            </CardContent>
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-emerald-500"
            />
        </Card>
    );
}
