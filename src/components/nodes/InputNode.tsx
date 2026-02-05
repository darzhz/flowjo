import { memo, useState } from "react";
import { Handle, Position } from "reactflow";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { InputNodeData } from "../../types";

export default memo(({ data, id }: { data: InputNodeData; id: string }) => {
    const [key, setKey] = useState(data.key || "");
    const [value, setValue] = useState(data.value || "");
    const [type, setType] = useState<"string" | "number" | "json">(data.type || "string");

    const handleChange = (newKey: string, newValue: string, newType: "string" | "number" | "json") => {
        setKey(newKey);
        setValue(newValue);
        setType(newType);
        data.onSave?.(id, { key: newKey, value: newValue, type: newType });
    };

    return (
        <Card className="min-w-[250px] w-full bg-white border text-foreground dark:bg-gray-900 dark:text-gray-300 border-blue-500 shadow-md">
            <CardHeader className="p-3 pb-2 bg-blue-50 dark:bg-blue-900/20">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    Input Variable
                </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
                <div className="space-y-1">
                    <Label className="text-xs">Variable Name</Label>
                    <Input
                        value={key}
                        onChange={(e) => handleChange(e.target.value, value, type)}
                        className="h-8 text-xs bg-transparent dark:bg-gray-800"
                        placeholder="e.g. userId"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={type} onValueChange={(v: any) => handleChange(key, value, v)}>
                        <SelectTrigger className="h-8 text-xs bg-transparent dark:bg-gray-800">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Initial Value</Label>
                    <Input
                        value={value}
                        onChange={(e) => handleChange(key, e.target.value, type)}
                        className="h-8 text-xs font-mono bg-transparent dark:bg-gray-800"
                        placeholder="Value..."
                    />
                </div>
            </CardContent>
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500" />
        </Card>
    );
});
