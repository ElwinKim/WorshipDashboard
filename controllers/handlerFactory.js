const catchAsync = require('./../utils/catchAsync');
const multer = require('multer');
const AppError = require('./../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    if (req.query) {
      const queryObj = { ...req.query };
      const queryLength = Object.keys(queryObj).length;
      for (var i = 0; i < queryLength; i++) {
        const doc = await Model.findByIdAndDelete(Object.values(queryObj)[i]);
        if (!doc) {
          return next(new AppError('No data found with that ID', 404));
        }
      }
    } else {
      const doc = await Model.findByIdAndDelete(req.params.id);

      if (!doc) {
        return next(new AppError('No data found with that ID', 404));
      }
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No Document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    req.model = doc;
    res.status(201).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError('No track found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tracks
    let filter = {};
    if (req.params.trackId) filter = { track: req.params.trackId };
    if (req.params.padId) filter = { pad: req.params.padId };
    if (req.params.patchId) filter = { patch: req.params.patchId };

    //Execute Query
    const features = new APIFeatures(Model, req.query)
      .search()
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const doc = await features.query;

    //Send Response
    res.status(200).json({
      status: 'success',
      result: doc.length,
      data: {
        doc,
      },
    });
  });
