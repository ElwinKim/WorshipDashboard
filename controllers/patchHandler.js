const fs = require('fs');
const fsExtra = require('fs-extra');
const Album = require('../models/albumModel');
const User = require('../models/userModel');
const Patch = require('../models/patchModel');
const multer = require('multer');
const unzipper = require('unzipper');
const extract = require('extract-zip');
const ObjectID = require('mongodb').ObjectID;
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const { promisify } = require('util');
const { render } = require('pug');
const sharp = require('sharp');

var objectId;
var makeDir = catchAsync(async () => {
  const mkdir = promisify(fs.mkdir);
  objectId = new ObjectID();
  await mkdir(`public/data/patches/${objectId}`);
});

// Patch File upload with multer
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'patch') {
      if (req.params.id) {
        objectId = req.params.id;
        fsExtra.remove(`public/data/patches/${objectId}`);
        const mkdir = promisify(fs.mkdir);
        mkdir(`public/data/patches/${objectId}`);
      } else {
        makeDir();
        req.body._id = objectId;
      }
      cb(null, `public/data/patches/${objectId}`);
    } else {
      cb(null, 'public/images/patch');
    }
  },
  filename: (req, file, cb) => {
    if (file.fieldname === 'patch') {
      cb(null, `${file.originalname}`);
    } else {
      cb(null, `${file.originalname}`);
    }
  },
});

const uploadPatchFiles = multer({
  storage: multerStorage,
});

exports.uploadPatch = uploadPatchFiles.fields([
  {
    name: 'patch',
    maxCount: 1,
  },
  {
    name: 'image',
    maxCount: 1,
  },
]);

exports.resizePatchImage = catchAsync(async (req, res, next) => {
  if (!req.files['image']) {
    return next();
  } else {
    var filename = req.files['image'][0]['filename'];
    if (req.params.id) {
      req.files['image'][0]['filename'] = `patch-${req.params.id}.jpeg`;
    } else {
      req.files['image'][0]['filename'] = `patch-${req.body._id}.jpeg`;
    }
    await sharp(`public/images/patch/${filename}`)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/images/patch/${req.files['image'][0]['filename']}`);
    const unlinkFile = promisify(fs.unlink);

    await unlinkFile(`public/images/patch/${filename}`).catch(function (error) {
      //do nothing
      alert('Cannot find file!');
    });
  }

  next();
});

/*********************
 *  Handlers for Admin
 *********************/

// Controllers
exports.getProForPatch = catchAsync(async (req, res, next) => {
  var renderPath = 'product/patch-post';
  // To find All album data
  const allData = await Album.find();
  const features = new APIFeatures(Album, req.query)
    .search()
    .filter()
    .sort()
    .limitFields();

  let length = allData.length;
  const albums = await features.query;

  // To find album when admin user search
  const searchFeature = new APIFeatures(Album, req.query).search();
  const searchAlbum = await searchFeature.query;
  let query;

  if (req.query.q) {
    query = req.query.q;
    length = searchAlbum.length;
  } else {
    query = '';
  }

  // To Find producer role from user database
  const userFeatures = new APIFeatures(User.find(), { role: 'pro' })
    .search()
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const producer = await userFeatures.query;

  res.status(200).render(renderPath, {
    title: 'Get All Pro for patch',
    length: length,
    query: query,
    albums,
    producer,
  });
});

exports.getAllPatchesToAdmin = catchAsync(async (req, res, next) => {
  const allData = await Patch.find();
  const features = new APIFeatures(Patch, req.query)
    .search()
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const page = req.query.page;
  let length = allData.length;
  const patches = await features.query;

  const searchFeature = new APIFeatures(Patch, req.query).search();
  const searchPatch = await searchFeature.query;
  let query;

  if (req.query.q) {
    query = req.query.q;
    length = searchPatch.length;
  } else {
    query = '';
  }
  res.status(200).render('product/patches', {
    title: 'Patch',
    length: length,
    page: page,
    query: query,
    patches,
  });
});

exports.getPatchToAdmin = catchAsync(async (req, res, next) => {
  let query = Patch.findById(req.params.id);
  const doc = await query;

  if (!doc) {
    return next(new AppError('No patch found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      doc,
    },
  });
});

exports.createNewPatch = catchAsync(async (req, res, next) => {
  const readDir = promisify(fs.readdir);
  var fileNames = await readDir(`public/data/patches/${req.body._id}`);
  req.body.patches = fileNames;
  req.body.image = req.files['image'][0]['filename'];

  const doc = await Patch.create(req.body);

  res.status(200).json({
    status: 'success',
    patch: doc,
  });
});

/****************
 * Delete Patchs
 ****************/

exports.deletePatches = catchAsync(async (req, res, next) => {
  const unlink = promisify(fs.unlink);
  if (req.query) {
    const queryObj = { ...req.query };
    const queryLength = Object.keys(queryObj).length;
    for (var i = 0; i < queryLength; i++) {
      const doc = await Patch.findByIdAndDelete(Object.values(queryObj)[i]);
      await fsExtra.remove(`public/data/patches/${Object.values(queryObj)[i]}`);
      await unlink(
        `public/data/images/patch/patch-${Object.values(queryObj)[i]}.jpeg`
      );
      if (!doc) {
        return next(new AppError('No data found with that ID', 404));
      }
    }
  } else {
    await fsExtra.remove(`public/data/patches/${req.params.id}`);
    await unlink(`public/data/images/patch/patch-${req.params.id}.jpeg`);
    const doc = await Patch.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No data found with that ID', 404));
    }
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.updatePatch = catchAsync(async (req, res, next) => {
  var fileNames;
  if (req.files['image']) {
    req.body.image = req.files['image'][0]['filename'];
  } else {
    delete req.body.image;
  }
  if (req.files['patch']) {
    const readDir = promisify(fs.readdir);
    fileNames = await readDir(`public/data/patches/${req.params.id}`);
    req.body.patches = fileNames;
  } else {
    delete req.body.patches;
  }

  if (parseInt(req.body.priceDiscount) >= parseInt(req.body.price)) {
    return next(new AppError('세일 가격은 원래 가격보다 낮아야 합니다.', 404));
  }

  const doc = await Patch.findByIdAndUpdate(req.params.id, req.body);

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

// Renderer for Patch-post page to create new Patch document
exports.patchPostPageRenderer = catchAsync(async (req, res, next) => {
  res.status(200).render('product/patch-post', {
    title: 'Create New Patch',
  });
});
// Renderer for Patch-edit page to edit Patch document
exports.PatchEditPageRenderer = catchAsync(async (req, res, next) => {
  // To find All album data
  const allData = await Album.find();
  const features = new APIFeatures(Album, req.query)
    .search()
    .filter()
    .sort()
    .limitFields();

  let length = allData.length;
  const albums = await features.query;

  // To find album when admin user search
  const searchFeature = new APIFeatures(Album, req.query).search();
  const searchAlbum = await searchFeature.query;
  let query;

  if (req.query.q) {
    query = req.query.q;
    length = searchAlbum.length;
  } else {
    query = '';
  }

  // To Find producer role from user database
  const userFeatures = new APIFeatures(User.find(), { role: 'pro' })
    .search()
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const producer = await userFeatures.query;

  const doc = await Patch.findById(req.params.id);

  if (!doc) {
    return next(new AppError('No patch found with that ID', 404));
  }

  res.status(200).render('product/patch-edit', {
    title: 'Edit a Patch',
    patch: doc,
    length: length,
    query: query,
    albums,
    producer,
  });
});

/*******************************
 *  Patch Handler for Client-side
 *******************************/

// exports.getAllPatchs = factory.getAll(Patch);
// exports.getPatch = factory.getOne(Patch, { path: 'reviews' });
// exports.createPatch = factory.createOne(Patch);
// exports.updatePatch = factory.updateOne(Patch);
// exports.deletePatch = factory.deleteOne(Patch);

// exports.getPatchstats = catchAsync(async (req, res) => {
//   const stats = await Patch.aggregate([
//     {
//       $match: { ratingsAverage: { $gte: 4.5 } },
//     },
//     {
//       $group: {
//         _id: { $toUpper: '$songName' },
//         numPatchs: { $sum: 1 },
//         numRatings: { $sum: '$ratingsQuantity' },
//         avgRating: { $avg: '$ratingsAverage' },
//         avgPrice: { $avg: '$price' },
//         minPrice: { $min: '$price' },
//         maxPrice: { $max: '$price' },
//       },
//     },
//     {
//       $sort: { avgPrice: 1 },
//     },
//   ]);
//   res.status(200).json({
//     status: 'Success',
//     data: {
//       stats,
//     },
//   });
// });
