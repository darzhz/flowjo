import { Button } from "./button";
import { Input } from "./input";
import { Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

interface KeyValuePair {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
}

interface KeyValueListProps {
    initialData: Record<string, string>;
    onChange: (data: Record<string, string>) => void;
    placeholderKey?: string;
    placeholderValue?: string;
}

export function KeyValueList({ initialData, onChange, placeholderKey = "Key", placeholderValue = "Value" }: KeyValueListProps) {
    const [pairs, setPairs] = useState<KeyValuePair[]>(() => {
        return Object.entries(initialData).map(([key, value]) => ({
            id: key + Math.random().toString(), // Simple ID generation
            key,
            value,
            enabled: true
        }));
    });

    useEffect(() => {
        const newData: Record<string, string> = {};
        pairs.forEach(p => {
            if (p.enabled && p.key) {
                newData[p.key] = p.value;
            }
        });
        onChange(newData);
    }, [pairs]);

    const addPair = () => {
        setPairs([...pairs, { id: Math.random().toString(), key: "", value: "", enabled: true }]);
    };

    const removePair = (id: string) => {
        setPairs(pairs.filter(p => p.id !== id));
    };

    const updatePair = (id: string, field: 'key' | 'value', newValue: string) => {
        setPairs(pairs.map(p => p.id === id ? { ...p, [field]: newValue } : p));
    };

    return (
        <div className="space-y-2">
            {pairs.map((pair) => (
                <div key={pair.id} className="flex gap-2 items-center">
                    <Input
                        className="h-7 text-xs font-mono flex-1"
                        placeholder={placeholderKey}
                        value={pair.key}
                        onChange={(e) => updatePair(pair.id, 'key', e.target.value)}
                    />
                    <Input
                        className="h-7 text-xs font-mono flex-1"
                        placeholder={placeholderValue}
                        value={pair.value}
                        onChange={(e) => updatePair(pair.id, 'value', e.target.value)}
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500" onClick={() => removePair(pair.id)}>
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            ))}
            <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={addPair}>
                <Plus className="w-3 h-3 mr-1" /> Add Item
            </Button>
        </div>
    );
}
