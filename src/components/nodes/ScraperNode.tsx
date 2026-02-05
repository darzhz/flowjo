import { useState } from "react";
import { Handle, Position } from "reactflow";
import { Edit, Save, Plus, Trash2 } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

export interface ScraperRule {
    selector: string;
    attribute: string;
    key: string;
}

export interface ScraperNodeData {
    container_selector?: string;
    rules: ScraperRule[];
    onSave: (id: string, data: ScraperNodeData) => void;
}

export default function ScraperNode({ data, id }: { data: ScraperNodeData; id: string }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<ScraperNodeData>({
        container_selector: data.container_selector || "",
        rules: data.rules || [{ selector: "img", attribute: "src", key: "url" }],
        onSave: data.onSave
    });

    const handleSave = () => {
        data.onSave(id, editData);
        setIsEditing(false);
    };

    const addRule = () => {
        setEditData({
            ...editData,
            rules: [...editData.rules, { selector: "", attribute: "text", key: "" }]
        });
    };

    const updateRule = (index: number, field: keyof ScraperRule, value: string) => {
        const newRules = [...editData.rules];
        newRules[index][field] = value;
        setEditData({ ...editData, rules: newRules });
    };

    const removeRule = (index: number) => {
        setEditData({
            ...editData,
            rules: editData.rules.filter((_, i) => i !== index)
        });
    };

    if (isEditing) {
        return (
            <Card className="min-w-[400px] p-4 bg-white shadow-lg dark:bg-gray-950 dark:text-gray-300 border-primary/50 ring-1 ring-primary/20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Badge variant="outline">Scraper</Badge> Extraction Rules
                    </h3>
                    <Button size="sm" onClick={handleSave} className="h-8">
                        <Save className="h-4 w-4 mr-1" />
                        Save
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="grid gap-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Container Selector (Optional)</label>
                        <Input
                            value={editData.container_selector}
                            onChange={(e) => setEditData({ ...editData, container_selector: e.target.value })}
                            placeholder="e.g. .post-item or .thing"
                            className="h-8 text-xs font-mono"
                        />
                        <p className="text-[10px] text-muted-foreground italic">Leave empty for single item extraction.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fields to Extract</label>
                        {editData.rules.map((rule, index) => (
                            <div key={index} className="flex gap-2 items-center bg-muted/30 p-2 rounded-md border border-dashed border-muted">
                                <Input
                                    value={rule.selector}
                                    onChange={(e) => updateRule(index, "selector", e.target.value)}
                                    placeholder="Selector"
                                    className="h-7 text-[10px] flex-1 font-mono"
                                />
                                <Input
                                    value={rule.attribute}
                                    onChange={(e) => updateRule(index, "attribute", e.target.value)}
                                    placeholder="Attr (text/src)"
                                    className="h-7 text-[10px] w-20 font-mono"
                                />
                                <Input
                                    value={rule.key}
                                    onChange={(e) => updateRule(index, "key", e.target.value)}
                                    placeholder="JSON Key"
                                    className="h-7 text-[10px] w-20 font-mono"
                                />
                                <Button variant="ghost" size="sm" onClick={() => removeRule(index)} className="h-7 w-7 p-0 text-red-500">
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addRule} className="w-full h-7 text-[10px]">
                            <Plus className="h-3 w-3 mr-1" /> Add Rule
                        </Button>
                    </div>
                </div>

                <Handle type="target" position={Position.Top} className="w-2 h-2" />
                <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
            </Card>
        );
    }

    return (
        <Card className="min-w-[250px] bg-white shadow-sm dark:bg-gray-900 dark:text-gray-300 border-l-4 border-l-blue-500">
            <Handle type="target" position={Position.Top} className="w-2 h-2" />
            <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20">
                        DOM Scraper
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsEditing(true)}>
                        <Edit className="h-3 w-3" />
                    </Button>
                </div>

                {editData.container_selector && (
                    <div className="text-[10px] text-muted-foreground bg-muted/50 p-1 rounded font-mono truncate">
                        List: {editData.container_selector}
                    </div>
                )}

                <div className="space-y-1">
                    {editData.rules.slice(0, 3).map((rule, i) => (
                        <div key={i} className="text-[10px] flex justify-between">
                            <span className="text-muted-foreground">{rule.key}:</span>
                            <span className="font-mono text-blue-400">{rule.selector}</span>
                        </div>
                    ))}
                    {editData.rules.length > 3 && (
                        <div className="text-[9px] text-center text-muted-foreground italic">
                            +{editData.rules.length - 3} more rules
                        </div>
                    )}
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
        </Card>
    );
}
