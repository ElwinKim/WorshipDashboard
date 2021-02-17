const fs = require('fs');
const fsExtra = require('fs-extra');
const Album = require('../models/albumModel');
const User = require('../models/userModel');
const Track = require('../models/trackModel');
const multer = require('multer');
const MulterAzureStorage = require('multer-azure-blob-storage')
  .MulterAzureStorage;
const ObjectID = require('mongodb').ObjectID;
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const { BlobServiceClient } = require('@azure/storage-blob');
const formidable = require('formidable');

// Set Azure blob storage connection variables.
const AZURE_STORAGE_CONNECTION_STRING =
  process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_STORAGE_ACCOUNT_ACCESS_KEY =
  process.env.AZURE_STORAGE_ACCOUNT_ACCESS_KEY;
const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;

var container; // global variable for container name
var objectId; // global variable ObjectID for mongoDB

exports.generateIdAndNewCon = exports.generateId = async (req, res, next) => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
  );
  // if Client upload files, when update tracks
  if (req.params.id) {
    objectId = req.params.id;
    var form = formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
      if (files['tracks[]'].size !== 0) {
        container = 'track-' + objectId;
        const containerClient = blobServiceClient.getContainerClient(container);
        for await (const blob of containerClient.listBlobsFlat()) {
          await containerClient.deleteBlob(blob.name);
          console.log('deleting blobs');
        }
      }
    });
    next();
  } else {
    console.log('Create new Tracks');
    objectId = new ObjectID();
    container = 'track-' + objectId;
    const containerClient = blobServiceClient.getContainerClient(container);
    await containerClient.create();
    await containerClient.setAccessPolicy('blob');
    next();
  }
};

// Multer Azure storage get only function. So it returns container name
const getContainer = async (req, file) => {
  container = `track-${objectId}`;
  return container;
};

// Return blob name
const resolveBlobName = (req, file) => {
  return new Promise((resolve, reject) => {
    const blobName = generateBlobName(req, file);
    resolve(blobName);
  });
};

let tracks = []; // global variable for track names
//Each file name will store to tracks array
const generateBlobName = (req, file) => {
  console.log('uploading...');
  tracks.push(file.originalname);
  return file.originalname;
};

// Multer Azure Storage access form
const azureStorage = new MulterAzureStorage({
  connectionString: AZURE_STORAGE_CONNECTION_STRING,
  accessKey: AZURE_STORAGE_ACCOUNT_ACCESS_KEY,
  accountName: AZURE_STORAGE_ACCOUNT_NAME,
  containerName: getContainer,
  blobName: resolveBlobName,
  containerAccessLevel: 'blob',
  urlExpirationTime: 60,
});

const uploadTrackFiles = multer({
  storage: azureStorage,
});

exports.uploadTrack = uploadTrackFiles.array('tracks[]', 25);

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
  req.body.tracks = tracks;
  req.body._id = objectId;
  const doc = await Track.create(req.body);
  tracks = [];
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
      const blobServiceClient = BlobServiceClient.fromConnectionString(
        AZURE_STORAGE_CONNECTION_STRING
      );
      container = 'track-' + Object.values(queryObj)[i];
      const containerClient = blobServiceClient.getContainerClient(container);
      await containerClient.delete();
    }
  } else {
    const doc = await Track.findByIdAndDelete(req.params.id);

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      AZURE_STORAGE_CONNECTION_STRING
    );
    container = 'track-' + req.params.id;
    const containerClient = blobServiceClient.getContainerClient(container);
    await containerClient.delete();
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

/****************
 * Update Tracks
 ****************/

exports.updateTrack = catchAsync(async (req, res, next) => {
  if (req.files.length) {
    req.body.tracks = tracks;
  } else {
    delete req.body.tracks;
  }

  if (parseInt(req.body.priceDiscount) >= parseInt(req.body.price)) {
    return next(new AppError('세일 가격은 원래 가격보다 낮아야 합니다.', 404));
  }

  const doc = await Track.findByIdAndUpdate(req.params.id, req.body);

  if (!doc) {
    return next(new AppError('No Document found with that ID', 404));
  }

  tracks = [];
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
