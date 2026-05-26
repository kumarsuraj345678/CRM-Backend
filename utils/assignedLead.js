import User from "../models/User.js";

export const assignLead = async (lead) => {
  const users = await User.find({
    role: "employee",
    language: lead.language,
    assignedLeadsCount: { $lt: 3 },
  }).sort({ assignedLeadsCount: 1 });

  if (!users.length) return;

  const user = users[0];

  lead.assignedTo = user._id;

  await Promise.all([
    lead.save(),
    User.findByIdAndUpdate(user._id, { $inc: { assignedLeadsCount: 1 } }),
  ]);
};
