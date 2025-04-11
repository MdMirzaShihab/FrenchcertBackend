const CompanyTraining = require("../models/CompanyTraining");
const Company = require("../models/Company");
const Training = require("../models/Training");

// Get all company trainings
exports.getAllCompanyTrainings = async (req, res) => {
  try {
    const query = {};

    if (req.query.company) query.company = req.query.company;
    if (req.query.training) query.training = req.query.training;
    if (req.query.completed) query.completed = req.query.completed;

    if (req.query.dateStart && req.query.dateEnd) {
      query.trainingDate = {
        $gte: new Date(req.query.dateStart),
        $lte: new Date(req.query.dateEnd),
      };
    } else if (req.query.dateStart) {
      query.trainingDate = { $gte: new Date(req.query.dateStart) };
    } else if (req.query.dateEnd) {
      query.trainingDate = { $lte: new Date(req.query.dateEnd) };
    }

    const companyTrainings = await CompanyTraining.find(query)
      .populate({ path: "company", select: "name companyIdentifier" })
      .populate({
        path: "training",
        select: "name trainingType trainingMethod",
      })
      .sort({ trainingDate: -1 });

    res.status(200).json({
      success: true,
      count: companyTrainings.length,
      data: companyTrainings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch company trainings",
      error: error.message,
    });
  }
};

// Get single company training
exports.getCompanyTraining = async (req, res) => {
  try {
    const companyTraining = await CompanyTraining.findById(req.params.id)
      .populate("company")
      .populate("training");

    if (!companyTraining) {
      return res
        .status(404)
        .json({ success: false, message: "Company training not found" });
    }

    res.status(200).json({ success: true, data: companyTraining });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch company training",
      error: error.message,
    });
  }
};

// Create new company training
exports.createCompanyTraining = async (req, res) => {
  try {
    const company = await Company.findById(req.body.company);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    const training = await Training.findById(req.body.training);
    if (!training) {
      return res
        .status(404)
        .json({ success: false, message: "Training not found" });
    }

    const companyTraining = await CompanyTraining.create(req.body);
    res.status(201).json({ success: true, data: companyTraining });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Training ID already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create company training",
      error: error.message,
    });
  }
};

// Update company training
exports.updateCompanyTraining = async (req, res) => {
  try {
    const companyTraining = await CompanyTraining.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate("company")
      .populate("training");

    if (!companyTraining) {
      return res
        .status(404)
        .json({ success: false, message: "Company training not found" });
    }

    res.status(200).json({ success: true, data: companyTraining });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Training ID already exists" });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update company training",
      error: error.message,
    });
  }
};

// Delete company training
exports.deleteCompanyTraining = async (req, res) => {
  try {
    const companyTraining = await CompanyTraining.findById(req.params.id);
    if (!companyTraining) {
      return res
        .status(404)
        .json({ success: false, message: "Company training not found" });
    }

    await companyTraining.remove();
    res
      .status(200)
      .json({
        success: true,
        message: "Company training deleted successfully",
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete company training",
      error: error.message,
    });
  }
};

// Verify training by trainingId
exports.verifyTraining = async (req, res) => {
  try {
    const companyTraining = await CompanyTraining.findOne({
      trainingId: req.params.trainingId,
    })
      .populate("company")
      .populate("training");

    if (!companyTraining) {
      return res
        .status(404)
        .json({ success: false, message: "Training not found" });
    }

    const verificationData = {
      trainingId: companyTraining.trainingId,
      company: {
        name: companyTraining.company.name,
        identifier: companyTraining.company.companyIdentifier,
      },
      training: {
        name: companyTraining.training.name,
        type: companyTraining.training.trainingType,
        method: companyTraining.training.trainingMethod,
      },
      trainingDate: companyTraining.trainingDate,
      employeeCount: companyTraining.employeeCount,
      completed: companyTraining.completed,
    };

    res.status(200).json({ success: true, data: verificationData });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to verify training",
      error: error.message,
    });
  }
};

// Get company training dashboard stats
exports.getCompanyTrainingStats = async (req, res) => {
  try {
    const matchStage = {};

    if (req.query.company) {
      matchStage.company = new mongoose.Types.ObjectId(req.query.company);
    }

    const stats = await CompanyTraining.aggregate([
      { $match: matchStage },
      {
        $facet: {
          total: [{ $count: "count" }],
          completed: [
            { $match: { completed: "Completed" } },
            { $count: "count" },
          ],
          inProgress: [
            { $match: { completed: "In Progress" } },
            { $count: "count" },
          ],
          requested: [
            { $match: { completed: "Requested" } },
            { $count: "count" },
          ],
          timeToRetrain: [
            { $match: { completed: "Time to Retrain" } },
            { $count: "count" },
          ],
          recentTrainings: [
            { $sort: { trainingDate: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "companies",
                localField: "company",
                foreignField: "_id",
                as: "company",
              },
            },
            { $unwind: "$company" },
            {
              $lookup: {
                from: "trainings",
                localField: "training",
                foreignField: "_id",
                as: "training",
              },
            },
            { $unwind: "$training" },
            {
              $project: {
                _id: 1,
                trainingId: 1,
                trainingDate: 1,
                completed: 1,
                employeeCount: 1,
                company: {
                  name: "$company.name",
                  identifier: "$company.companyIdentifier",
                },
                training: {
                  name: "$training.name",
                  method: "$training.trainingMethod",
                },
              },
            },
          ],
        },
      },
    ]);

    const response = {
      total: stats[0].total[0]?.count || 0,
      completed: stats[0].completed[0]?.count || 0,
      inProgress: stats[0].inProgress[0]?.count || 0,
      requested: stats[0].requested[0]?.count || 0,
      timeToRetrain: stats[0].timeToRetrain[0]?.count || 0,
      recentTrainings: stats[0].recentTrainings,
    };

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get training stats",
      error: error.message,
    });
  }
};
