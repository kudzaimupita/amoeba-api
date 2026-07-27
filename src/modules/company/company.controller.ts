import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';

import * as companyService from './company.service';
import { checkCompanyPlanQuota } from './billings';
import ApiError from '../../utils/errors/ApiError';
import { activityLogService } from '../activityLogs';
import { catchAsync, pick } from '../../utils';
import { userService } from '../user';
import { welcomeTemplate } from '../auth/templates/welcome';
import SendNotification from '../comms/internal';
import config from '../../config/config';
import { IOptions } from '../../utils/paginate/paginate';

const notifier = new SendNotification(config.mailerSendKey, 'noreply@servly.app', 'Servly');

export const getCompanies = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name', 'role']);
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  options.limit = 100;
  const result = await companyService.queryCompanies({ ...filter, company: req.user?.company?._id }, options);
  res.send(result);
});

export const getCompany = catchAsync(async (req: Request, res: Response) => {
  const company = await companyService.getCompanyById(new mongoose.Types.ObjectId(req.user?.company));
  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
  }
  res.send(company);
});

export const storeCompany = catchAsync(async (req: Request, res: Response) => {
  checkCompanyPlanQuota(req, 'createCompany', undefined);

  req.body.systemUser = new mongoose.Types.ObjectId(req.user.id);
  req.body.email = req.user.email;
  req.body.addedBy = req.user.id;

  const company = await companyService.updateCompanyById(req.user.company._id, req.body);

  await activityLogService.createActivityLog({
    userId: req.user?._id,
    resourceId: company?._id,
    resourceType: 'DATA',
    company: company?._id,
    actionType: 'CREATE',
    description: `${req.user.name} created company: ${company?.name} at ${new Date()}`,
    status: 'SUCCESS',
  });

  await userService.updateUserById(
    new mongoose.Types.ObjectId(req.user?._id),
    { isBoarded: true, company: new mongoose.Types.ObjectId(company?._id) },
    req.user?.company?._id
  );

  if (req.user?.email) {
    await notifier.sendWelcome(req.user.email, req.user?.name || '', welcomeTemplate);
  }

  res.send({ company });
});

export const updateCompany = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params.companyId !== 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Company ID is required');
  }

  const company = await companyService.updateCompanyById(new mongoose.Types.ObjectId(req.params.companyId), req.body);

  if (req.user?.company?._id?.toString() !== company?._id?.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  await activityLogService.createActivityLog({
    actionBy: req.user?._id,
    resourceType: 'DATA',
    company: req.user?.company?._id,
    actionType: 'UPDATE',
    description: `${req.user.name} updated company: ${company.name} at ${new Date()}`,
    status: 'SUCCESS',
    statusCode: 200,
  });

  res.send(company);
});

export const deleteCompany = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params.companyId !== 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Company ID is required');
  }

  const company = await companyService.getCompanyById(new mongoose.Types.ObjectId(req.params.companyId));
  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
  }

  if (req.user?.company?._id?.toString() !== company._id.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  await companyService.deleteCompanyById(new mongoose.Types.ObjectId(req.params.companyId));
  res.status(httpStatus.NO_CONTENT).send();
});
