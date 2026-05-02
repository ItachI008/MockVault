import { faker } from '@faker-js/faker';

const getSchemaType = (schema: any): string => {
  if (Array.isArray(schema.type)) {
    return schema.type.find((type: string) => type !== 'null') || 'null';
  }

  if (schema.type) return schema.type;
  if (schema.properties) return 'object';
  if (schema.items) return 'array';
  return 'string';
};

const generateString = (schema: any, propertyName?: string): string => {
  if (schema.format === 'email' || propertyName?.toLowerCase().includes('email')) {
    return faker.internet.email();
  }

  if (schema.format === 'uuid' || propertyName?.toLowerCase() === 'id') {
    return faker.string.uuid();
  }

  if (schema.format === 'date-time') return faker.date.recent().toISOString();
  if (schema.format === 'date') return faker.date.recent().toISOString().slice(0, 10);
  if (schema.format === 'uri' || schema.format === 'url') return faker.internet.url();
  if (propertyName?.toLowerCase().includes('name')) return faker.person.fullName();
  if (propertyName?.toLowerCase().includes('phone')) return faker.phone.number();
  return faker.lorem.words({ min: 1, max: 3 });
};

export const generateMockData = (schema: any, propertyName?: string): any => {
  if (!schema || typeof schema !== 'object') return null;

  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.examples) && schema.examples.length > 0) return schema.examples[0];
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0];

  switch (getSchemaType(schema)) {
    case 'string':
      return generateString(schema, propertyName);
    case 'number':
      return faker.number.float({ min: schema.minimum ?? 1, max: schema.maximum ?? 1000, fractionDigits: 2 });
    case 'integer':
      return faker.number.int({ min: schema.minimum ?? 1, max: schema.maximum ?? 1000 });
    case 'boolean':
      return faker.datatype.boolean();
    case 'array':
      return Array.from({ length: schema.minItems ?? 2 }).map(() => generateMockData(schema.items || {}));
    case 'object': {
      const obj: any = {};
      if (schema.properties) {
        Object.keys(schema.properties).forEach((key) => {
          obj[key] = generateMockData(schema.properties[key], key);
        });
      }
      return obj;
    }
    default:
      return null;
  }
};
