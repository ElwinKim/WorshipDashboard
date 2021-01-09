const fs = require('fs');
const fsExtra = require('fs-extra');
const Album = require('../models/albumModel');
const User = require('../models/userModel');
const Track = require('../models/trackModel');
const multer = require('multer');
const unzipper = require('unzipper');
const sharp = require('sharp');
const extract = require('extract-zip');
const ObjectID = require('mongodb').ObjectID;
const React = require('react');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const { promisify } = require('util');
const { render } = require('pug');
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/data/tracks');
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}`);
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.split('/')[1] === 'zip') {
    cb(null, true);
  } else {
    cb(
      new AppError('Not an zip file! Please upload only zip file.', 400),
      false
    );
  }
};

const uploadTrackZip = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTrack = uploadTrackZip.single('tracks');

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

exports.extractTrack = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  const unlinkFile = promisify(fs.unlink);
  const mkdir = promisify(fs.mkdir);
  const exists = promisify(fs.exists);
  let path;
  if (req.params.id) {
    path = `public/data/tracks/${req.params.id}`;
    await fsExtra.remove(path);
    await mkdir(path);
  } else {
    var objectId = new ObjectID();
    req.body._id = objectId;
    path = `public/data/tracks/${objectId}`;
    if (await exists(path)) {
      await fsExtra.remove(path);
    }
    await mkdir(path);
  }

  const zip = fs
    .createReadStream(`public/data/tracks/${req.file.filename}`)
    .pipe(unzipper.Parse({ forceStream: true }));
  for await (const entry of zip) {
    const fileName = entry.path;
    const type = entry.type; // 'Directory' or 'File'
    const size = entry.vars.uncompressedSize; // There is also compressedSize;

    if (!fileName.includes('__MACOSX')) {
      entry.pipe(fs.createWriteStream(`${path}/${fileName}`));
    }
  }
  await unlinkFile(`public/data/tracks/${req.file.filename}`);
  next();
});

/*********************
 *  Handlers for Admin
 *********************/

// Controllers
exports.getAlbumsAndProForTrack = catchAsync(async (req, res, next) => {
  var renderPath = 'product/track-post';

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
    title: 'Get All Albums for track',
    length: length,
    query: query,
    albums,
    producer,
  });
});

exports.getAllTracksToAdmin = catchAsync(async (req, res, next) => {
  const allData = await Track.find();
  const features = new APIFeatures(Track, req.query)
    .search()
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const page = req.query.page;
  let length = allData.length;
  const tracks = await features.query;

  const searchFeature = new APIFeatures(Track, req.query).search();
  const searchTrack = await searchFeature.query;
  let query;

  if (req.query.q) {
    query = req.query.q;
    length = searchTrack.length;
  } else {
    query = '';
  }
  res.status(200).render('product/tracks', {
    title: 'Track',
    length: length,
    page: page,
    query: query,
    tracks,
  });
});

exports.getTrackToAdmin = catchAsync(async (req, res, next) => {
  let query = Track.findById(req.params.id);
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

exports.createNewTrack = catchAsync(async (req, res, next) => {
  const readDir = promisify(fs.readdir);
  let fileNames = await readDir(`public/data/tracks/${req.body._id}`);
  let tracks = [];
  fileNames.forEach((file) => {
    tracks.push(file);
  });

  req.body.tracks = tracks;

  const doc = await Track.create(req.body);

  res.status(200).json({
    status: 'success',
    track: doc,
  });
});

/****************
 * Delete Tracks
 ****************/

exports.deleteTracks = catchAsync(async (req, res, next) => {
  if (req.query) {
    const queryObj = { ...req.query };
    const queryLength = Object.keys(queryObj).length;
    for (var i = 0; i < queryLength; i++) {
      const doc = await Track.findByIdAndDelete(Object.values(queryObj)[i]);
      await fsExtra.remove(`public/data/tracks/${Object.values(queryObj)[i]}`);
      if (!doc) {
        return next(new AppError('No data found with that ID', 404));
      }
    }
  } else {
    await fsExtra.remove(`public/data/tracks/${req.params.id}`);
    const doc = await Track.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No data found with that ID', 404));
    }
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.updateTrack = catchAsync(async (req, res, next) => {
  let fileNames;
  let tracks = [];
  if (req.file) {
    const readDir = promisify(fs.readdir);
    fileNames = await readDir(`public/data/tracks/${req.params.id}`);
    fileNames.forEach((file) => {
      tracks.push(file);
    });
    req.body.tracks = tracks;
  } else {
    delete req.body.tracks;
  }

  console.log(req.body.priceDiscount + 4);
  if (parseInt(req.body.priceDiscount) >= parseInt(req.body.price)) {
    return next(new AppError('세일 가격은 원래 가격보다 낮아야 합니다.', 404));
  }

  const doc = await Track.findByIdAndUpdate(req.params.id, req.body);

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

// Renderer for Track-post page to create new Track document
exports.TrackPostPageRenderer = catchAsync(async (req, res, next) => {
  res.status(200).render('product/track-post', {
    title: 'Create New Track',
  });
});
// Renderer for Track-edit page to edit Track document
exports.TrackEditPageRenderer = catchAsync(async (req, res, next) => {
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

  const doc = await Track.findById(req.params.id);

  if (!doc) {
    return next(new AppError('No track found with that ID', 404));
  }

  res.status(200).render('product/track-edit', {
    title: 'Edit a Track',
    track: doc,
    length: length,
    query: query,
    albums,
    producer,
  });
});

/*******************************
 *  Track Handler for Client-side
 *******************************/

// exports.getAllTracks = factory.getAll(Track);
// exports.getTrack = factory.getOne(Track, { path: 'reviews' });
// exports.createTrack = factory.createOne(Track);
// exports.updateTrack = factory.updateOne(Track);
// exports.deleteTrack = factory.deleteOne(Track);

// exports.getTrackstats = catchAsync(async (req, res) => {
//   const stats = await Track.aggregate([
//     {
//       $match: { ratingsAverage: { $gte: 4.5 } },
//     },
//     {
//       $group: {
//         _id: { $toUpper: '$songName' },
//         numTracks: { $sum: 1 },
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
