const fs = require('fs');
const fsExtra = require('fs-extra');
const Album = require('../models/albumModel');
const User = require('../models/userModel');
const Pad = require('../models/padModel');
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

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'pads') {
      cb(null, 'public/data/pads');
    } else {
      cb(null, 'public/images/pad');
    }
  },
  filename: (req, file, cb) => {
    if (file.fieldname === 'pads') {
      cb(null, `${file.originalname}`);
    } else {
      cb(null, `${file.originalname}`);
    }
  },
});

const uploadPadZip = multer({
  storage: multerStorage,
});

exports.uploadPad = uploadPadZip.fields([
  {
    name: 'pads',
    maxCount: 1,
  },
  {
    name: 'image',
    maxCount: 1,
  },
]);

function extractZip(zipFilePath, extractPath) {
  return new Promise((resolve, reject) => {
    extract(
      zipFilePath,
      {
        dir: extractPath,
      },
      () => {
        resolve();
      }
    );
  });
}

exports.resizePadImage = catchAsync(async (req, res, next) => {
  if (!req.files['image']) {
    return next();
  } else {
    var filename = req.files['image'][0]['filename'];
    if (req.params.id) {
      req.files['image'][0]['filename'] = `pad-${req.params.id}.jpeg`;
    } else {
      req.files['image'][0]['filename'] = `pad-${req.body._id}.jpeg`;
    }
    await sharp(`public/images/pad/${filename}`)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/images/pad/${req.files['image'][0]['filename']}`);
    const unlinkFile = promisify(fs.unlink);

    await unlinkFile(`public/images/pad/${filename}`).catch(function (error) {
      //do nothing
      alert('Cannot find file!');
    });
  }

  next();
});

exports.extractPad = catchAsync(async (req, res, next) => {
  if (!req.files['pads']) return next();

  const unlinkFile = promisify(fs.unlink);
  const mkdir = promisify(fs.mkdir);
  const exists = promisify(fs.exists);
  let path;
  if (req.params.id) {
    path = `public/data/pads/${req.params.id}`;
    await fsExtra.remove(path);
    await mkdir(path);
  } else {
    var objectId = new ObjectID();
    req.body._id = objectId;
    path = `public/data/pads/${objectId}`;
    if (await exists(path)) {
      await fsExtra.remove(path);
    }
    await mkdir(path);
  }

  const zip = fs
    .createReadStream(`public/data/pads/${req.files['pads'][0]['filename']}`)
    .pipe(unzipper.Parse({ forceStream: true }));
  for await (const entry of zip) {
    const fileName = entry.path;
    const type = entry.type; // 'Directory' or 'File'
    const size = entry.vars.uncompressedSize; // There is also compressedSize;

    if (!fileName.includes('__MACOSX')) {
      entry.pipe(fs.createWriteStream(`${path}/${fileName}`));
    }
  }
  await unlinkFile(`public/data/pads/${req.files['pads'][0]['filename']}`);
  next();
});

/*********************
 *  Handlers for Admin
 *********************/

// Controllers
exports.getProForPad = catchAsync(async (req, res, next) => {
  var renderPath = 'product/pad-post';
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
    title: 'Get All Pro for pad',
    length: length,
    query: query,
    albums,
    producer,
  });
});

exports.getAllPadsToAdmin = catchAsync(async (req, res, next) => {
  const allData = await Pad.find();
  const features = new APIFeatures(Pad, req.query)
    .search()
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const page = req.query.page;
  let length = allData.length;
  const pads = await features.query;

  const searchFeature = new APIFeatures(Pad, req.query).search();
  const searchPatch = await searchFeature.query;
  let query;

  if (req.query.q) {
    query = req.query.q;
    length = searchPatch.length;
  } else {
    query = '';
  }
  res.status(200).render('product/pads', {
    title: 'Pad',
    length: length,
    page: page,
    query: query,
    pads,
  });
});

exports.getPadToAdmin = catchAsync(async (req, res, next) => {
  let query = Pad.findById(req.params.id);
  const doc = await query;

  if (!doc) {
    return next(new AppError('No pad found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      doc,
    },
  });
});

exports.createNewPad = catchAsync(async (req, res, next) => {
  const readDir = promisify(fs.readdir);
  let fileNames = await readDir(`public/data/pads/${req.body._id}`);
  let pads = [];
  fileNames.forEach((file) => {
    pads.push(file);
  });
  req.body.image = req.files['image'][0]['filename'];
  req.body.pads = pads;

  const doc = await Pad.create(req.body);

  res.status(200).json({
    status: 'success',
    pad: doc,
  });
});

/****************
 * Delete Patchs
 ****************/

exports.deletePads = catchAsync(async (req, res, next) => {
  const unlink = promisify(fs.unlink);
  if (req.query) {
    const queryObj = { ...req.query };
    const queryLength = Object.keys(queryObj).length;
    for (var i = 0; i < queryLength; i++) {
      const doc = await Pad.findByIdAndDelete(Object.values(queryObj)[i]);
      await fsExtra.remove(`public/data/pads/${Object.values(queryObj)[i]}`);
      await unlink(
        `public/data/images/pad/pad-${Object.values(queryObj)[i]}.jpeg`
      );
      if (!doc) {
        return next(new AppError('No data found with that ID', 404));
      }
    }
  } else {
    await fsExtra.remove(`public/data/pads/${req.params.id}`);
    await unlink(`public/data/images/pad/pad-${req.params.id}.jpeg`);
    const doc = await Pad.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No data found with that ID', 404));
    }
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.updatePad = catchAsync(async (req, res, next) => {
  let fileNames;
  let pads = [];
  if (req.files['image']) {
    req.body.image = req.files['image'][0]['filename'];
  } else {
    delete req.body.pads;
  }
  if (req.files['pads']) {
    const readDir = promisify(fs.readdir);
    fileNames = await readDir(`public/data/pads/${req.params.id}`);
    fileNames.forEach((file) => {
      pads.push(file);
    });
    req.body.pads = pads;
  } else {
    delete req.body.pads;
  }

  if (parseInt(req.body.priceDiscount) >= parseInt(req.body.price)) {
    return next(new AppError('세일 가격은 원래 가격보다 낮아야 합니다.', 404));
  }

  const doc = await Pad.findByIdAndUpdate(req.params.id, req.body);

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

// Renderer for Pad-post page to create new Pad document
exports.padPostPageRenderer = catchAsync(async (req, res, next) => {
  res.status(200).render('product/pad-post', {
    title: 'Create New Pad',
  });
});
// Renderer for Pad-edit page to edit Pad document
exports.padEditPageRenderer = catchAsync(async (req, res, next) => {
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

  const doc = await Pad.findById(req.params.id);

  if (!doc) {
    return next(new AppError('No pad found with that ID', 404));
  }

  res.status(200).render('product/pad-edit', {
    title: 'Edit a Pad',
    pad: doc,
    length: length,
    query: query,
    albums,
    producer,
  });
});

/*******************************
 *  Pad Handler for Client-side
 *******************************/

// exports.getAllPatchs = factory.getAll(Pad);
// exports.getPatch = factory.getOne(Pad, { path: 'reviews' });
// exports.createPatch = factory.createOne(Pad);
// exports.updatePatch = factory.updateOne(Pad);
// exports.deletePatch = factory.deleteOne(Pad);

// exports.getPatchstats = catchAsync(async (req, res) => {
//   const stats = await Pad.aggregate([
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
