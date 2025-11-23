import asyncHandler from "express-async-handler";

import loadModel from "../models/loadModel.js";
import driverModel from "../../driver/models/driverModel.js";
import truckModel from "../../truck/models/truckModel.js";
import settingModel from "../models/settingModel.js";
import ApiError from "../../../utils/apiError.js";
import { sanitizeLoad } from "../../../utils/sanitizeData.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("summary");

const getWeekPeriod = (date = new Date()) => {
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

// ====== Driver Summary ======
export const getDriverLoadSummaryService = asyncHandler(async (req) => {
  const { id } = req.params;
  let { from, to } = req.query;

  const driver = await driverModel.findById(id);
  if (!driver) throw new ApiError("🛑 Driver not found in database", 404);

  if (!from || !to) {
    const weekPeriod = getWeekPeriod();
    from = weekPeriod.from;
    to = weekPeriod.to;
  }

  const startDate = new Date(from);
  const endDate = new Date(to);

  const loads = await loadModel
    .find({
      driverId: id,
      status: "delivered",
      createdAt: { $gte: startDate, $lte: endDate },
    })
    .populate("driverId", "driverId name phone")
    .populate("truckId", "truckId model plateNumber");

  const totalLoads = loads.length;
  const totalMiles = loads.reduce((sum, l) => sum + (l.distanceMiles || 0), 0);

  const pricePerMile = driver.pricePerMile || 0;
  const totalEarnings = Number((totalMiles * pricePerMile).toFixed(2));

  const detailedLoads = loads.map((l) => sanitizeLoad(l));

  await logger.info(`Summary | Driver: ${id} | Loads: ${totalLoads}`);

  return {
    id,
    totalLoads,
    totalMiles,
    totalEarnings,
    pricePerMile,
    currency: driver.currency || "USD",
    period: { from, to },
    loads: detailedLoads,
  };
});

// ====== Truck Summary ======
export const getTruckSummaryService = asyncHandler(async (req) => {
  const { id } = req.params;
  let { from, to } = req.query;

  const truck = await truckModel
    .findById(id)
    .populate("assignedDriver", "driverId name phone pricePerMile");
  if (!truck) throw new ApiError("🛑 Truck not found in database", 404);

  const settings = await settingModel.find({
    key: { $in: ["repairPerMile", "insurancePerMile"] },
  });
  const repairPerMile =
    settings.find((s) => s.key === "repairPerMile")?.value || 0;
  const insurancePerMile =
    settings.find((s) => s.key === "insurancePerMile")?.value || 0;

  if (!from || !to) {
    const weekPeriod = getWeekPeriod();
    from = weekPeriod.from;
    to = weekPeriod.to;
  }

  const startDate = new Date(from);
  const endDate = new Date(to);

  const loads = await loadModel
    .find({
      truckId: id,
      status: "delivered",
      createdAt: { $gte: startDate, $lte: endDate },
    })
    .populate("driverId", "driverId name phone pricePerMile currency")
    .populate("truckId", "truckId model plateNumber");

  const totalLoads = loads.length;
  const totalMiles = loads.reduce((sum, l) => sum + (l.distanceMiles || 0), 0);
  const totalRevenue = loads.reduce((sum, l) => sum + (l.totalPrice || 0), 0);

  const fuelCost = totalMiles * (truck.fuelPerMile || 0);
  const repairCost = totalMiles * repairPerMile;
  const insuranceCost = totalMiles * insurancePerMile;

  const totalDriverPay = loads.reduce((sum, l) => {
    const rate = l.driverId?.pricePerMile || 0;
    return sum + rate * (l.distanceMiles || 0);
  }, 0);

  const totalExpenses = fuelCost + repairCost + insuranceCost + totalDriverPay;
  const netProfit = totalRevenue - totalExpenses;

  const avgRevenuePerMile = totalMiles
    ? Number((totalRevenue / totalMiles).toFixed(2))
    : 0;
  const avgExpensePerMile = totalMiles
    ? Number((totalExpenses / totalMiles).toFixed(2))
    : 0;

  const detailedLoads = loads.map((l) => sanitizeLoad(l));

  await logger.info(`Truck Summary | Truck: ${id} | Loads: ${totalLoads}`);

  return {
    truckId: truck.truckId,
    truckInfo: {
      model: truck.model,
      plateNumber: truck.plateNumber,
      source: truck.source,
      type: truck.type,
      assignedDriver: truck.assignedDriver,
      fuelPerMile: truck.fuelPerMile,
    },
    summary: {
      totalLoads,
      totalMiles,
      totalRevenue,
      fuelCost: Number(fuelCost.toFixed(2)),
      repairCost: Number(repairCost.toFixed(2)),
      insuranceCost: Number(insuranceCost.toFixed(2)),
      driverPay: Number(totalDriverPay.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      avgRevenuePerMile,
      avgExpensePerMile,
      currency: "USD",
    },
    period: { from, to },
    loads: detailedLoads,
  };
});

// ====== All Trucks Summary ======
export const getAllTrucksSummaryService = asyncHandler(async (req) => {
  let { from, to } = req.query;

  if (!from || !to) {
    const weekPeriod = getWeekPeriod();
    from = weekPeriod.from;
    to = weekPeriod.to;
  }

  const startDate = new Date(from);
  const endDate = new Date(to);

  const trucks = await truckModel.find(
    {},
    "truckId plateNumber fuelPerMile source"
  );
  if (!trucks.length) throw new ApiError("🛑 No trucks found in database", 404);

  const truckCompany = trucks.filter((t) => t.source === "company").length;
  const truckOther = trucks.filter((t) => t.source === "other").length;

  const settings = await settingModel.find({
    key: { $in: ["repairPerMile", "insurancePerMile"] },
  });
  const repairPerMile =
    settings.find((s) => s.key === "repairPerMile")?.value || 0;
  const insurancePerMile =
    settings.find((s) => s.key === "insurancePerMile")?.value || 0;

  let totalLoads = 0,
    totalMiles = 0,
    totalRevenue = 0,
    totalFuelCost = 0,
    totalRepairCost = 0,
    totalInsuranceCost = 0,
    totalDriverPay = 0;

  const trucksSummary = [];

  for (const truck of trucks) {
    const loads = await loadModel
      .find({
        truckId: truck._id,
        status: "delivered",
        createdAt: { $gte: startDate, $lte: endDate },
      })
      .populate("driverId", "pricePerMile");

    const truckLoads = loads.length;
    const miles = loads.reduce((sum, l) => sum + (l.distanceMiles || 0), 0);
    const revenue = loads.reduce((sum, l) => sum + (l.totalPrice || 0), 0);

    const fuelCost = miles * (truck.fuelPerMile || 0);
    const repairCost = miles * repairPerMile;
    const insuranceCost = miles * insurancePerMile;

    const driverPay = loads.reduce((sum, l) => {
      const rate = l.driverId?.pricePerMile || 0;
      return sum + rate * (l.distanceMiles || 0);
    }, 0);

    const expenses = fuelCost + repairCost + insuranceCost + driverPay;
    const netProfit = revenue - expenses;

    const avgRevenuePerMile = miles ? Number((revenue / miles).toFixed(2)) : 0;
    const avgExpensePerMile = miles ? Number((expenses / miles).toFixed(2)) : 0;

    trucksSummary.push({
      _id: truck._id,
      truckId: truck.truckId,
      plateNumber: truck.plateNumber,
      source: truck.source,
      summary: {
        totalLoads: truckLoads,
        totalMiles: miles,
        totalRevenue: Number(revenue.toFixed(2)),
        fuelCost: Number(fuelCost.toFixed(2)),
        repairCost: Number(repairCost.toFixed(2)),
        insuranceCost: Number(insuranceCost.toFixed(2)),
        driverPay: Number(driverPay.toFixed(2)),
        totalExpenses: Number(expenses.toFixed(2)),
        netProfit: Number(netProfit.toFixed(2)),
        avgRevenuePerMile,
        avgExpensePerMile,
        currency: "USD",
      },
    });

    totalLoads += truckLoads;
    totalMiles += miles;
    totalRevenue += revenue;
    totalFuelCost += fuelCost;
    totalRepairCost += repairCost;
    totalInsuranceCost += insuranceCost;
    totalDriverPay += driverPay;
  }

  const totalExpenses =
    totalFuelCost + totalRepairCost + totalInsuranceCost + totalDriverPay;
  const netProfit = totalRevenue - totalExpenses;

  const avgRevenuePerMile = totalMiles
    ? Number((totalRevenue / totalMiles).toFixed(2))
    : 0;
  const avgExpensePerMile = totalMiles
    ? Number((totalExpenses / totalMiles).toFixed(2))
    : 0;

  await logger.info(
    `All Trucks Summary | Trucks: ${trucks.length} | Loads: ${totalLoads}`
  );

  return {
    period: { from, to },
    totalTrucks: trucks.length,
    truckCompany,
    truckOther,
    trucksSummary,
    totalSummary: {
      totalTrucks: trucks.length,
      totalLoads,
      totalMiles,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      fuelCost: Number(totalFuelCost.toFixed(2)),
      repairCost: Number(totalRepairCost.toFixed(2)),
      insuranceCost: Number(totalInsuranceCost.toFixed(2)),
      driverPay: Number(totalDriverPay.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      avgRevenuePerMile,
      avgExpensePerMile,
      currency: "USD",
    },
  };
});
