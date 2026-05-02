import Ajv from 'ajv';
import MockEndpoint from '../models/MockEndpoint';
import SchemaDefinition from '../models/Schema';
import { generateMockData } from './mockGenerator';
import { getEndpointContract, parseOpenApiSpec } from './openApi';

export interface ContractReportItem {
  endpointId: string;
  method: string;
  path: string;
  schemaName: string;
  status: 'PASS' | 'FAIL';
  message: string;
  latencyMs: number;
}

export interface ContractReport {
  passRate: number;
  total: number;
  passed: number;
  failed: number;
  results: ContractReportItem[];
}

const ajv = new Ajv({ allErrors: true, strict: false });

const toJsonSchema = (schema: any): any => {
  if (!schema || typeof schema !== 'object') return schema;
  if (Array.isArray(schema)) return schema.map(toJsonSchema);

  const next: any = {};
  Object.entries(schema).forEach(([key, value]) => {
    if (key !== 'nullable') next[key] = toJsonSchema(value);
  });

  if (schema.nullable && typeof schema.type === 'string') {
    next.type = [schema.type, 'null'];
  }

  return next;
};

export const buildContractReport = async (userId?: string): Promise<ContractReport> => {
  const schemaQuery = userId ? { userId } : {};
  const userSchemas = await SchemaDefinition.find(schemaQuery).lean();
  const schemaIds = userSchemas.map(s => s._id.toString());
  
  const endpoints = await MockEndpoint.find(userId ? { schemaId: { $in: schemaIds } } : {}).sort({ updatedAt: -1 }).lean();
  const schemaById = new Map(userSchemas.map((schema) => [schema._id.toString(), schema]));

  const results: ContractReportItem[] = endpoints.map((endpoint) => {
    const schemaDoc = schemaById.get(endpoint.schemaId);

    if (!schemaDoc) {
      return {
        endpointId: endpoint._id.toString(),
        method: endpoint.method,
        path: endpoint.path,
        schemaName: 'Deleted schema',
        status: 'FAIL',
        message: 'Schema definition no longer exists.',
        latencyMs: endpoint.latencyMs,
      };
    }

    try {
      const spec = parseOpenApiSpec(schemaDoc.openapiSpec);
      const contract = getEndpointContract(spec, endpoint.path, endpoint.method);

      if (!contract) {
        return {
          endpointId: endpoint._id.toString(),
          method: endpoint.method,
          path: endpoint.path,
          schemaName: schemaDoc.name,
          status: 'FAIL',
          message: 'Endpoint is not present in the saved OpenAPI contract.',
          latencyMs: endpoint.latencyMs,
        };
      }

      const validator = ajv.compile(toJsonSchema(contract.responseSchema));
      const valid = validator(generateMockData(contract.responseSchema));

      return {
        endpointId: endpoint._id.toString(),
        method: endpoint.method,
        path: endpoint.path,
        schemaName: schemaDoc.name,
        status: valid ? 'PASS' : 'FAIL',
        message: valid ? 'Generated response matches the saved response schema.' : ajv.errorsText(validator.errors),
        latencyMs: endpoint.latencyMs,
      };
    } catch (error) {
      return {
        endpointId: endpoint._id.toString(),
        method: endpoint.method,
        path: endpoint.path,
        schemaName: schemaDoc.name,
        status: 'FAIL',
        message: (error as Error).message,
        latencyMs: endpoint.latencyMs,
      };
    }
  });

  const passed = results.filter((result) => result.status === 'PASS').length;
  const total = results.length;

  return {
    passRate: total === 0 ? 0 : Math.round((passed / total) * 100),
    total,
    passed,
    failed: total - passed,
    results,
  };
};
