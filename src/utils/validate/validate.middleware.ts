import { NextFunction, Request, Response } from 'express';

import Joi from 'joi';
import httpStatus from 'http-status';
import ApiError from '../errors/ApiError';
import pick from '../pick';

const validate =
  (schema: Record<string, any>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    // Pick only the schema keys relevant for validation
    const validSchema = pick(schema, ['params', 'query', 'body']);
    const object = pick(req, Object.keys(validSchema));

    // Compile and validate, setting stripUnknown to true
    const { value, error } = Joi.compile(validSchema)
      .prefs({ errors: { label: 'key' }, stripUnknown: true }) // Strip unknown fields
      .validate(object);

    if (error) {
      const errorMessage = error.details.map((details) => details.message).join(', ');
      return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
    }

    // Merge the validated values back into the request object
    Object.assign(req, value);
    return next();
  };

export default validate;
