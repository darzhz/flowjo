import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// Types for request data and responses
export interface RequestData {
  url: string;
  headers?: Record<string, string>;
  data?: any;
  params?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

// Abstract Request Creator
abstract class RequestCreator {
    abstract createRequestConfig(data: RequestData): AxiosRequestConfig;

  async execute<T = any>(data: RequestData): Promise<ApiResponse<T>> {
    try {
      const config = this.createRequestConfig(data);
      const response: AxiosResponse = await axios(config);
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status || 500
      };
    }
  }
}

// Concrete Creators for different HTTP methods
class GetRequestCreator extends RequestCreator {
   createRequestConfig(data: RequestData): AxiosRequestConfig {
    return {
      method: 'GET',
      url: data.url,
      headers: data.headers,
      params: data.params
    };
  }
}

class PostRequestCreator extends RequestCreator {
   createRequestConfig(data: RequestData): AxiosRequestConfig {
    return {
      method: 'POST',
      url: data.url,
      headers: data.headers,
      data: data.data
    };
  }
}

class PatchRequestCreator extends RequestCreator {
   createRequestConfig(data: RequestData): AxiosRequestConfig {
    return {
      method: 'PATCH',
      url: data.url,
      headers: data.headers,
      data: data.data
    };
  }
}

class DeleteRequestCreator extends RequestCreator {
   createRequestConfig(data: RequestData): AxiosRequestConfig {
    return {
      method: 'DELETE',
      url: data.url,
      headers: data.headers,
      params: data.params
    };
  }
}

// Request Factory
class ApiRequestFactory {
  static createRequest(method: 'GET' | 'POST' | 'PATCH' | 'DELETE'): RequestCreator {
    switch (method) {
      case 'GET':
        return new GetRequestCreator();
      case 'POST':
        return new PostRequestCreator();
      case 'PATCH':
        return new PatchRequestCreator();
      case 'DELETE':
        return new DeleteRequestCreator();
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  // Helper methods for different content types
  static createJsonRequest(method: 'GET' | 'POST' | 'PATCH' | 'DELETE'): RequestCreator {
    const request = this.createRequest(method);
    return request;
  }

  static createFormDataRequest(method: 'POST' | 'PATCH'): RequestCreator {
    const request = this.createRequest(method);
    const originalCreate = request.createRequestConfig.bind(request);
    
    request.createRequestConfig = (data: RequestData): AxiosRequestConfig => {
      const formData = new FormData();
      if (data.data) {
        Object.entries(data.data).forEach(([key, value]) => {
          formData.append(key, value as string);
        });
      }
      
      const config = originalCreate(data);
      config.headers = {
        ...config.headers,
        'Content-Type': 'application/x-www-form-urlencoded'
      };
      config.data = formData;
      return config;
    };
    
    return request;
  }

  static createMultipartRequest(method: 'POST' | 'PATCH'): RequestCreator {
    const request = this.createRequest(method);
    const originalCreate = request.createRequestConfig.bind(request);
    
    request.createRequestConfig = (data: RequestData): AxiosRequestConfig => {
      const formData = new FormData();
      if (data.data) {
        Object.entries(data.data).forEach(([key, value]) => {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, JSON.stringify(value));
          }
        });
      }
      
      const config = originalCreate(data);
      config.headers = {
        ...config.headers,
        'Content-Type': 'multipart/form-data'
      };
      config.data = formData;
      return config;
    };
    
    return request;
  }
}

export { ApiRequestFactory };