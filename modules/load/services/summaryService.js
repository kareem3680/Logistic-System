import asyncHandler from "express-async-handler";
import { subDays } from "date-fns";

import loadModel from "../../load/models/loadModel.js";
import driverModel from "../../driver/models/driverModel.js";
import truckModel from "../../truck/models/truckModel.js";
import settingModel from "../models/settingModel.js";
import ApiError from "../../../utils/apiError.js";
import { sanitizeLoad } from "../../../utils/sanitizeData.js";
import Logger from "../../../utils/loggerService.js";

const logger = new Logger("summary");

// ====== Helper Functions (same as before) ======
const normalizeToDateOnly = (input) => {
  if (!input) return new Date().toISOString().split("T")[0];

  if (input instanceof Date) {
    return input.toISOString().split("T")[0];
  }

  return input.split("T")[0];
};

const getWeekPeriod = (inputDate = null) => {
  const dateStr = normalizeToDateOnly(inputDate);

  const [year, month, day] = dateStr.split("-").map(Number);

  // Prevent timezone shift
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

const buildDayRange = (dateString) => {
  const start = new Date(`${dateString}T00:00:00.000Z`);
  const end = new Date(`${dateString}T23:59:59.999Z`);
  return { $gte: start, $lte: end };
};

const calculateTruckFinancials = (
  loads,
  truck,
  repairPerMile,
  insurancePerMile,
) => {
  const totalLoads = loads.length;
  const totalMiles = loads.reduce((sum, l) => sum + (l.distanceMiles || 0), 0);
  const totalRevenue = loads.reduce((sum, l) => sum + (l.totalPrice || 0), 0);

  const fuelCost = totalMiles * (truck.fuelPerMile || 0);
  const repairCost = totalMiles * repairPerMile;
  const insuranceCost = totalMiles * insurancePerMile;

  const totalDriverPay = loads.reduce((sum, l) => {
    const rate = l.driverId?.pricePerMile || 0;
    const milesPay = rate * (l.distanceMiles || 0);

    const bonus = l.bonus || 0;
    const detention = l.detention || 0;
    const deduction = l.deduction || 0;

    return sum + milesPay + bonus + detention - deduction;
  }, 0);

  const totalExpenses = fuelCost + repairCost + insuranceCost + totalDriverPay;
  const netProfit = totalRevenue - totalExpenses;

  const avgRevenuePerMile = totalMiles ? totalRevenue / totalMiles : 0;
  const avgExpensePerMile = totalMiles ? totalExpenses / totalMiles : 0;
  const avgProfitPerMile = avgRevenuePerMile - avgExpensePerMile;
  const profitMargin = totalRevenue ? (netProfit / totalRevenue) * 100 : 0;

  return {
    totalLoads,
    totalMiles,
    totalRevenue,
    fuelCost,
    repairCost,
    insuranceCost,
    totalDriverPay,
    totalExpenses,
    netProfit,
    avgRevenuePerMile,
    avgExpensePerMile,
    avgProfitPerMile,
    profitMargin,
  };
};

const formatFinancialSummary = (financials) => {
  return {
    totalLoads: financials.totalLoads,
    totalMiles: financials.totalMiles,
    totalRevenue: Number(financials.totalRevenue.toFixed(2)),
    fuelCost: Number(financials.fuelCost.toFixed(2)),
    repairCost: Number(financials.repairCost.toFixed(2)),
    insuranceCost: Number(financials.insuranceCost.toFixed(2)),
    driverPay: Number(financials.totalDriverPay.toFixed(2)),
    totalExpenses: Number(financials.totalExpenses.toFixed(2)),
    netProfit: Number(financials.netProfit.toFixed(2)),
    avgRevenuePerMile: Number(financials.avgRevenuePerMile.toFixed(2)),
    avgExpensePerMile: Number(financials.avgExpensePerMile.toFixed(2)),
    avgProfitPerMile: Number(financials.avgProfitPerMile.toFixed(2)),
    profitMargin: Math.round(financials.profitMargin),
    currency: "USD",
  };
};

const calculatePercentageChange = (currentValue, prevValue) => {
  if (!prevValue) return 0;
  return Math.round(((currentValue - prevValue) / prevValue) * 100);
};

// ====== Driver Summary ======
export const getDriverLoadSummaryService = asyncHandler(
  async (req, companyId, role) => {
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const { id } = req.params;
    let { from, to } = req.query;

    const driver = await driverModel.findOne({ _id: id, companyId });
    if (!driver) throw new ApiError("🛑 Driver not found in your company", 404);

    if (!from || !to) {
      const weekPeriod = getWeekPeriod();
      from = weekPeriod.from;
      to = weekPeriod.to;
    }

    const startDate = buildDayRange(from).$gte;
    const endDate = new Date(`${to}T23:59:59.999Z`);

    const loads = await loadModel
      .find({
        driverId: id,
        companyId,
        status: "delivered",
        deliveredAt: { $gte: startDate, $lte: endDate },
      })
      .populate("driverId", "driverId name phone")
      .populate("truckId", "truckId model plateNumber");

    const milesFactor = driver.toggle ? 0.85 : 1;

    const totalLoads = loads.length;
    const totalMiles = loads.reduce(
      (sum, l) => sum + (l.distanceMiles || 0) * milesFactor,
      0,
    );
    const totalBonus = loads.reduce((sum, l) => sum + (l.bonus || 0), 0);
    const totalDetention = loads.reduce(
      (sum, l) => sum + (l.detention || 0),
      0,
    );
    const totalDeduction = loads.reduce(
      (sum, l) => sum + (l.deduction || 0),
      0,
    );

    const pricePerMile = driver.pricePerMile || 0;
    const baseEarnings = totalMiles * pricePerMile;

    const totalEarnings = Number(
      (baseEarnings + totalBonus + totalDetention - totalDeduction).toFixed(2),
    );

    const detailedLoads = loads.map((l) => {
      const adjustedMiles = Number(
        ((l.distanceMiles || 0) * milesFactor).toFixed(2),
      );
      const adjustedTotalPrice = Number(
        (adjustedMiles * pricePerMile).toFixed(2),
      );

      const sanitized = sanitizeLoad(l);
      return {
        ...sanitized,
        distanceMiles: adjustedMiles,
        totalPrice: adjustedTotalPrice,
      };
    });

    await logger.info(
      `Summary | Driver: ${id} | Loads: ${totalLoads} | Company: ${companyId}`,
    );

    return {
      id,
      totalLoads,
      totalMiles,
      pricePerMile,
      currency: driver.currency || "USD",
      period: { from, to },
      earnings: {
        baseEarnings,
        totalBonus,
        totalDetention,
        totalDeduction,
        totalEarnings,
      },
      loads: detailedLoads,
    };
  },
);

// ====== Truck Summary ======
export const getTruckSummaryService = asyncHandler(
  async (req, companyId, role) => {
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const { id } = req.params;
    let { from, to } = req.query;

    const truck = await truckModel
      .findOne({ _id: id, companyId })
      .populate(
        "assignedDriver",
        "driverId name phone pricePerMile capacity year",
      );
    if (!truck) throw new ApiError("🛑 Truck not found in your company", 404);

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
        companyId,
        status: "delivered",
        createdAt: { $gte: startDate, $lte: endDate },
      })
      .populate("driverId", "driverId name phone pricePerMile currency")
      .populate("truckId", "truckId model plateNumber");

    const financials = calculateTruckFinancials(
      loads,
      truck,
      repairPerMile,
      insurancePerMile,
    );
    const summary = formatFinancialSummary(financials);

    const periodLength = endDate.getTime() - startDate.getTime();

    const previousNetProfits = [];

    for (let i = 1; i <= 7; i++) {
      const prevStart = new Date(startDate.getTime() - periodLength * i);
      const prevEnd = new Date(endDate.getTime() - periodLength * i);

      const prevLoads = await loadModel
        .find({
          truckId: id,
          companyId,
          status: "delivered",
          createdAt: { $gte: prevStart, $lte: prevEnd },
        })
        .populate("driverId", "driverId name phone pricePerMile currency")
        .populate("truckId", "truckId model plateNumber");

      const prevFinancials = calculateTruckFinancials(
        prevLoads,
        truck,
        repairPerMile,
        insurancePerMile,
      );

      previousNetProfits.push(Number(prevFinancials.netProfit.toFixed(2)));
    }

    const netProfitHistory = {
      current: summary.netProfit,
      previous: previousNetProfits,
    };

    await logger.info(
      `Truck Summary | Truck: ${id} | Loads: ${financials.totalLoads} | Company: ${companyId}`,
    );

    return {
      period: { from, to },
      truckId: truck.truckId,
      truckInfo: {
        model: truck.model,
        plateNumber: truck.plateNumber,
        source: truck.source,
        type: truck.type,
        year: truck.year,
        capacity: truck.capacity,
        assignedDriver: truck.assignedDriver,
        fuelPerMile: truck.fuelPerMile,
      },
      summary,
      netProfitHistory,
    };
  },
);

// ====== All Trucks Summary ======
export const getAllTrucksSummaryService = asyncHandler(
  async (req, companyId, role) => {
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    let { from, to } = req.query;

    if (!from || !to) {
      const weekPeriod = getWeekPeriod();
      from = weekPeriod.from;
      to = weekPeriod.to;
    }

    const startDate = new Date(from);
    const endDate = new Date(to);

    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const prevStartDate = subDays(startDate, daysDiff);
    const prevEndDate = subDays(endDate, daysDiff);

    const [trucks, settings, currentLoads, previousLoads] = await Promise.all([
      truckModel.find({ companyId }, "truckId plateNumber fuelPerMile source"),
      settingModel.find({
        key: { $in: ["repairPerMile", "insurancePerMile"] },
      }),
      loadModel
        .find({
          companyId,
          status: "delivered",
          createdAt: { $gte: startDate, $lte: endDate },
        })
        .populate("driverId", "pricePerMile"),
      loadModel
        .find({
          companyId,
          status: "delivered",
          createdAt: { $gte: prevStartDate, $lte: prevEndDate },
        })
        .populate("driverId", "pricePerMile"),
    ]);

    if (!trucks.length) {
      throw new ApiError("🛑 No trucks found in your company", 404);
    }

    const repairPerMile =
      settings.find((s) => s.key === "repairPerMile")?.value || 0;
    const insurancePerMile =
      settings.find((s) => s.key === "insurancePerMile")?.value || 0;

    const currentLoadsByTruck = {};
    const previousLoadsByTruck = {};

    currentLoads.forEach((load) => {
      const truckId = load.truckId?.toString();
      if (truckId) {
        if (!currentLoadsByTruck[truckId]) currentLoadsByTruck[truckId] = [];
        currentLoadsByTruck[truckId].push(load);
      }
    });

    previousLoads.forEach((load) => {
      const truckId = load.truckId?.toString();
      if (truckId) {
        if (!previousLoadsByTruck[truckId]) previousLoadsByTruck[truckId] = [];
        previousLoadsByTruck[truckId].push(load);
      }
    });

    const truckCompany = trucks.filter((t) => t.source === "company").length;
    const truckOther = trucks.filter((t) => t.source === "other").length;

    let totalLoads = 0,
      totalMiles = 0,
      totalRevenue = 0,
      totalFuelCost = 0,
      totalRepairCost = 0,
      totalInsuranceCost = 0,
      totalDriverPay = 0;

    let prevTotalMiles = 0,
      prevTotalRevenue = 0,
      prevTotalFuelCost = 0,
      prevTotalRepairCost = 0,
      prevTotalInsuranceCost = 0,
      prevTotalDriverPay = 0;

    const trucksSummary = [];

    for (const truck of trucks) {
      const truckId = truck._id.toString();
      const truckLoads = currentLoadsByTruck[truckId] || [];
      const truckPrevLoads = previousLoadsByTruck[truckId] || [];

      const currentFinancials = calculateTruckFinancials(
        truckLoads,
        truck,
        repairPerMile,
        insurancePerMile,
      );
      const previousFinancials = calculateTruckFinancials(
        truckPrevLoads,
        truck,
        repairPerMile,
        insurancePerMile,
      );

      totalLoads += currentFinancials.totalLoads;
      totalMiles += currentFinancials.totalMiles;
      totalRevenue += currentFinancials.totalRevenue;
      totalFuelCost += currentFinancials.fuelCost;
      totalRepairCost += currentFinancials.repairCost;
      totalInsuranceCost += currentFinancials.insuranceCost;
      totalDriverPay += currentFinancials.totalDriverPay;

      prevTotalMiles += previousFinancials.totalMiles;
      prevTotalRevenue += previousFinancials.totalRevenue;
      prevTotalFuelCost += previousFinancials.fuelCost;
      prevTotalRepairCost += previousFinancials.repairCost;
      prevTotalInsuranceCost += previousFinancials.insuranceCost;
      prevTotalDriverPay += previousFinancials.totalDriverPay;

      trucksSummary.push({
        _id: truck._id,
        truckId: truck.truckId,
        plateNumber: truck.plateNumber,
        source: truck.source,
        summary: formatFinancialSummary(currentFinancials),
      });
    }

    const totalExpenses =
      totalFuelCost + totalRepairCost + totalInsuranceCost + totalDriverPay;
    const netProfit = totalRevenue - totalExpenses;

    const avgRevenuePerMile = totalMiles ? totalRevenue / totalMiles : 0;
    const avgExpensePerMile = totalMiles ? totalExpenses / totalMiles : 0;
    const avgProfitPerMile = avgRevenuePerMile - avgExpensePerMile;
    const profitMargin = totalRevenue ? (netProfit / totalRevenue) * 100 : 0;

    const prevTotalExpenses =
      prevTotalFuelCost +
      prevTotalRepairCost +
      prevTotalInsuranceCost +
      prevTotalDriverPay;
    const prevAvgRevenuePerMile = prevTotalMiles
      ? prevTotalRevenue / prevTotalMiles
      : 0;
    const prevAvgExpensePerMile = prevTotalMiles
      ? prevTotalExpenses / prevTotalMiles
      : 0;
    const prevAvgProfitPerMile = prevAvgRevenuePerMile - prevAvgExpensePerMile;
    const prevProfitMargin = prevTotalRevenue
      ? ((prevTotalRevenue - prevTotalExpenses) / prevTotalRevenue) * 100
      : 0;

    const changes = {
      fuelCostChange: calculatePercentageChange(
        totalFuelCost,
        prevTotalFuelCost,
      ),
      repairCostChange: calculatePercentageChange(
        totalRepairCost,
        prevTotalRepairCost,
      ),
      insuranceCostChange: calculatePercentageChange(
        totalInsuranceCost,
        prevTotalInsuranceCost,
      ),
      driverPayChange: calculatePercentageChange(
        totalDriverPay,
        prevTotalDriverPay,
      ),
      avgRevenuePerMileChange: calculatePercentageChange(
        avgRevenuePerMile,
        prevAvgRevenuePerMile,
      ),
      avgExpensePerMileChange: calculatePercentageChange(
        avgExpensePerMile,
        prevAvgExpensePerMile,
      ),
      avgProfitPerMileChange: calculatePercentageChange(
        avgProfitPerMile,
        prevAvgProfitPerMile,
      ),
      profitMarginChange: calculatePercentageChange(
        profitMargin,
        prevProfitMargin,
      ),
    };

    await logger.info(
      `All Trucks Summary | Trucks: ${trucks.length} | Company: ${companyId}`,
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
        avgRevenuePerMile: Number(avgRevenuePerMile.toFixed(2)),
        avgExpensePerMile: Number(avgExpensePerMile.toFixed(2)),
        avgProfitPerMile: Number(avgProfitPerMile.toFixed(2)),
        profitMargin: Math.round(profitMargin),
        ...changes,
        currency: "USD",
      },
    };
  },
);
