import { memo, useState } from "react";
import { Handle, Position } from "reactflow";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Regex } from "lucide-react";

export default memo(({ id: _id, data }: { id: string, data: any }) => {
    const [path, setPath] = useState(data.path || "");
    const [variable, setVariable] = useState(data.variable || "");

    const handleChange = (newPath: string, newVar: string) => {
        setPath(newPath);
        setVariable(newVar);
        data.onSave?.(_id, { ...data, path: newPath, variable: newVar });
    };

    return (
        <Card className="min-w-[250px] bg-white border text-foreground dark:bg-gray-900 dark:text-gray-300 border-yellow-500 shadow-md">
            <CardHeader className="p-3 pb-2 bg-yellow-50 dark:bg-yellow-900/20">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                    <Regex className="w-4 h-4" /> Capture Value
                </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
                <div className="space-y-1">
                    <Label className="text-xs">Property Path (e.g. data.id)</Label>
                    <Input
                        value={path}
                        onChange={(e) => handleChange(e.target.value, variable)}
                        className="h-8 text-xs font-mono"
                        placeholder="data.token"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Save as Variable</Label>
                    <Input
                        value={variable}
                        onChange={(e) => handleChange(path, e.target.value)}
                        className="h-8 text-xs font-mono"
                        placeholder="auth_token"
                    />
                </div>
                <div className="text-[10px] text-muted-foreground">
                    Variable will be available as <span className="font-mono bg-muted px-1 rounded">{"{{variable}}"}</span> in later nodes.
                </div>
            </CardContent>

            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-yellow-500" />
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-yellow-500" />
        </Card>
    );
});
