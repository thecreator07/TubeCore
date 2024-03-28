const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

// HIGHER ORDER FUNCTIONS (ACCEPT FUNCTIONS AS PARAMETER)
// const asyncHandler=()=>{}
// const asyncHandler=(func)=>{()=>{}}
// const asyncHandler=(func)=>async()=>{}

// const asyncHandler = (func) => async (req, res, next) => {
//   try {
//     await func(res, req, next);
//   } catch (err) {
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };
export { asyncHandler };
