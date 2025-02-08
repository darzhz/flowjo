import { useState } from "react";
import { Handle, Position } from "reactflow";
import { Edit, Save } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { ApiRequestFactory, ApiResponse } from "../../lib/ApiFactroy";

// Enhanced type definition
export interface HttpRequestNodeData {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  endpoint: string;
  params?: Record<string, string>;
  body?: any;
  headers?: Record<string, string>;
  contentType?: 'json' | 'formData' | 'multipart';
  onSave: (id: string, data: HttpRequestNodeData) => void;
  lastResponse?: ApiResponse;
}

export default function HttpRequestNode({
  data,
  id,
}: {
  data: HttpRequestNodeData;
  id: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<ApiResponse | undefined>(data.lastResponse);

  const handleSave = () => {
    data.onSave(id, editData);
    setIsEditing(false);
  };

  const executeRequest = async () => {
    setIsLoading(true);
    try {
      let request;
      
      // Create appropriate request based on content type
      switch (editData.contentType) {
        case 'formData':
          request = ApiRequestFactory.createFormDataRequest(editData.method as 'POST' | 'PATCH');
          break;
        case 'multipart':
          request = ApiRequestFactory.createMultipartRequest(editData.method as 'POST' | 'PATCH');
          break;
        default:
          request = ApiRequestFactory.createJsonRequest(editData.method);
      }

      const response = await request.execute({
        url: editData.endpoint,
        params: editData.params,
        data: editData.body,
        headers: editData.headers,
      });

      setLastResponse(response);
      data.lastResponse = response;
    } catch (error) {
      setLastResponse({
        success: false,
        error: 'Request failed',
        status: 500
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <Card className="min-w-[300px] bg-white border-primary p-4 dark:bg-gray-900 dark:text-gray-300">
        <div className="space-y-4">
          <select
            value={editData.method}
            onChange={(e) =>
              setEditData({ ...editData, method: e.target.value as HttpRequestNodeData['method'] })
            }
            className="w-full p-2 border rounded"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
          
          <Input
            value={editData.endpoint}
            onChange={(e) =>
              setEditData({ ...editData, endpoint: e.target.value })
            }
            placeholder="URL"
          />

          <select
            value={editData.contentType}
            onChange={(e) =>
              setEditData({ ...editData, contentType: e.target.value as 'json' | 'formData' | 'multipart' })
            }
            className="w-full p-2 border rounded"
          >
            <option value="json">JSON</option>
            <option value="formData">Form Data</option>
            <option value="multipart">Multipart Form</option>
          </select>

          <Textarea
            value={JSON.stringify(editData.params, null, 2)}
            onChange={(e) => {
              try {
                setEditData({ ...editData, params: JSON.parse(e.target.value) });
              } catch {}
            }}
            placeholder="Query Params (JSON)"
          />

          <Textarea
            value={JSON.stringify(editData.body, null, 2)}
            onChange={(e) => {
              try {
                setEditData({ ...editData, body: JSON.parse(e.target.value) });
              } catch {}
            }}
            placeholder="Request Body (JSON)"
          />

          <Textarea
            value={JSON.stringify(editData.headers, null, 2)}
            onChange={(e) => {
              try {
                setEditData({ ...editData, headers: JSON.parse(e.target.value) });
              } catch {}
            }}
            placeholder="Headers (JSON)"
          />

          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="min-w-[300px] bg-white border-border dark:border-gray-700 text-foreground dark:bg-gray-900 dark:text-gray-300">
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-primary/10 text-primary">
            HTTP Request
          </Badge>
          <Badge variant={data.method === "GET" ? "secondary" : "destructive"}>
            {data.method}
          </Badge>
        </div>
        <div className="text-sm truncate text-muted-foreground">
          {data.endpoint}
        </div>
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="default"
              className="text-xs"
              onClick={executeRequest}
              disabled={isLoading}
            >
              {isLoading ? "Running..." : "Execute"}
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              Success ({lastResponse?.success ? "1" : "0"})
            </Badge>
            <Badge variant="outline" className="text-xs">
              Fail ({!lastResponse?.success ? "1" : "0"})
            </Badge>
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="success"
        className="w-2 h-2 !bg-green-500"
        style={{ left: "30%" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="failure"
        className="w-2 h-2 !bg-red-500"
        style={{ left: "70%" }}
      />
    </Card>
  );
}
// import type { HttpRequestNodeData } from "../../types";
// import { Input } from "../../components/ui/input";
// import { Textarea } from "../../components/ui/textarea";
// import { Edit, Save } from "lucide-react";
// import { Button } from "../../components/ui/button";
// import { Card } from "../ui/card";
// import { useState } from "react";
// import { Handle, Position } from "reactflow";
// import { Badge } from "../ui/badge";
// export default function HttpRequestNode({
//     data,
//     id,
//   }: {
//     data: HttpRequestNodeData;
//     id: string;
//   }) {
//     const [isEditing, setIsEditing] = useState(false);
//     const [editData, setEditData] = useState(data);
  
//     const handleSave = () => {
//       data.onSave(id, editData);
//       setIsEditing(false);
//     };
  
//     if (isEditing) {
//       return (
//         <Card className="min-w-[300px] bg-white border-primary p-4 dark:bg-gray-900 dark:text-gray-300">
//           <div className="space-y-4">
//             <Input
//               value={editData.method}
//               onChange={(e) =>
//                 setEditData({ ...editData, method: e.target.value })
//               }
//               placeholder="HTTP Method (GET, POST, etc.)"
//             />
//             <Input
//               value={editData.endpoint}
//               onChange={(e) =>
//                 setEditData({ ...editData, endpoint: e.target.value })
//               }
//               placeholder="URL"
//             />
//             <Textarea
//               value={JSON.stringify(editData.params)}
//               onChange={(e) =>
//                 setEditData({ ...editData, params: JSON.parse(e.target.value) })
//               }
//               placeholder="Query Params (JSON)"
//             />
//             <Textarea
//               value={JSON.stringify(editData.body)}
//               onChange={(e) =>
//                 setEditData({ ...editData, body: JSON.parse(e.target.value) })
//               }
//               placeholder="Request Body (JSON)"
//             />
//             <Button onClick={handleSave} className="w-full">
//               <Save className="h-4 w-4 mr-2" />
//               Save
//             </Button>
//           </div>
//         </Card>
//       );
//     }
  
//     return (
//       <Card className="min-w-[300px] bg-white border-border  dark:border-gray-700 text-foreground dark:bg-gray-900 dark:text-gray-300">
//         <Handle type="target" position={Position.Top} className="w-2 h-2" />
//         <div className="p-4 space-y-4">
//           <div className="flex items-center justify-between">
//             <Badge variant="outline" className="bg-primary/10 text-primary">
//               HTTP Request
//             </Badge>
//             <Badge variant={data.method === "GET" ? "secondary" : "destructive"}>
//               {data.method}
//             </Badge>
//           </div>
//           <div className="text-sm truncate text-muted-foreground">
//             {data.endpoint}
//           </div>
//           <div className="flex justify-between items-center">
//             <Button
//               size="sm"
//               variant="outline"
//               className="text-xs"
//               onClick={() => setIsEditing(true)}
//             >
//               <Edit className="h-3 w-3 mr-1" />
//               Edit
//             </Button>
//             <div className="flex items-center space-x-2">
//               <Badge variant="outline" className="text-xs">
//                 Success ()
//               </Badge>
//               <Badge variant="outline" className="text-xs">
//                 Fail ()
//               </Badge>
//             </div>
//           </div>
//         </div>
//         <Handle
//           type="source"
//           position={Position.Bottom}
//           id="success"
//           className="w-2 h-2 !bg-green-500"
//           style={{ left: "30%" }}
//         />
//         <Handle
//           type="source"
//           position={Position.Bottom}
//           id="failure"
//           className="w-2 h-2 !bg-red-500"
//           style={{ left: "70%" }}
//         />
//       </Card>
//     );
//   };