import { Response } from 'express';
import decoyManagementService from '../services/decoyManagement.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const createDecoy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, location, config } = req.body;

    if (!name || !type || !location || !config) {
      res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
      return;
    }

    const decoy = await decoyManagementService.createDecoy({
      name,
      type,
      location,
      config,
    });

    res.status(201).json({
      success: true,
      message: 'Decoy created successfully',
      data: decoy,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create decoy',
    });
  }
};

export const getDecoys = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const decoys = await decoyManagementService.getActiveDecoys();

    res.status(200).json({
      success: true,
      data: decoys,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch decoys',
    });
  }
};

export const getDecoyById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { decoyId } = req.params;
    
    const decoy = await decoyManagementService.getDecoyById(decoyId);

    if (!decoy) {
      res.status(404).json({
        success: false,
        message: 'Decoy not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: decoy,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch decoy',
    });
  }
};

export const triggerDecoy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { decoyId } = req.params;
    const { action, metadata } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const decoy = await decoyManagementService.triggerDecoy(
      decoyId,
      ipAddress,
      userAgent,
      action || 'access',
      metadata
    );

    if (!decoy) {
      res.status(404).json({
        success: false,
        message: 'Decoy not found or inactive',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Decoy triggered',
      data: decoy,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to trigger decoy',
    });
  }
};

export const updateDecoyStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { decoyId } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({
        success: false,
        message: 'Please provide status',
      });
      return;
    }

    const decoy = await decoyManagementService.updateDecoyStatus(decoyId, status);

    if (!decoy) {
      res.status(404).json({
        success: false,
        message: 'Decoy not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Decoy status updated successfully',
      data: decoy,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update decoy status',
    });
  }
};

export const deleteDecoy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { decoyId } = req.params;
    
    const deleted = await decoyManagementService.deleteDecoy(decoyId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Decoy not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Decoy deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete decoy',
    });
  }
};

export const getDecoyStatistics = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const statistics = await decoyManagementService.getDecoyStatistics();

    res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch decoy statistics',
    });
  }
};

export const getDecoyTriggerHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { decoyId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    
    const history = await decoyManagementService.getDecoyTriggerHistory(decoyId, limit);

    if (!history) {
      res.status(404).json({
        success: false,
        message: 'Decoy not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch trigger history',
    });
  }
};