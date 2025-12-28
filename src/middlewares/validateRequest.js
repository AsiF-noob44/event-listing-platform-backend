import { validationResult } from "express-validator";

// Collect validation errors from express-validator
export const validateRequest = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors
          .array()
          .map((err) => ({ field: err.path, message: err.msg })),
      });
    }

    return next();
  };
};
