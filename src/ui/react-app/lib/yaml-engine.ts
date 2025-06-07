import yaml from 'js-yaml';

export const yamlEngine = {
  parse: (str: string) => yaml.load(str, { schema: yaml.JSON_SCHEMA }) as object,
  stringify: (data: object) => yaml.dump(data),
};

export const matterOptions = {
  engines: {
    // @ts-ignore
    yaml: yamlEngine,
  }
}; 