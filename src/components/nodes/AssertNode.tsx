import { Handle, Position } from "reactflow";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useState } from "react";
import { AlertCircle } from "lucide-react";

export default function AssertNode({ id, data }: { id: string, data: any }) {

    const [condition, setCondition] = useState(data.condition || 'equals');
    const [value, setValue] = useState(data.value || '');
    const [message, setMessage] = useState(data.message || '');

    const updateData = (key: string, val: any) => {
        if (key === 'condition') setCondition(val);
        if (key === 'value') setValue(val);
        if (key === 'message') setMessage(val);
        data.onSave?.(id, { ...data, [key]: val });
    }

    return (
        <Card className="min-w-[250px] bg-white border-2 text-foreground dark:bg-gray-950 dark:text-gray-300 border-orange-500 shadow-md ring-2 ring-orange-500/20">
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-orange-500" />

            <CardHeader className="p-3 pb-2 bg-orange-50 dark:bg-orange-900/20 font-bold text-sm text-orange-700 dark:text-orange-400 flex flex-row items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Assertion (Test Gate)
            </CardHeader>

            <CardContent className="p-3 space-y-3">
                <div className="space-y-1">
                    <Label className="text-xs">Condition</Label>
                    <Select onValueChange={(v) => updateData('condition', v)} value={condition}>
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Condition" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="equals">Equals (==)</SelectItem>
                            <SelectItem value="notEquals">Not Equals (!=)</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="notContains">Not Contains</SelectItem>
                            <SelectItem value="greaterThan">Greater Than (&gt;)</SelectItem>
                            <SelectItem value="lessThan">Less Than (&lt;)</SelectItem>
                            <SelectItem value="regex">Regex Match</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <Label className="text-xs">Expected Value</Label>
                    <Input
                        value={value}
                        onChange={(e) => updateData('value', e.target.value)}
                        className="h-8 text-xs font-mono"
                        placeholder="Value to assert..."
                    />
                </div>

                <div className="space-y-1">
                    <Label className="text-xs">Failure Message (Optional)</Label>
                    <Input
                        value={message}
                        onChange={(e) => updateData('message', e.target.value)}
                        className="h-8 text-xs"
                        placeholder="Custom error message..."
                    />
                </div>
            </CardContent>

            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 bg-green-500"
            />
        </Card>
    );
}
