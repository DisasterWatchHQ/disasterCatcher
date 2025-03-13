import UserReports from "../models/userReports.js";
import User from "../models/users.js";
import Warning from "../models/warning.js";
import { createSystemLog } from "./adminLogsController.js";

export const createUserReport = async (req, res) => {
  try {
    const { title, disaster_category, description, location } = req.body;

    if (
      !location?.address?.city ||
      !location?.address?.district ||
      !location?.address?.province
    ) {
      return res.status(400).json({
        error:
          "Location must include address with city, district, and province",
      });
    }

    const reportData = {
      title,
      disaster_category,
      description,
      location,
      reporter_type: "anonymous",
    };

    const newReport = await UserReports.create(reportData);
    res.status(201).json(newReport);
  } catch (error) {
    console.error("Create report error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const verifyReport = async (req, res) => {
  try {
    const { severity, notes } = req.body;
    const reportId = req.params.id;
    const verifyingUser = req.user;

    const report = await UserReports.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    if (report.verification_status !== "pending") {
      return res.status(400).json({
        error: `Report is already ${report.verification_status}`,
      });
    }

    const verificationTime = Math.round(
      (new Date() - report.createdAt) / (1000 * 60),
    );

    report.verification_status = "verified";
    report.verification = {
      verified_by: verifyingUser._id,
      verified_at: new Date(),
      workId: verifyingUser.workId,
      associated_department: verifyingUser.associated_department,
      verification_time: verificationTime,
      severity,
      notes,
    };

    const updatedReport = await report.save();

    await createSystemLog(
      verifyingUser._id,
      "VERIFY_REPORT",
      "user_report",
      report._id,
      {
        previous_state: report.toJSON(),
        new_state: updatedReport.toJSON(),
        message: `Report verified by ${verifyingUser.name} with ${severity} severity`,
      },
    );

    res.status(200).json({
      success: true,
      message: "Report verified successfully",
      report: updatedReport,
      verification: updatedReport.verification,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const dismissReport = async (req, res) => {
  try {
    const { notes } = req.body;
    const reportId = req.params.id;
    const user = req.user;

    const report = await UserReports.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const originalState = report.toJSON();

    report.verification_status = "dismissed";
    report.verification = {
      verified_by: user._id,
      verified_at: new Date(),
      notes,
    };

    const updatedReport = await report.save();

    await createSystemLog(
      user._id,
      "DISMISS_REPORT",
      "user_report",
      report._id,
      {
        previous_state: originalState,
        new_state: updatedReport.toJSON(),
        message: `Report dismissed by ${user.name}`,
      },
    );

    res.status(200).json({
      success: true,
      message: "Report dismissed successfully",
      report: updatedReport,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserReports = async (req, res) => {
  try {
    const {
      disaster_category,
      city,
      district,
      province,
      startDate,
      endDate,
      verification_status,
      severity,
      reporter_type,
      limit = 10,
      page = 1,
    } = req.query;

    const query = {};

    if (disaster_category) query.disaster_category = disaster_category;
    if (verification_status) query.verification_status = verification_status;
    if (reporter_type) query.reporter_type = reporter_type;
    if (severity) query["verification.severity"] = severity;

    if (city || district || province) {
      if (city)
        query["location.address.city"] = { $regex: city, $options: "i" };
      if (district)
        query["location.address.district"] = {
          $regex: district,
          $options: "i",
        };
      if (province)
        query["location.address.province"] = {
          $regex: province,
          $options: "i",
        };
    }

    if (startDate || endDate) {
      query.date_time = {};
      if (startDate) query.date_time.$gte = new Date(startDate);
      if (endDate) query.date_time.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const reports = await UserReports.find(query)
      .populate("reporter", "name workId associated_department")
      .populate("verification.verified_by", "name workId associated_department")
      .sort({ date_time: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await UserReports.countDocuments(query);

    res.status(200).json({
      reports,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalReports: total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getReportsByUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { reporter: userId };
    if (status) query.verification_status = status;

    const reports = await UserReports.find(query)
      .populate("verification.verified_by", "name workId associated_department")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await UserReports.countDocuments(query);

    res.status(200).json({
      reports,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalReports: total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getReportStats = async (req, res) => {
  try {
    const stats = await UserReports.aggregate([
      {
        $facet: {
          byStatus: [
            {
              $group: {
                _id: "$verification_status",
                count: { $sum: 1 },
              },
            },
          ],
          byCategory: [
            {
              $group: {
                _id: "$disaster_category",
                count: { $sum: 1 },
              },
            },
          ],
          bySeverity: [
            { $match: { verification_status: "verified" } },
            {
              $group: {
                _id: "$verification.severity",
                count: { $sum: 1 },
              },
            },
          ],
          recentTrends: [
            {
              $match: {
                date_time: {
                  $gte: new Date(new Date().setDate(new Date().getDate() - 30)),
                },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$date_time",
                  },
                },
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    res.status(200).json(stats[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getVerificationStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Promise.all([
      UserReports.countDocuments({ verification_status: "pending" }),
      UserReports.countDocuments({
        verification_status: "verified",
        "verification.verified_at": { $gte: today },
      }),

      Warning.countDocuments({ status: "active" }),
      UserReports.aggregate([
        {
          $match: {
            verification_status: "verified",
            "verification.verification_time": { $exists: true },
          },
        },
        {
          $group: {
            _id: null,
            avgTime: {
              $avg: {
                $divide: ["$verification.verification_time", 60],
              },
            },
          },
        },
      ]),
    ]);

    res.json({
      pendingCount: stats[0],
      verifiedToday: stats[1],
      activeIncidents: stats[2],
      avgVerificationTime: Math.round(stats[3][0]?.avgTime || 0),
    });
  } catch (error) {
    console.error("Verification stats error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getReportAnalytics = async (req, res) => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const analytics = await UserReports.aggregate([
      {
        $facet: {
          weeklyTrends: [
            {
              $match: {
                createdAt: { $gte: weekAgo },
              },
            },
            {
              $group: {
                _id: {
                  date: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                  },
                  status: "$verification_status",
                },
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                date: "$_id.date",
                status: "$_id.status",
                count: 1,
              },
            },
          ],
          reportTypes: [
            {
              $group: {
                _id: "$disaster_category",
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                name: { $ifNull: ["$_id", "Unknown"] },
                value: "$count",
                _id: 0,
              },
            },
          ],
          responseTime: [
            {
              $match: {
                verification_status: "verified",
                "verification.verification_time": { $exists: true },
              },
            },
            {
              $bucket: {
                groupBy: "$verification.verification_time",
                boundaries: [0, 60, 120, 240, Infinity],
                default: "other",
                output: {
                  count: { $sum: 1 },
                },
              },
            },
            {
              $project: {
                time: {
                  $switch: {
                    branches: [
                      { case: { $eq: ["$_id", 0] }, then: "<1h" },
                      { case: { $eq: ["$_id", 60] }, then: "1-2h" },
                      { case: { $eq: ["$_id", 120] }, then: "2-4h" },
                      { case: { $eq: ["$_id", 240] }, then: ">4h" },
                    ],
                    default: "other",
                  },
                },
                count: 1,
                _id: 0,
              },
            },
          ],
        },
      },
    ]);

    const trendsMap = {};
    analytics[0].weeklyTrends.forEach((item) => {
      if (!trendsMap[item.date]) {
        trendsMap[item.date] = { date: item.date };
      }
      trendsMap[item.date][item.status] = item.count;
    });

    const formattedResponse = {
      weeklyTrends: Object.values(trendsMap),
      reportTypes: analytics[0].reportTypes,
      responseTime: analytics[0].responseTime,
    };

    res.json(formattedResponse);
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getPublicFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reports = await UserReports.find({
      verification_status: "verified",
    })
      .sort({ "verification.verified_at": -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * parseInt(limit))
      .select("-reporter");

    const total = await UserReports.countDocuments({
      verification_status: "verified",
    });

    res.json({
      reports,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFeedReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      disaster_category,
      verification_status,
      district,
    } = req.query;

    const query = {};

    // Add verification status filter
    if (verification_status) {
      query.verification_status = verification_status;
    }

    if (disaster_category) {
      query.disaster_category = disaster_category;
    }

    if (district) {
      query["location.address.district"] = district;
    }

    const reports = await UserReports.find(query)
      .sort({ date_time: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const total = await UserReports.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        reports: reports.map((report) => ({
          id: report._id,
          title: report.title,
          description: report.description,
          disaster_category: report.disaster_category,
          location: report.location,
          district: report.location.address.district,
          date_time: report.date_time,
          images: report.images,
          verification_status: report.verification_status,
          verified: report.verification_status === "verified",
          severity: report.verification?.severity,
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalReports: total,
        },
      },
    });
  } catch (error) {
    console.error("Feed reports error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch feed reports",
      details: error.message,
    });
  }
};

export const getFeedStats = async (req, res) => {
  try {
    const reportStats = await UserReports.aggregate([
      {
        $group: {
          _id: "$disaster_category",
          total: { $sum: 1 },
          verified: {
            $sum: {
              $cond: [{ $eq: ["$verification_status", "verified"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const warningStats = await Warning.aggregate([
      {
        $group: {
          _id: "$disaster_category",
          active_warnings: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          by_severity: {
            $push: {
              severity: "$severity",
              status: "$status",
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        reportStats,
        warningStats,
        activeWarnings: warningStats.reduce(
          (acc, curr) => acc + curr.active_warnings,
          0,
        ),
      },
    });
  } catch (error) {
    console.error("Feed stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch feed statistics",
      details: error.message,
    });
  }
};

export const getFeedUpdates = async (req, res) => {
  try {
    const { minutes = 30 } = req.query;
    const since = new Date(Date.now() - minutes * 60 * 1000);

    const updates = await UserReports.find({
      date_time: { $gte: since },
    })
      .sort({ date_time: -1 })
      .limit(20)
      .select(
        "title date_time location.address.city verification_status verification.severity",
      )
      .lean();

    res.status(200).json({
      success: true,
      data: {
        updates: updates.map((update) => ({
          message: `${update.title} reported in ${update.location.address.city}`,
          timestamp: update.date_time,
          status: update.verification_status,
          severity: update.verification?.severity,
        })),
      },
    });
  } catch (error) {
    console.error("Feed updates error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch feed updates",
      details: error.message,
    });
  }
};
