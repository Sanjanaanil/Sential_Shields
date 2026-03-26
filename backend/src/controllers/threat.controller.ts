import { Response } from 'express';
import threatDetectionService from '../services/threatDetection.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const getThreats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    
    let threats;
    
    if (req.query.active === 'true') {
      threats = await threatDetectionService.getActiveThreats();
    } else {
      // You can add more filtering logic here
      threats = await threatDetectionService.getActiveThreats(); // Default for now
    }

    res.status(200).json({
      success: true,
      data: threats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch threats',
    });
  }
};

export const getThreatById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { threatId } = req.params;
    
    const threat = await threatDetectionService.getThreatById(threatId);

    if (!threat) {
      res.status(404).json({
        success: false,
        message: 'Threat not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: threat,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch threat',
    });
  }
};

export const updateThreatStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { threatId } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({
        success: false,
        message: 'Please provide status',
      });
      return;
    }

    const threat = await threatDetectionService.updateThreatStatus(threatId, status);

    if (!threat) {
      res.status(404).json({
        success: false,
        message: 'Threat not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Threat status updated successfully',
      data: threat,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update threat status',
    });
  }
};

export const addMitigationAction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { threatId } = req.params;
    const { action, result } = req.body;

    if (!action || !result) {
      res.status(400).json({
        success: false,
        message: 'Please provide action and result',
      });
      return;
    }

    const threat = await threatDetectionService.addMitigationAction(threatId, action, result);

    if (!threat) {
      res.status(404).json({
        success: false,
        message: 'Threat not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Mitigation action added successfully',
      data: threat,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add mitigation action',
    });
  }
};

export const getThreatStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { timeframe = 'day' } = req.query;
    
    const statistics = await threatDetectionService.getThreatStatistics(timeframe as any);

    res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch threat statistics',
    });
  }
};

export const analyzeThreat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { threatId } = req.params;
    
    const threat = await threatDetectionService.getThreatById(threatId);

    if (!threat) {
      res.status(404).json({
        success: false,
        message: 'Threat not found',
      });
      return;
    }

    // Perform behavioral analysis
    const analysis = await threatDetectionService.analyzeBehavioralPattern(
      threat.source.ipAddress,
      req.user?.id
    );

    res.status(200).json({
      success: true,
      data: {
        threat,
        analysis,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze threat',
    });
  }
};