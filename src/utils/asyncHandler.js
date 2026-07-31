/**
  * Async Handler Higher Order Function to catch errors in async route handlers
  * @param {Function} requestHandler 
  */
 export const asyncHandler = (requestHandler) => {
   return (req, res, next) => {
     Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
   };
 };
