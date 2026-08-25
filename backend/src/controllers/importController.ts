import { Request, Response } from 'express';
import { importService } from '../services/importServices.js';

export class ImportController {
  /**
   * POST /farms/:farmId/import/preview
   * Process uploaded CSV file and return metadata + sample rows for header mapping.
   */
  public preview = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No CSV file uploaded. Please provide a file in the "file" field.' });
        return;
      }

      // Check mime type or extension (allow common CSV mimetypes and blob uploads)
      const isAllowedMime = [
        'text/csv',
        'text/comma-separated-values',
        'application/csv',
        'application/vnd.ms-excel',
        'text/plain',
        'application/octet-stream',
      ].includes(req.file.mimetype);

      const hasCsvExtension = Boolean(req.file.originalname.match(/\.(csv|txt)$/i));

      if (!isAllowedMime && !hasCsvExtension && req.file.originalname !== 'blob') {
        res.status(400).json({
          error: 'Invalid file format. Please upload a valid CSV file.',
        });
        return;
      }

      const previewData = importService.parsePreview(req.file.buffer);
      res.status(200).json(previewData);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to parse CSV preview.' });
    }
  };

  /**
   * POST /farms/:farmId/import/commit
   * Expects multipart/form-data containing the uploaded `file` and JSON stringified `columnMap`.
   */
  public commit = async (req: Request, res: Response): Promise<void> => {
    try {
      const farmId = (req.params.farmId || res.locals.farmId) as string;

      if (!req.file) {
        res.status(400).json({ error: 'No CSV file provided for import execution.' });
        return;
      }

      let columnMap: Record<string, string> = {};
      if (req.body.columnMap) {
        try {
          columnMap = typeof req.body.columnMap === 'string'
            ? JSON.parse(req.body.columnMap)
            : req.body.columnMap;
        } catch {
          res.status(400).json({ error: 'Invalid columnMap format. Must be a valid JSON object string.' });
          return;
        }
      }

      if (Object.keys(columnMap).length === 0) {
        res.status(400).json({ error: 'Column mapping cannot be empty.' });
        return;
      }

      const result = await importService.commitImport(farmId, req.file.buffer, { columnMap });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to process import commit.' });
    }
  };
}

export const importController = new ImportController();