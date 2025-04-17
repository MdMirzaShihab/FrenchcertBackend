const Certification = require('../models/Certification');
const Company = require('../models/Company');
const Field = require('../models/Field');
const CompanyCertification = require('../models/CompanyCertification');
const Training = require('../models/Training');

// Helper function to get recent activities
const getRecentActivities = async (limit = 5) => {
  const [recentCertifications, recentCompanies, recentFields] = await Promise.all([
    CompanyCertification.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('company certification'),
    Company.find().sort({ createdAt: -1 }).limit(limit),
    Field.find().sort({ createdAt: -1 }).limit(limit)
  ]);

  return {
    certifications: recentCertifications,
    companies: recentCompanies,
    fields: recentFields
  };
};

// Helper function to get geographical distribution
const getGeographicalData = async () => {
  const countries = await Company.aggregate([
    { $group: { _id: '$originCountry', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  return countries;
};

// Main dashboard summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const [
      companyCount,
      certificationCount,
      fieldCount,
      trainingCount,
      stats,
      activities,
      geographicalData,
      certificationTypes
    ] = await Promise.all([
      Company.countDocuments(),
      Certification.countDocuments(),
      Field.countDocuments(),
      Training.countDocuments(),
      CompanyCertification.aggregate([
        {
          $facet: {
            statusDistribution: [
              { $group: { _id: '$status', count: { $sum: 1 } } }
            ],
            expiringSoon: [
              { 
                $match: { 
                  status: 'active',
                  expiryDate: { 
                    $gt: new Date(),
                    $lt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  }
                } 
              },
              { $count: 'count' }
            ],
            recentExpired: [
              {
                $match: {
                  $or: [
                    { status: 'expired' },
                    { 
                      status: 'active',
                      expiryDate: { $lt: new Date() }
                    }
                  ],
                  expiryDate: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                }
              },
              { $count: 'count' }
            ]
          }
        }
      ]),
      getRecentActivities(),
      getGeographicalData(),
      Certification.aggregate([
        { $group: { _id: '$certificationType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        counts: {
          companies: companyCount,
          certifications: certificationCount,
          fields: fieldCount,
          trainings: trainingCount
        },
        stats: {
          statusDistribution: stats[0].statusDistribution,
          expiringSoon: stats[0].expiringSoon[0]?.count || 0,
          recentExpired: stats[0].recentExpired[0]?.count || 0
        },
        activities,
        geographicalData,
        certificationTypes
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get activity timeline
exports.getActivityTimeline = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const timeline = await CompanyCertification.aggregate([
      {
        $match: {
          createdAt: { $gte: dateThreshold }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: timeline
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load timeline data',
      error: error.message
    });
  }
};