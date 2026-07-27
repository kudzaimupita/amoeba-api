/* eslint-disable prettier/prettier */
import { ObjectId } from 'mongodb';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { ICompanyDoc, NewCreatedCompany, UpdateCompanyBody } from './company.interfaces';
import { IOptions, QueryResult } from '../../utils/paginate/paginate';

import ApiError from '../../utils/errors/ApiError';
import Company from './company.model';

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* eslint-disable import/no-extraneous-dependencies */
/**
 * Create a company
 * @param {NewCreatedCompany} companyBody
 * @returns {Promise<ICompanyDoc>}
 */
export const createCompany = async (companyBody: NewCreatedCompany): Promise<ICompanyDoc> => {
  return Company.create(companyBody);
};

/**
 * Query for companies
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryCompanies = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const components = await Company.paginate(filter, options);
  return components;
};

/**
 * Get company by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<ICompanyDoc | null>}
 */
export const getCompanyById = async (id: mongoose.Types.ObjectId): Promise<ICompanyDoc | null> => {
  const filter: Record<string, any> = { _id: new ObjectId(id) };

  return Company.findOne(filter).exec();
};

export const getCompanyByName = async (name: string): Promise<ICompanyDoc | null> => {
  const sanitizedName = name.trim();

  if (!sanitizedName) {
    return null;
  }

  const regex = new RegExp(`^${escapeRegExp(sanitizedName)}$`, 'i');

  return Company.findOne({ name: regex }).exec();
};

/**
 * Update company by id
 * @param {mongoose.Types.ObjectId} companyId
 * @param {UpdateCompanyBody} updateBody
 * @returns {Promise<ICompanyDoc | null>}
 */
export const updateCompanyById = async (
  companyId: mongoose.Types.ObjectId,
  updateBody: UpdateCompanyBody
): Promise<ICompanyDoc | null> => {
  const company = await getCompanyById(companyId);
  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
  }

  Object.assign(company, updateBody);
  await company.save();
  return company;
};

export const updateCompany = async (
  companyId: mongoose.Types.ObjectId,
  updateBody: UpdateCompanyBody
): Promise<ICompanyDoc | null> => {
  const company = await getCompanyById(companyId);
  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
  }

  Object.assign(company, updateBody);
  await company.save();
  return company;
};

/**
 * Delete compan
/**
 * Delete company by id
 * @param {mongoose.Types.ObjectId} companyId
 * @returns {Promise<ICompanyDoc | null>}
 */
export const deleteCompanyById = async (companyId: mongoose.Types.ObjectId): Promise<ICompanyDoc | null> => {
  const company = await getCompanyById(companyId);
  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
  }
  await company.deleteOne();
  return company;
};
