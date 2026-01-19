import { Handle, Position } from "reactflow";
import { Card, CardHeader, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { useState } from "react";

export default function MapperNode({ data }: { data: any }) {
    const [mappingStr, setMappingStr] = useState(JSON.stringify(data.mapping || {}, null, 2));
    const [fallback, setFallback] = useState(data.fallback || "Unknown");

    const onMappingChange = (val: string) => {
        setMappingStr(val);
        try {
            const parsed = JSON.parse(val);
            data.mapping = parsed;
            if (data.onSave) data.onSave(data.id, data);
        } catch (e) {
            // Invalid JSON, don't save yet
        }
    };

    const onFallbackChange = (val: string) => {
        setFallback(val);
        data.fallback = val;
        if (data.onSave) data.onSave(data.id, data);
    };

    return (
        <Card className="min-w-[250px] shadow-lg border-purple-200 dark:border-purple-900">
            <Handle type="target" position={Position.Left} />
            <CardHeader className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Value Mapper
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-1">
                    <Label className="text-[10px]">Mapping (JSON Dictionary)</Label>
                    <Textarea
                        value={mappingStr}
                        onChange={(e) => onMappingChange(e.target.value)}
                        className="font-mono text-[10px] h-32 bg-slate-50 dark:bg-slate-900"
                        placeholder='{ "0": "Clear" }'
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px]">Fallback Value</Label>
                    <Input
                        value={fallback}
                        onChange={(e) => onFallbackChange(e.target.value)}
                        className="text-[10px] h-7"
                    />
                </div>
            </CardContent>
            <Handle type="source" position={Position.Right} />
        </Card>
    );
}
