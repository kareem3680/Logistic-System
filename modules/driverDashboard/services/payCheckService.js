import asyncHandler from "express-async-handler";
import driverModel from "../../driver/models/driverModel.js";
import loadModel from "../../load/models/loadModel.js";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";

const logger = new Logger("paycheck");

const getDriverWeekPeriod = (date = new Date()) => {
  const day = date.getDay();
  let lastFriday = new Date(date);
  let nextThursday = new Date(date);

  if (day === 5) {
    nextThursday.setDate(lastFriday.getDate() + 6);
  } else if (day === 4) {
    lastFriday.setDate(date.getDate() - 6);
  } else {
    const daysSinceFriday = (day + 2) % 7;
    lastFriday.setDate(date.getDate() - daysSinceFriday);
    nextThursday.setDate(lastFriday.getDate() + 6);
  }

  const formatDate = (d) => d.toISOString().split("T")[0];

  return { from: formatDate(lastFriday), to: formatDate(nextThursday) };
};

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
    createdAt: { $gte: lastFriday, $lte: nextThursday },
  });

  const totalLoads = loads.length;
  const totalMiles = loads.reduce((sum, l) => sum + (l.distanceMiles || 0), 0);
  const pricePerMile = driver.pricePerMile || 0;
  const totalEarnings = Number((totalMiles * pricePerMile).toFixed(2));

  const detailedLoads = loads.map((l) => ({
    origin: l.origin,
    destination: l.destination,
    totalMiles: l.distanceMiles || 0,
    price: Number(((l.distanceMiles || 0) * pricePerMile).toFixed(2)),
  }));

  await logger.info(`Paycheck | Driver: ${driver._id} | Loads: ${totalLoads}`);

  return {
    driverId: driver.driverId,
    assignedTruck: driver.assignedTruck,
    rate: `${driver.pricePerMile}$`,
    totalLoads,
    totalMiles,
    totalEarnings,
    pricePerMile,
    currency: driver.currency || "USD",
    period: {
      from: lastFriday,
      to: nextThursday,
    },
    loads: detailedLoads,
  };
});
