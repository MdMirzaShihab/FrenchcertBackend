const { body } = require('express-validator');

exports.validatePendingAction = [
  body('actionType')
    .isIn(['create', 'update', 'delete']).withMessage('Invalid action type'),
    
  body('resourceType')
    .isIn(['Certification', 'Company', 'CompanyCertification', 'CompanyTraining', 'Field', 'Training'])
    .withMessage('Invalid resource type'),
    
  body('resourceId')
    .optional({ nullable: true })
    .isMongoId().withMessage('Invalid resource ID'),
    
  body('data')
    .optional({ nullable: true })
    .isObject().withMessage('Data must be an object'),
    
  body()
    .custom((value, { req }) => {
      // For create action, data is required
      if (value.actionType === 'create' && !value.data) {
        throw new Error('Data is required for create action');
      }
      
      // For update action, both data and resourceId are required
      if (value.actionType === 'update' && (!value.data || !value.resourceId)) {
        throw new Error('Both data and resourceId are required for update action');
      }
      
      // For delete action, resourceId is required but data is not
      if (value.actionType === 'delete' && !value.resourceId) {
        throw new Error('ResourceId is required for delete action');
      }
      
      return true;
    })
];
