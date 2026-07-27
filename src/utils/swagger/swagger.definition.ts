import config from '../../config/config';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Amoeba API',
    version: '1.0.0',
    description: 'Amoeba REST API documentation',
    license: {
      name: 'MIT',
      url: 'https://github.com/kudzaimupita/amoeba-api',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}/v1`,
      description: 'Development Server',
    },
  ],
};

export default swaggerDefinition;
