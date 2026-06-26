import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    // Future features can add req.user typing here.
  }
}
