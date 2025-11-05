const Enquiry = require("../models/Enquiry");

exports.createPublicEnquiry = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.create({
      ...req.body,
      status: 'new',
      // No createdBy since user is not authenticated
    });

    res.status(201).json({
      success: true,
      message: 'Your enquiry has been submitted successfully. We will contact you soon.',
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};
exports.getEnquiries = async (req, res, next) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
    } = req.query;

    // Build query
    const query = { isDeleted: false };

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // For staff users, show only assigned enquiries
    if (req.user.role === "staff") {
      query.assignedTo = req.user._id;
    } else if (req.user.role === "user") {
      query.$or = [
        { createdBy: req.user._id },
        { email: req.user.email }
      ];
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const enquiries = await Enquiry.find(query)
      .populate("assignedTo", "name email")
      .sort({ [sortBy]: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Enquiry.countDocuments(query);

    res.json({
      success: true,
      data: {
        enquiries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single enquiry
// @route   GET /api/enquiries/:id
// @access  Private
exports.getEnquiry = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate("assignedTo", "name email role");

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    // Check if staff user is authorized to view this enquiry
    if (
      req.user.role === "staff" &&
      enquiry.assignedTo?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this enquiry",
      });
    }

    res.json({
      success: true,
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new enquiry
// @route   POST /api/enquiries
// @access  Private
exports.createEnquiry = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.create({
      ...req.body,
      createdBy: req.user._id, // Track which employee created it
    });

    res.status(201).json({
      success: true,
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update enquiry
// @route   PUT /api/enquiries/:id
// @access  Private
exports.updateEnquiry = async (req, res, next) => {
  try {
    let enquiry = await Enquiry.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    // Check if staff user is authorized to update this enquiry
    if (
      req.user.role === "staff" &&
      enquiry.assignedTo?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this enquiry",
      });
    }

    console.log("req.body:", req.body);
    console.log("updates:", Object.keys(req.body));
    console.log("role:", req.user.role);

    // Staff can only update status, not reassign
    if (req.user.role === "staff") {
      const allowedUpdates = ["status", "message"];
      const updates = Object.keys(req.body);
      const isValidUpdate = updates.every((update) =>
        allowedUpdates.includes(update)
      );
      console.log(isValidUpdate, "---- isValidUpdate -----", req.user.role);
      if (!isValidUpdate) {
        return res.status(400).json({
          success: false,
          message: "Staff can only update status and message",
        });
      }
    }

    enquiry = await Enquiry.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("assignedTo", "name email");

    res.json({
      success: true,
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete enquiry (soft delete)
// @route   DELETE /api/enquiries/:id
// @access  Private (Admin only)
exports.deleteEnquiry = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    enquiry.isDeleted = true;
    enquiry.deletedAt = Date.now();
    await enquiry.save();

    res.json({
      success: true,
      message: "Enquiry deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get enquiry statistics
// @route   GET /api/enquiries/stats
// @access  Private
exports.getEnquiryStats = async (req, res, next) => {
  try {
    const query = { isDeleted: false };

    // For staff, only show their enquiries
    if (req.user.role === "staff") {
      query.assignedTo = req.user._id;
    }

    const stats = await Enquiry.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await Enquiry.countDocuments(query);

    res.json({
      success: true,
      data: {
        total,
        byStatus: stats,
      },
    });
  } catch (error) {
    next(error);
  }
};
