import asyncHandler from "express-async-handler";
import driverModel from "../../driver/models/driverModel.js";
import loadModel from "../../load/models/loadModel.js";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";

const logger = new Logger("paycheck");

// Normalize date → YYYY-MM-DD (no timezone, no time)
const normalizeToDateOnly = (input) => {
  if (!input) return new Date().toISOString().split("T")[0];

  if (input instanceof Date) {
    return input.toISOString().split("T")[0];
  }

  return input.split("T")[0];
};

// Updated week period (date-only, no timezone issues)
const getDriverWeekPeriod = (inputDate = null) => {
  const dateStr = normalizeToDateOnly(inputDate);

  const [year, month, day] = dateStr.split("-").map(Number);

  // Create safe date (no timezone shift)
  const date = new Date(year, month - 1, day, 12, 0, 0);

  const weekday = date.getDay();
  let lastFriday = new Date(date);
  let nextThursday = new Date(date);

  if (weekday === 5) {
    nextThursday.setDate(lastFriday.getDate() + 6);
  } else if (weekday === 4) {
    lastFriday.setDate(date.getDate() - 6);
  } else {
    const daysSinceFriday = (weekday + 2) % 7;
    lastFriday.setDate(date.getDate() - daysSinceFriday);
    nextThursday.setDate(lastFriday.getDate() + 6);
  }

  const format = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;

  return { from: format(lastFriday), to: format(nextThursday) };
};

// Convert "YYYY-MM-DD" → MongoDB real date range
const buildDayRange = (dateString) => {
  const start = new Date(`${dateString}T00:00:00.000Z`);
  const end = new Date(`${dateString}T23:59:59.999Z`);
  return { $gte: start, $lte: end };
};

//                SERVICE
export const getDriverPaycheckService = asyncHandler(async (req) => {
  const driver = await driverModel.findOne({ user: req.user.id }).populate({
    path: "assignedTruck",
    select: "year capacity plateNumber type",
  });
  if (!driver) {
    throw new ApiError("🛑 Driver not found for the logged-in user", 404);
  }

  const { from: lastFriday, to: nextThursday } = getDriverWeekPeriod();

  const loads = await loadModel.find({
    driverId: driver._id,
    status: "delivered",
    deliveredAt: {
      ...buildDayRange(lastFriday),
      $lte: new Date(`${nextThursday}T23:59:59.999Z`),
    },
  });

  const totalLoads = loads.length;

  const totalMiles = loads.reduce((sum, l) => sum + (l.distanceMiles || 0), 0);

  // factor used everywhere
  const milesFactor = driver.toggle ? 0.85 : 1;

  const effectiveMiles = Number((totalMiles * milesFactor).toFixed(2));

  const totalBonus = loads.reduce((sum, l) => sum + (l.bonus || 0), 0);
  const totalDetention = loads.reduce((sum, l) => sum + (l.detention || 0), 0);
  const totalDeduction = loads.reduce((sum, l) => sum + (l.deduction || 0), 0);

  const pricePerMile = driver.pricePerMile || 0;
  const baseEarnings = Number((effectiveMiles * pricePerMile).toFixed(2));

  const totalEarnings = Number(
    (baseEarnings + totalBonus + totalDetention - totalDeduction).toFixed(2),
  );

  const detailedLoads = loads.map((l) => {
    const adjustedMiles = Number(
      ((l.distanceMiles || 0) * milesFactor).toFixed(2),
    );

    return {
      origin: l.origin,
      destination: l.destination,
      totalMiles: adjustedMiles,
      price: Number((adjustedMiles * pricePerMile).toFixed(2)),
      bonus: l.bonus,
      detention: l.detention,
      deduction: l.deduction,
      reason: l.reason,
    };
  });

  await logger.info(`Paycheck | Driver: ${driver._id} | Loads: ${totalLoads}`);

  return {
    driverId: driver.driverId,
    assignedTruck: driver.assignedTruck,
    rate: `${driver.pricePerMile}$`,
    totalLoads,
    totalMiles: effectiveMiles,
    pricePerMile,
    currency: driver.currency || "USD",
    period: {
      from: lastFriday,
      to: nextThursday,
    },
    earnings: {
      baseEarnings,
      totalBonus,
      totalDetention,
      totalDeduction,
      totalEarnings,
    },
    loads: detailedLoads,
  };
});
