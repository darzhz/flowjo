import { useState } from "react";
import { Handle, Position } from "reactflow";
import { Edit, Save } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export interface FilterNodeData {
    property: string;
    condition: "equals" | "notEquals" | "contains" | "regex" | "extension" | "exists" | "notExists";
    value: string;
    onSave: (id: string, data: FilterNodeData) => void;
}

export default function FilterNode({ data, id }: { data: FilterNodeData; id: string }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<FilterNodeData>({
        property: data.property || "",
        condition: data.condition || "equals",
        value: data.value || "",
        onSave: data.onSave
    });

    const handleSave = () => {
        data.onSave(id, editData);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <Card className="min-w-[350px] p-4 bg-white shadow-lg dark:bg-gray-950 dark:text-gray-300 border-primary/50 ring-1 ring-primary/20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Badge variant="outline">Filter</Badge> Rules
                    </h3>
                    <Button size="sm" onClick={handleSave} className="h-8">
                        <Save className="h-4 w-4 mr-1" />
                        Save
                    </Button>
                </div>

                <div className="space-y-3">
                    <div className="grid gap-1">
                        <label className="text-[10px] text-muted-foreground uppercase">Property</label>
                        <Input
                            value={editData.property}
                            onChange={(e) => setEditData({ ...editData, property: e.target.value })}
                            placeholder="e.g. url or name (empty for root)"
                            className="h-8 text-xs font-mono"
                        />
                    </div>

                    <div className="grid gap-1">
                        <label className="text-[10px] text-muted-foreground uppercase">Condition</label>
                        <Select value={editData.condition} onValueChange={(val: any) => setEditData({ ...editData, condition: val })}>
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="equals">Equals</SelectItem>
                                <SelectItem value="notEquals">Not Equals</SelectItem>
                                <SelectItem value="contains">Contains</SelectItem>
                                <SelectItem value="regex">Regex Match</SelectItem>
                                <SelectItem value="extension">Extension (comma separated)</SelectItem>
                                <SelectItem value="exists">Exists (not null)</SelectItem>
                                <SelectItem value="notExists">Not Exists (null/missing)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {(editData.condition !== "exists" && editData.condition !== "notExists") && (
                        <div className="grid gap-1">
                            <label className="text-[10px] text-muted-foreground uppercase">Value</label>
                            <Input
                                value={editData.value}
                                onChange={(e) => setEditData({ ...editData, value: e.target.value })}
                                placeholder="e.g. .jpg,.png"
                                className="h-8 text-xs font-mono"
                            />
                        </div>
                    )}
                </div>

                <Handle type="target" position={Position.Top} className="w-2 h-2" />
                <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
            </Card>
        );
    }

    return (
        <Card className="min-w-[220px] bg-white shadow-sm dark:bg-gray-900 dark:text-gray-300 border-l-4 border-l-red-500">
            <Handle type="target" position={Position.Top} className="w-2 h-2" />
            <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold text-red-500 bg-red-50 dark:bg-red-900/20">
                        Array Filter
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsEditing(true)}>
                        <Edit className="h-3 w-3" />
                    </Button>
                </div>

                <div className="text-[10px] space-y-1">
                    <div className="flex justify-between border-b dark:border-gray-800 pb-1">
                        <span className="text-muted-foreground">Property:</span>
                        <span className="font-mono text-red-400">{editData.property || "(root)"}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                        <span className="text-muted-foreground italic">{editData.condition}:</span>
                        <span className="font-mono truncate max-w-[100px] text-red-300">{editData.value}</span>
                    </div>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
        </Card>
    );
}
