import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Types } from 'mongoose';
import { Attachment } from '../models/Attachment.js';

// Setup uploads directory
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Disk Storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

export class AttachmentController {
  static async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const { workspaceId, targetType, targetId } = req.body;
      if (!workspaceId) {
        return res.status(400).json({ success: false, error: 'workspaceId is required' });
      }

      const fileUrl = `/uploads/${req.file.filename}`;

      const attachment = await Attachment.create({
        workspaceId: new Types.ObjectId(workspaceId),
        uploaderId: new Types.ObjectId(req.user!.id),
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        url: fileUrl,
        targetType: targetType || null,
        targetId: targetId && Types.ObjectId.isValid(targetId) ? new Types.ObjectId(targetId) : null,
      });

      return res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: attachment,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const attachment = await Attachment.findById(req.params.id);
      if (!attachment) {
        return res.status(404).json({ success: false, error: 'Attachment not found' });
      }

      return res.status(200).json({
        success: true,
        data: attachment,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const attachment = await Attachment.findById(req.params.id);
      if (!attachment) {
        return res.status(404).json({ success: false, error: 'Attachment not found' });
      }

      const filePath = path.join(uploadsDir, attachment.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await Attachment.findByIdAndDelete(req.params.id);

      return res.status(200).json({
        success: true,
        message: 'Attachment deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }
}
