import { Handle, Position } from "reactflow";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useState } from "react";
// import { NodeData } from "../../types";

export default function ConditionalNode({ id, data }: { id: string, data: any }) {

  const [condition, setCondition] = useState(data.condition || 'equal');
  const [targetValue, setTargetValue] = useState(data.targetValue || '');

  const updateData = (key: string, value: any) => {
    if (key === 'condition') setCondition(value);
    if (key === 'targetValue') setTargetValue(value);
    data.onSave?.(id, { ...data, [key]: value });
  }

  return (
    <Card className="min-w-[250px] bg-white border text-foreground dark:bg-gray-900 dark:text-gray-300 border-yellow-500 shadow-md">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-yellow-500" />

      <CardHeader className="p-3 pb-2 bg-yellow-50 dark:bg-yellow-900/20 font-bold text-sm text-yellow-700 dark:text-yellow-400">
        ⚡ Condition
      </CardHeader>

      <CardContent className="p-3 space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Operator</Label>
          <Select onValueChange={(v) => updateData('condition', v)} value={condition}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equal">Equals (==)</SelectItem>
              <SelectItem value="notEqual">Not Equals (!=)</SelectItem>
              <SelectItem value="greaterThan">Greater Than (&gt;)</SelectItem>
              <SelectItem value="lessThan">Less Than (&lt;)</SelectItem>
              <SelectItem value="contains">Contains (String)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Target Value</Label>
          <Input
            value={targetValue}
            onChange={(e) => updateData('targetValue', e.target.value)}
            className="h-8 text-xs"
            placeholder="Value to compare..."
          />
          <p className="text-[10px] text-muted-foreground">Compares Input ⚡ vs Target</p>
        </div>
      </CardContent>

      {/* True Handle */}
      <div className="absolute right-[-6px] top-[30px] flex items-center flex-row-reverse">
        <Handle
          id="true"
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-green-500 top-[37px]"
        />
        <span className="text-[10px] text-green-600 font-bold mr-2 mt-[6px]">True</span>
      </div>

      {/* False Handle */}
      <div className="absolute right-[-6px] bottom-[30px] flex items-center flex-row-reverse">
        <Handle
          id="false"
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-red-500 bottom-[25px]"
        />
        <span className="text-[10px] text-red-600 font-bold mr-2 mb-[12px]">False</span>
      </div>

    </Card>
  );
}
