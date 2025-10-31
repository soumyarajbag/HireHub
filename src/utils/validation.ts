import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ResponseHandler } from './response';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return ResponseHandler.validationError(
      res,
      'Validation failed',
      errors.array()
    );
  };
};

export const validateRequest = (
  validations: ValidationChain | ValidationChain[]
) => {
  const validationArray = Array.isArray(validations)
    ? validations
    : [validations];

  return [...validationArray, validate(validationArray)];
};
