import fs from "fs";
import csv from "csv-parser";
import Lead from "../models/Lead.js";
import User from "../models/User.js";
import Activity from "../models/Activity.js";

const LEAD_THRESHOLD = 3;

const parseDate = (dateStr) => {
  if (!dateStr) return null;

  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  return new Date(`${year}-${month}-${day}`);
};

export const createLead = async (req, res) => {
  try {
    const { name, email, source, date, location, language } = req.body;

    const filtered = await User.find({
      role: "employee",
      status: "active",
      language: new RegExp(`^${language}$`, "i"),
    });

    let assignedUser = null;

    if (filtered.length > 0) {
      const counts = await Lead.aggregate([
        {
          $match: {
            assignedTo: { $in: filtered.map((e) => e._id) },
            status: { $ne: "Closed" },
          },
        },
        {
          $group: {
            _id: "$assignedTo",
            count: { $sum: 1 },
          },
        },
      ]);

      const countMap = {};
      counts.forEach((c) => {
        countMap[c._id] = c.count;
      });

      const eligibleUsers = filtered.filter(
        (emp) => (countMap[emp._id] || 0) < LEAD_THRESHOLD,
      );
      if (eligibleUsers.length > 0) {
        eligibleUsers.sort(
          (a, b) => (countMap[a._id] || 0) - (countMap[b._id] || 0),
        );
        assignedUser = eligibleUsers[0];
      } else if (filtered.length > 0) {
        assignedUser = filtered[0];
      }
    }

    const lead = await Lead.create({
      name,
      email,
      source,
      date: parseDate(date),
      location,
      language,
      assignedTo: assignedUser ? assignedUser._id : null,
      status: "Ongoing",
      type: "Warm",
    });
    await reassignUnassignedLeads(language);

    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ message: "Failed to create lead" });
  }
};

export const getLeads = async (req, res) => {
  try {
    const leads = await Lead.find()
      .populate("assignedTo", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch leads" });
  }
};

export const getMyLeads = async (req, res) => {
  try {
    const userId = req.user._id;

    const leads = await Lead.find({
      assignedTo: userId,
    });

    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMySchedule = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    const leads = await Lead.find({
      assignedTo: req.user._id,
      scheduledDate: { $ne: null },
    });

    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const assignLead = async (req, res) => {
  try {
    const { userId } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    lead.assignedTo = userId;
    await lead.save();
    await reassignUnassignedLeads(lead.language);
    res.json({
      message: "Lead assigned successfully",
      lead,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, type, scheduledDate, scheduledTime } = req.body;

    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    if (lead.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (
      status === "Closed" &&
      lead.scheduledDate &&
      new Date() < new Date(lead.scheduledDate)
    ) {
      return res.status(400).json({
        message: "Cannot close before scheduled date",
      });
    }

    if (status) lead.status = status;
    if (type) lead.type = type;
    if (scheduledDate) lead.scheduledDate = scheduledDate;
    if (scheduledTime) lead.scheduledTime = scheduledTime;

    await lead.save();

    if (status === "Closed") {
      await reassignUnassignedLeads(lead.language);
    }

    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: "Failed to update lead" });
  }
};

const assignUserToLead = async (language) => {
  const filtered = await User.find({
    role: "employee",
    status: "active",
    language: new RegExp(`^${language}$`, "i"),
  });

  if (filtered.length === 0) {
    return null;
  }

  const counts = await Lead.aggregate([
    {
      $match: {
        assignedTo: {
          $in: filtered.map((u) => u._id),
        },
        status: { $ne: "Closed" },
      },
    },
    {
      $group: {
        _id: "$assignedTo",
        count: { $sum: 1 },
      },
    },
  ]);

  const countMap = {};
  counts.forEach((c) => {
    countMap[c._id] = c.count;
  });

  const eligible = filtered
    .map((user) => ({
      user,
      count: countMap[user._id] || 0,
    }))
    .filter((u) => u.count < LEAD_THRESHOLD)
    .sort((a, b) => a.count - b.count);

  return eligible.length ? eligible[0].user._id : null;
};

export const uploadCSV = async (req, res) => {
  const results = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        results.sort((a, b) => {
          const dateA = parseDate(a.Date);
          const dateB = parseDate(b.Date);
          return dateA - dateB;
        });
        const employees = await User.find({
          role: "employee",
          status: "active",
        });
        const languageMap = {};
        employees.forEach((emp) => {
          const lang = emp.language?.toLowerCase().trim();
          if (!languageMap[lang]) {
            languageMap[lang] = [];
          }
          languageMap[lang].push(emp);
        });

        let countMap = {};
        const leadsToInsert = [];

        employees.forEach((emp) => {
          countMap[emp._id] = 0;
        });

        const existingCounts = await Lead.aggregate([
          {
            $match: {
              assignedTo: {
                $in: employees.map((e) => e._id),
              },
              status: { $ne: "Closed" },
            },
          },
          {
            $group: {
              _id: "$assignedTo",
              count: { $sum: 1 },
            },
          },
        ]);
        existingCounts.forEach((c) => {
          countMap[c._id] = c.count;
        });

        for (let row of results) {
          const lang = row.Language?.toLowerCase()?.trim();
          const filtered = lang ? languageMap[lang] || [] : [];

          let pool = filtered;

          let assignedUser = null;

          if (pool.length > 0) {
            const eligibleUsers = pool.filter(
              (emp) => (countMap[emp._id] || 0) < LEAD_THRESHOLD,
            );

            if (eligibleUsers.length > 0) {
              eligibleUsers.sort(
                (a, b) => (countMap[a._id] || 0) - (countMap[b._id] || 0),
              );

              assignedUser = eligibleUsers[0];
              countMap[assignedUser._id] =
                (countMap[assignedUser._id] || 0) + 1;
            } else if (pool.length > 0) {
              assignedUser = pool[0];
            }
          }

          const normalizeType = (type) => {
            if (!type) return "Warm";
            const t = type.toLowerCase();
            if (t === "hot") return "Hot";
            if (t === "cold") return "Cold";
            return "Warm";
          };

          leadsToInsert.push({
            name: row.Name || "",
            email: row.Email || "",
            source: row.Source || "",
            date: parseDate(row.Date),
            location: row.Location || "",
            language: row.Language || "",
            assignedTo: assignedUser ? assignedUser._id : null,
            status: "Ongoing",
            type: normalizeType(row.Type),
            scheduledDate: parseDate(row["Scheduled Date"]),
          });
        }

        if (leadsToInsert.length === 0) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({
            message: "No valid leads found",
          });
        }

        const saved = await Lead.insertMany(leadsToInsert);

        fs.unlinkSync(req.file.path);

        res.json(saved);

        const uniqueLanguages = [
          ...new Set(
            results
              .map((r) => r.Language?.toLowerCase()?.trim())
              .filter((lang) => lang),
          ),
        ];

        await Promise.all(
          uniqueLanguages.map((lang) => reassignUnassignedLeads(lang)),
        );
      } catch (err) {
        res.status(500).json({ message: "CSV processing failed" });
      }
    });
};

export const reassignUnassignedLeads = async (language) => {
  try {
    let employees = await User.find({
      role: "employee",
      status: "active",
      language: new RegExp(`^${language}$`, "i"),
    });

    if (!employees.length) return;

    const unassignedLeads = await Lead.find({
      assignedTo: null,
      language: new RegExp(`^${language}$`, "i"),
    }).sort({ createdAt: 1 });

    if (!unassignedLeads.length) return;

    const counts = await Lead.aggregate([
      {
        $match: {
          assignedTo: { $in: employees.map((e) => e._id) },
          status: { $ne: "Closed" },
        },
      },
      {
        $group: {
          _id: "$assignedTo",
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = {};
    counts.forEach((c) => {
      countMap[c._id] = c.count;
    });
    const bulkOps = [];
    for (let lead of unassignedLeads) {
      const eligibleUsers = employees
        .map((emp) => ({
          emp,
          count: countMap[emp._id] || 0,
        }))
        .filter((u) => u.count < LEAD_THRESHOLD)
        .sort((a, b) => a.count - b.count);

      if (!eligibleUsers.length) break;

      const selectedUser = eligibleUsers[0].emp;
      bulkOps.push({
        updateOne: {
          filter: { _id: lead._id },
          update: { assignedTo: selectedUser._id },
        },
      });

      countMap[selectedUser._id] = (countMap[selectedUser._id] || 0) + 1;
    }
    if (bulkOps.length > 0) {
      await Lead.bulkWrite(bulkOps);
    }
  } catch (error) {
    console.error("REASSIGN ERROR:", error);
  }
};
