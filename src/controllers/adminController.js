const PendingAction = require('../models/PendingAction');
const Certification = require('../models/Certification');
// Import other models as needed

exports.processPendingAction = async (req, res, next) => {
  try {
    const { actionId, decision } = req.params;
    const pendingAction = await PendingAction.findById(actionId);
    
    if (!pendingAction) {
      return res.status(404).json({ message: 'Action not found' });
    }
    
    if (pendingAction.status !== 'pending') {
      return res.status(400).json({ message: 'Action already processed' });
    }
    
    // Update action status
    pendingAction.status = decision;
    pendingAction.reviewedBy = req.user.id;
    pendingAction.reviewDate = new Date();
    await pendingAction.save();
    
    // If approved, perform the action
    if (decision === 'approved') {
      switch (pendingAction.resourceType) {
        case 'Certification':
          if (pendingAction.actionType === 'create') {
            const certification = new Certification(pendingAction.data);
            await certification.save();
          }
          // Handle other action types (update, delete)
          break;
        // Handle other resource types
      }
    }
    
    res.json({ message: `Action ${decision}` });
  } catch (err) {
    next(err);
  }
};

exports.getPendingActions = async (req, res, next) => {
  try {
    const actions = await PendingAction.find({ status: 'pending' })
      .populate('requestedBy', 'email');
    res.json(actions);
  } catch (err) {
    next(err);
  }
};