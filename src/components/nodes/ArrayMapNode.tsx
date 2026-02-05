import { useState } from "react";
import { Handle, Position } from "reactflow";
import { Edit, Save, ListTree } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

export interface ArrayMapNodeData {
    path: string;
    onSave: (id: string, data: ArrayMapNodeData) => void;
}

export default function ArrayMapNode({ data, id }: { data: ArrayMapNodeData; id: string }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<ArrayMapNodeData>({
        path: data.path || "",
        onSave: data.onSave
    });

    const handleSave = () => {
        data.onSave(id, editData);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <Card className="min-w-[300px] p-4 bg-white shadow-lg dark:bg-gray-950 dark:text-gray-300 border-primary/50 ring-1 ring-primary/20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Badge variant="outline">Array Map</Badge> Extraction
                    </h3>
                    <Button size="sm" onClick={handleSave} className="h-8">
                        <Save className="h-4 w-4 mr-1" />
                        Save
                    </Button>
                </div>

                <div className="space-y-3">
                    <div className="grid gap-1">
                        <label className="text-[10px] text-muted-foreground uppercase">Property Path</label>
                        <Input
                            value={editData.path}
                            onChange={(e) => setEditData({ ...editData, path: e.target.value })}
                            placeholder="e.g. data.url or attributes.src"
                            className="h-8 text-xs font-mono"
                        />
                        <p className="text-[9px] text-muted-foreground italic">Use dots for nested properties.</p>
                    </div>
                </div>

                <Handle type="target" position={Position.Top} className="w-2 h-2" />
                <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
            </Card>
        );
    }

    return (
        <Card className="min-w-[200px] bg-white shadow-sm dark:bg-gray-900 dark:text-gray-300 border-l-4 border-l-orange-500">
            <Handle type="target" position={Position.Top} className="w-2 h-2" />
            <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ListTree className="h-3 w-3 text-orange-500" />
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20">
                            Array Map
                        </Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsEditing(true)}>
                        <Edit className="h-3 w-3" />
                    </Button>
                </div>

                <div className="text-[10px] space-y-1">
                    <div className="flex justify-between border-b dark:border-gray-800 pb-1">
                        <span className="text-muted-foreground">Extract:</span>
                        <span className="font-mono text-orange-400">{editData.path || "(identity)"}</span>
                    </div>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
        </Card>
    );
}
