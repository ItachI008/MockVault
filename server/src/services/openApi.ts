export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch'] as const;

export interface OpenApiEndpointContract {
  path: string;
  method: HttpMethod;
  operationId?: string;
  summary?: string;
  responseStatus: string;
  responseSchema: any;
}

const isRecord = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const decodePointerSegment = (segment: string) => segment.replace(/~1/g, '/').replace(/~0/g, '~');

const getByJsonPointer = (document: any, pointer: string): any => {
  return pointer
    .replace(/^#\//, '')
    .split('/')
    .map(decodePointerSegment)
    .reduce((current, segment) => (current === undefined ? undefined : current[segment]), document);
};

export const parseOpenApiSpec = (rawSpec: string): any => {
  try {
    const spec = JSON.parse(rawSpec);

    if (!isRecord(spec) || !isRecord(spec.paths)) {
      throw new Error('OpenAPI document must contain a paths object.');
    }

    return spec;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('OpenAPI spec must be valid JSON. YAML support is not enabled in this build.');
    }

    throw error;
  }
};

export const resolveSchemaRefs = (document: any, schema: any, seenRefs = new Set<string>()): any => {
  if (!isRecord(schema)) return schema;

  if (typeof schema.$ref === 'string') {
    if (!schema.$ref.startsWith('#/') || seenRefs.has(schema.$ref)) return schema;
    seenRefs.add(schema.$ref);
    const resolved = getByJsonPointer(document, schema.$ref);
    return resolveSchemaRefs(document, resolved, seenRefs);
  }

  if (Array.isArray(schema)) {
    return schema.map((item) => resolveSchemaRefs(document, item, new Set(seenRefs)));
  }

  return Object.fromEntries(
    Object.entries(schema).map(([key, value]) => [key, resolveSchemaRefs(document, value, new Set(seenRefs))])
  );
};

const pickJsonResponse = (document: any, operation: any): Pick<OpenApiEndpointContract, 'responseStatus' | 'responseSchema'> => {
  const responses = isRecord(operation.responses) ? operation.responses : {};
  const status =
    ['200', '201', '202', '204', 'default'].find((candidate) => responses[candidate]) ||
    Object.keys(responses)[0] ||
    '200';

  const response = responses[status];
  const content = isRecord(response?.content) ? response.content : {};
  const mediaType = content['application/json'] || Object.values(content)[0];
  const responseSchema = isRecord(mediaType) ? mediaType.schema : undefined;

  return {
    responseStatus: status,
    responseSchema: responseSchema ? resolveSchemaRefs(document, responseSchema) : { type: 'object', properties: {} },
  };
};

export const extractOpenApiEndpoints = (document: any): OpenApiEndpointContract[] => {
  if (!isRecord(document.paths)) return [];

  return Object.entries(document.paths).flatMap(([path, pathConfig]) => {
    if (!isRecord(pathConfig)) return [];

    return HTTP_METHODS.flatMap((method) => {
      const operation = pathConfig[method];
      if (!isRecord(operation)) return [];

      return [
        {
          path,
          method: method.toUpperCase() as HttpMethod,
          operationId: typeof operation.operationId === 'string' ? operation.operationId : undefined,
          summary: typeof operation.summary === 'string' ? operation.summary : undefined,
          ...pickJsonResponse(document, operation),
        },
      ];
    });
  });
};

export const getEndpointContract = (document: any, path: string, method: string): OpenApiEndpointContract | undefined => {
  return extractOpenApiEndpoints(document).find(
    (endpoint) => endpoint.path === path && endpoint.method === method.toUpperCase()
  );
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizePath = (path: string) => {
  const normalized = `/${path}`.replace(/\/+/g, '/');
  return normalized.length > 1 ? normalized.replace(/\/$/, '') : normalized;
};

export const matchesOpenApiPath = (templatePath: string, requestPath: string): boolean => {
  const template = normalizePath(templatePath);
  const requested = normalizePath(requestPath);
  const pattern = template
    .split('/')
    .map((segment) => {
      if (/^\{[^}]+\}$/.test(segment) || /^:[^/]+$/.test(segment)) {
        return '[^/]+';
      }

      return escapeRegex(segment);
    })
    .join('/');

  return new RegExp(`^${pattern}$`).test(requested);
};
