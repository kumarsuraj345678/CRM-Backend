import Lead from "../models/Lead.js";
import User from "../models/User.js";
import Activity from "../models/Activity.js";

export const getStats = async (req, res) => {
  try {
    const [
      totalLeads,
      closedLeads,
      assignedLeads,
      unassignedLeads,
      activeUsers,
    ] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ status: "Closed" }),
      Lead.countDocuments({ assignedTo: { $ne: null } }),
      Lead.countDocuments({ assignedTo: null }),
      User.countDocuments({ status: "active", role: "employee" }),
    ]);

    const conversionRate =
      totalLeads === 0 ? 0 : Math.round((closedLeads / totalLeads) * 100);

    res.json({
      unassigned: unassignedLeads,
      activeUsers,
      assignedThisWeek: assignedLeads,
      conversionRate,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stats" });
  }
};

export const getSalesData = async (req, res) => {
  try {
    const leads = await Lead.find();
    const data = [];

    const startOfDay = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    for (let i = 13; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);

      const start = startOfDay(day);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);

      const assigned = leads.filter((l) => {
        const created = new Date(l.createdAt);
        return created >= start && created < end && l.assignedTo;
      }).length;

      const closed = leads.filter((l) => {
        const created = new Date(l.createdAt);
        return (
          created >= start &&
          created < end &&
          l.status?.toLowerCase() === "closed"
        );
      }).length;

      const conversion = assigned ? Math.round((closed / assigned) * 100) : 0;

      data.push({
        day: day.toLocaleDateString("en-US", { weekday: "short" }),
        conversion,
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching sales data" });
  }
};

export const getActivities = async (req, res) => {
  try {
    const leads = await Lead.find()
      .populate("assignedTo", "firstName lastName")
      .sort({ updatedAt: -1 })
      .limit(7);

    const timeAgo = (date) => {
      const seconds = Math.floor((new Date() - new Date(date)) / 1000);

      const intervals = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 },
      ];

      for (let i of intervals) {
        const count = Math.floor(seconds / i.seconds);
        if (count > 0) {
          return `${count} ${i.label}${count > 1 ? "s" : ""} ago`;
        }
      }

      return "just now";
    };

    const activities = leads.map((lead) => {
      const time = timeAgo(lead.updatedAt);

      if (lead.status?.toLowerCase() === "closed") {
        return `Closed lead ${lead.name} – ${time}`;
      } else if (lead.assignedTo) {
        return `You assigned a lead to ${lead.assignedTo.firstName} – ${time}`;
      } else {
        return `New lead created – ${time}`;
      }
    });

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: "Error fetching activities" });
  }
};

export const getMyActivity = async (req, res) => {
  try {
    const userId = req.user._id;

    const activities = await Activity.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getEmployeeStats = async (req, res) => {
  try {
    // ✅ Aggregate leads (fast + accurate)
    const stats = await Lead.aggregate([
      {
        $match: {
          assignedTo: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$assignedTo",
          assignedLeadsCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "Ongoing"] }, 1, 0],
            },
          },
          closedLeadsCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "Closed"] }, 1, 0],
            },
          },
        },
      },
    ]);

    // ✅ Get employees
    const users = await User.find({ role: "employee" });

    // ✅ Merge stats with users
    const result = users.map((user) => {
      const stat = stats.find((s) => s._id.toString() === user._id.toString());

      return {
        ...user._doc,
        assignedLeadsCount: stat?.assignedLeadsCount || 0,
        closedLeadsCount: stat?.closedLeadsCount || 0,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error fetching employee stats" });
  }
};
