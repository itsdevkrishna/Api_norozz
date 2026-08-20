/**
 * Helper function to recursively sanitize input objects against Mongo NoSQL injection
 */
const sanitizeValue = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeValue(item));
  }

  const cleanObject = {};
  for (const key of Object.keys(data)) {
    // Strip keys starting with '$' (NoSQL query operators)
    if (key.startsWith('$')) {
      continue;
    }
    cleanObject[key] = sanitizeValue(data[key]);
  }
  return cleanObject;
};

/**
 * Global Middleware to sanitize req.body, req.query, and req.params
 */
export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }
  next();
};
