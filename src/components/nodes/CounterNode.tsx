import { Handle, Position } from "reactflow";
import { Card, CardHeader, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Calculator } from "lucide-react";

export default function CounterNode({ id, data }: { id: string, data: any }) {
    const updateData = (key: string, value: any) => {
        data[key] = value;
        if (data.onSave) data.onSave(id, data);
    };

    return (
        <Card className="min-w-[200px] shadow-lg border-blue-500 dark:border-blue-700 bg-white dark:bg-gray-900 dark:text-gray-300">
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500" />
            <CardHeader className="p-3 pb-2 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xs uppercase">
                    <Calculator className="w-4 h-4" /> Variable Op
                </div>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
                <div className="space-y-1">
                    <Label className="text-[10px]">Variable Name</Label>
                    <Input
                        defaultValue={data.variable}
                        onChange={(e) => updateData("variable", e.target.value)}
                        className="h-8 text-xs font-mono"
                        placeholder="hot_day_count"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px]">Operation</Label>
                    <Select defaultValue={data.operation || "increment"} onValueChange={(v) => updateData("operation", v)}>
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="increment">Increment (+)</SelectItem>
                            <SelectItem value="decrement">Decrement (-)</SelectItem>
                            <SelectItem value="set">Set (=)</SelectItem>
                            <SelectItem value="assign">Assign Input (←)</SelectItem>
                            <SelectItem value="append">Append (Push)</SelectItem>
                            <SelectItem value="prepend">Prepend (Unshift)</SelectItem>
                            <SelectItem value="pop">Pop (Remove Last)</SelectItem>
                            <SelectItem value="shift">Shift (Remove First)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px]">Value / Amount</Label>
                    <Input
                        type="text"
                        defaultValue={data.amount}
                        onChange={(e) => updateData("amount", e.target.value)}
                        className="h-8 text-xs font-mono"
                        placeholder="1 or {{var}}"
                    />
                </div>
            </CardContent>
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500" />
        </Card>
    );
}
