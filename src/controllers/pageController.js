const Page = require('../models/Page');
const PendingAction = require('../models/PendingAction');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

// Helper functions
const validatePageData = (data) => {
  const requiredFields = ["name", "title", "body"];
  return requiredFields.filter((field) => !data[field]);
};

const preparePageData = (body) => ({
  name: body.name?.trim(),
  title: body.title?.trim(),
  body: body.body,
  seoKeywords: body.seoKeywords || [],
  seoDescription: body.seoDescription
});

// Check if pending action exists for this page
const checkPendingPageAction = async (pageId, actionType) => {
  return await PendingAction.findOne({
    resourceType: 'Page',
    resourceId: pageId,
    actionType,
    status: 'pending'
  });
};

// Check if pending action exists with this page name
const checkPendingPageNameExists = async (name, excludeId = null) => {
  const query = {
    resourceType: 'Page',
    'data.name': name,
    status: 'pending'
  };
  
  if (excludeId) {
    query.resourceId = { $ne: excludeId };
  }
  
  return await PendingAction.findOne(query);
};

// Get all pages with pagination
exports.getAllPages = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = {};

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { name: 1 },
      collation: { locale: "en", strength: 2 },
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } }
      ];
    }

    const result = await Page.paginate(query, options);

    return res.status(200).json({
      success: true,
      data: {
        pages: result.docs,
        total: result.totalDocs,
        limit: result.limit,
        page: result.page,
        pages: result.totalPages,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pages",
      error: error.message,
    });
  }
};

// Get single page
exports.getPage = async (req, res) => {
  try {
    const page = await Page.findOne({ name: req.params.name });
    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    res.status(200).json({
      success: true,
      data: page,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch page",
      error: error.message,
    });
  }
};

// Request creation of a new page
exports.requestCreatePage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const missingFields = validatePageData(req.body);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const pageData = preparePageData(req.body);
    
    // Check if page with same name exists
    const existingPage = await Page.findOne({ name: pageData.name });
    if (existingPage) {
      return res.status(400).json({
        success: false,
        message: 'Page with this name already exists',
      });
    }
    
    // Check if pending request exists
    const existingPendingAction = await checkPendingPageNameExists(pageData.name);
    if (existingPendingAction) {
      return res.status(400).json({
        success: false,
        message: 'A pending request for a page with this name already exists',
      });
    }

    // Create pending action
    const pendingAction = new PendingAction({
      actionType: 'create',
      resourceType: 'Page',
      data: pageData,
      requestedBy: req.user.id,
      status: 'pending'
    });
    
    await pendingAction.save();
    
    return res.status(201).json({
      success: true,
      message: 'Page creation request submitted for admin approval',
      pendingAction: {
        id: pendingAction._id,
        actionType: pendingAction.actionType,
        resourceType: pendingAction.resourceType,
        status: pendingAction.status,
        createdAt: pendingAction.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit page creation request',
      error: error.message,
    });
  }
};

// Request update of an existing page
exports.requestUpdatePage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    // Check if page exists
    const page = await Page.findOne({ name: req.params.name });
    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    const updateData = preparePageData(req.body);
    
    // If name is changing, check conflicts
    if (updateData.name && updateData.name !== page.name) {
      const existingPage = await Page.findOne({ 
        name: updateData.name,
        _id: { $ne: page._id }
      });
      
      if (existingPage) {
        return res.status(400).json({
          success: false,
          message: 'Page with this name already exists',
        });
      }
      
      // Check pending actions with new name
      const existingPendingName = await checkPendingPageNameExists(updateData.name, page._id);
      if (existingPendingName) {
        return res.status(400).json({
          success: false,
          message: 'A pending request for a page with this name already exists', 
        });
      }
    }
    
    // Check if pending update exists
    const existingPendingAction = await checkPendingPageAction(page._id, 'update');
    if (existingPendingAction) {
      return res.status(400).json({
        success: false,
        message: 'A pending update request for this page already exists',
      });
    }

    // Create pending action
    const pendingAction = new PendingAction({
      actionType: 'update',
      resourceType: 'Page',
      resourceId: page._id,
      data: updateData,
      requestedBy: req.user.id,
      status: 'pending'
    });
    
    await pendingAction.save();
    
    return res.status(200).json({
      success: true,
      message: 'Page update request submitted for admin approval',
      pendingAction: {
        id: pendingAction._id,
        actionType: pendingAction.actionType,
        resourceType: pendingAction.resourceType,
        status: pendingAction.status,
        createdAt: pendingAction.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit page update request',
      error: error.message,
    });
  }
};

// Request deletion of a page
exports.requestDeletePage = async (req, res) => {
  try {
    // Check if page exists
    const page = await Page.findOne({ name: req.params.name });
    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }
    
    // Check if pending delete exists
    const existingPendingAction = await checkPendingPageAction(page._id, 'delete');
    if (existingPendingAction) {
      return res.status(400).json({
        success: false,
        message: 'A pending delete request for this page already exists',
      });
    }

    // Create pending action
    const pendingAction = new PendingAction({
      actionType: 'delete',
      resourceType: 'Page',
      resourceId: page._id,
      requestedBy: req.user.id,
      status: 'pending'
    });
    
    await pendingAction.save();
    
    return res.status(200).json({
      success: true,
      message: 'Page deletion request submitted for admin approval',
      pendingAction: {
        id: pendingAction._id,
        actionType: pendingAction.actionType,
        resourceType: pendingAction.resourceType,
        status: pendingAction.status,
        createdAt: pendingAction.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit page deletion request',
      error: error.message,
    });
  }
};

// Get user's pending actions for pages
exports.getUserPagePendingActions = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { 
      requestedBy: req.user.id,
      resourceType: 'Page'
    };
    
    if (status) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const actions = await PendingAction.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));
    
    const total = await PendingAction.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      data: {
        actions,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending actions',
      error: error.message,
    });
  }
};

// ADMIN ONLY - Direct create page
exports.createPage = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const missingFields = validatePageData(req.body);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const pageData = preparePageData(req.body);
    const page = await Page.create([pageData], { session });

    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      data: page[0],
    });
  } catch (error) {
    await session.abortTransaction();

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Page with this name already exists",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create page",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// ADMIN ONLY - Direct update page
exports.updatePage = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updateData = preparePageData(req.body);
    const page = await Page.findOneAndUpdate(
      { name: req.params.name },
      updateData,
      {
        new: true,
        runValidators: true,
        session,
      }
    );

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      data: page,
    });
  } catch (error) {
    await session.abortTransaction();

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Page with this name already exists",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update page",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// ADMIN ONLY - Direct delete page
exports.deletePage = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const page = await Page.findOneAndDelete({ name: req.params.name }).session(session);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Page deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: "Failed to delete page",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};