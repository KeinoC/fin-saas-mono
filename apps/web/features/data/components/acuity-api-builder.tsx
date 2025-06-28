'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Code, Play, Settings } from 'lucide-react';
import { 
  ACUITY_API_ENDPOINTS, 
  getEndpointDisplayName, 
  getAvailableSubEndpoints, 
  getEndpointParams,
  type AcuityEndpointParam,
  type AcuitySubEndpoint 
} from '@/lib/services/acuity-api-config';

interface AcuityAPIBuilderProps {
  onFetch: (config: AcuityAPIConfig) => void;
  isLoading?: boolean;
}

export interface AcuityAPIConfig {
  endpoint: string;
  subEndpoint?: string;
  idValue?: string;
  queryParams: Record<string, any>;
  bodyParams: Record<string, any>;
  builtUrl: string;
  method: string;
}

export function AcuityAPIBuilder({ onFetch, isLoading }: AcuityAPIBuilderProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [selectedSubEndpoint, setSelectedSubEndpoint] = useState<string>('');
  const [idValue, setIdValue] = useState<string>('');
  const [queryParams, setQueryParams] = useState<Record<string, any>>({});
  const [bodyParams, setBodyParams] = useState<Record<string, any>>({});
  const [builtUrl, setBuiltUrl] = useState<string>('');

  const availableEndpoints = Object.keys(ACUITY_API_ENDPOINTS);
  const availableSubEndpoints = selectedEndpoint ? getAvailableSubEndpoints(selectedEndpoint) : [];
  const { queryParams: availableQueryParams, bodyParams: availableBodyParams } = 
    getEndpointParams(selectedEndpoint, selectedSubEndpoint);

  useEffect(() => {
    buildUrl();
  }, [selectedEndpoint, selectedSubEndpoint, idValue, queryParams]);

  const buildUrl = () => {
    if (!selectedEndpoint) {
      setBuiltUrl('');
      return;
    }

    const baseEndpoint = ACUITY_API_ENDPOINTS[selectedEndpoint];
    let url = `https://acuityscheduling.com/api/v1${baseEndpoint.path}`;

    if (selectedSubEndpoint) {
      let subPath = selectedSubEndpoint;
      if (subPath.includes('{id}') && idValue) {
        subPath = subPath.replace('{id}', idValue);
      }
      url += subPath;
    }

    const queryString = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        queryString.append(key, value.toString());
      }
    });

    if (queryString.toString()) {
      url += `?${queryString.toString()}`;
    }

    setBuiltUrl(url);
  };

  const handleEndpointChange = (endpoint: string) => {
    setSelectedEndpoint(endpoint);
    setSelectedSubEndpoint('');
    setIdValue('');
    setQueryParams({});
    setBodyParams({});
  };

  const handleSubEndpointChange = (subEndpoint: string) => {
    setSelectedSubEndpoint(subEndpoint);
    setIdValue('');
    setQueryParams({});
    setBodyParams({});
  };

  const handleParamChange = (paramName: string, value: any, isBodyParam = false) => {
    if (isBodyParam) {
      setBodyParams(prev => ({ ...prev, [paramName]: value }));
    } else {
      setQueryParams(prev => ({ ...prev, [paramName]: value }));
    }
  };

  const handleFetch = () => {
    const config: AcuityAPIConfig = {
      endpoint: selectedEndpoint,
      subEndpoint: selectedSubEndpoint,
      idValue,
      queryParams,
      bodyParams,
      builtUrl,
      method: selectedSubEndpoint ? 
        availableSubEndpoints.find(s => s.path === selectedSubEndpoint)?.method || 'GET' :
        ACUITY_API_ENDPOINTS[selectedEndpoint]?.method || 'GET'
    };
    onFetch(config);
  };

  const renderParamInput = (param: AcuityEndpointParam, value: any, onChange: (value: any) => void) => {
    const inputId = `param-${param.name}`;
    
    switch (param.type) {
      case 'date':
        return (
          <Input
            id={inputId}
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1"
          />
        );
      case 'number':
        return (
          <Input
            id={inputId}
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
            className="mt-1"
          />
        );
      case 'boolean':
        return (
          <Select value={value?.toString() || ''} onValueChange={(val) => onChange(val === 'true')}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select...</SelectItem>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        );
      case 'select':
        return (
          <Select value={value?.toString() || ''} onValueChange={(val) => onChange(val)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select...</SelectItem>
              {param.options?.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            id={inputId}
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1"
          />
        );
    }
  };

  const needsIdValue = selectedSubEndpoint && selectedSubEndpoint.includes('{id}');
  const canFetch = selectedEndpoint && (!needsIdValue || idValue);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Acuity API Builder</h3>
        </div>

        <div className="space-y-4">
          {/* Step 1: Select Endpoint */}
          <div>
            <Label htmlFor="endpoint-select">1. Select API Endpoint</Label>
            <Select value={selectedEndpoint} onValueChange={handleEndpointChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an endpoint..." />
              </SelectTrigger>
              <SelectContent>
                {availableEndpoints.map((endpoint) => (
                  <SelectItem key={endpoint} value={endpoint}>
                    {getEndpointDisplayName(endpoint)} ({endpoint})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedEndpoint && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {ACUITY_API_ENDPOINTS[selectedEndpoint].description}
              </p>
            )}
          </div>

          {/* Step 2: Select Sub-endpoint (if available) */}
          {availableSubEndpoints.length > 0 && (
            <div>
              <Label htmlFor="subendpoint-select">2. Select Sub-endpoint (Optional)</Label>
              <Select value={selectedSubEndpoint} onValueChange={handleSubEndpointChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Use base endpoint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Use base endpoint</SelectItem>
                  {availableSubEndpoints.map((sub) => (
                    <SelectItem key={sub.path} value={sub.path}>
                      {sub.name} ({sub.path})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSubEndpoint && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {availableSubEndpoints.find(s => s.path === selectedSubEndpoint)?.description}
                </p>
              )}
            </div>
          )}

          {/* Step 3: ID Value (if needed) */}
          {needsIdValue && (
            <div>
              <Label htmlFor="id-input">3. Enter ID Value</Label>
              <Input
                id="id-input"
                type="text"
                value={idValue}
                onChange={(e) => setIdValue(e.target.value)}
                placeholder="Enter the ID (e.g., appointment ID, block ID)"
                className="mt-1"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                This will replace {'{id}'} in the endpoint path
              </p>
            </div>
          )}

          {/* Step 4: Query Parameters */}
          {availableQueryParams.length > 0 && (
            <div>
              <Label>4. Query Parameters</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {availableQueryParams.map((param) => (
                  <div key={param.name}>
                    <Label htmlFor={`param-${param.name}`} className="flex items-center gap-2">
                      {param.name}
                      {param.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                    </Label>
                    {renderParamInput(
                      param,
                      queryParams[param.name],
                      (value) => handleParamChange(param.name, value, false)
                    )}
                    {param.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{param.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Body Parameters (for POST/PUT requests) */}
          {availableBodyParams.length > 0 && (
            <div>
              <Label>5. Body Parameters</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {availableBodyParams.map((param) => (
                  <div key={param.name}>
                    <Label htmlFor={`body-param-${param.name}`} className="flex items-center gap-2">
                      {param.name}
                      {param.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                    </Label>
                    {renderParamInput(
                      param,
                      bodyParams[param.name],
                      (value) => handleParamChange(param.name, value, true)
                    )}
                    {param.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{param.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* URL Preview & Fetch */}
      {selectedEndpoint && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Code className="h-4 w-4 text-green-600" />
            <h4 className="font-medium">Generated API Call</h4>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">
                {selectedSubEndpoint ? 
                  availableSubEndpoints.find(s => s.path === selectedSubEndpoint)?.method || 'GET' :
                  ACUITY_API_ENDPOINTS[selectedEndpoint]?.method || 'GET'
                }
              </Badge>
              <span className="font-mono text-sm">{builtUrl}</span>
            </div>
            
            {Object.keys(bodyParams).length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Body:</p>
                <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded border">
                  {JSON.stringify(bodyParams, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <Button 
            onClick={handleFetch}
            disabled={!canFetch || isLoading}
            className="w-full"
          >
            <Play className="mr-2 h-4 w-4" />
            {isLoading ? 'Fetching...' : 'Fetch Data'}
          </Button>
        </Card>
      )}
    </div>
  );
} 