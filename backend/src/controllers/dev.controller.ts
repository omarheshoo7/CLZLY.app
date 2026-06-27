import type { Request, Response } from "express";

export function validationTest(req: Request, res: Response) {
  res.status(200).json({
    status: "ok",
    data: req.body
  });
}

export function protectedTest(req: Request, res: Response) {
  res.status(200).json({
    status: "ok",
    message: "Protected route accessed successfully",
    user: req.user
  });
}
