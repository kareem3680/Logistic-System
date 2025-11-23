import asyncHandler from "express-async-handler";
import {
  getAllCustomersService,
  getCustomerByIdService,
  createCustomerService,
  updateCustomerService,
  deleteCustomerService,
} from "../services/customerService.js";

export const getCustomers = asyncHandler(async (req, res) => {
  const customers = await getAllCustomersService(req);
  res.status(200).json({
    message: "✅ Customers fetched successfully",
    stats: customers.stats,
    data: customers.data,
    results: customers.results,
    paginationResult: customers.paginationResult,
  });
});

export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await getCustomerByIdService(req.params.id);
  res.status(200).json({
    message: "✅ Customer fetched successfully",
    data: customer,
  });
});

export const createCustomer = asyncHandler(async (req, res) => {
  const customer = await createCustomerService(req.body, req.user._id);
  res.status(201).json({
    message: "✅ Customer created successfully",
    data: customer,
  });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await updateCustomerService(
    req.params.id,
    req.body,
    req.user._id
  );
  res.status(200).json({
    message: "✅ Customer updated successfully",
    data: customer,
  });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  await deleteCustomerService(req.params.id);
  res.status(200).json({
    message: "✅ Customer deleted successfully",
  });
});
