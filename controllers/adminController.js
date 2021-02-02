const Album = require('../models/albumModel');
const User = require('../models/userModel');
const Track = require('../models/trackModel');
const ObjectID = require('mongodb').ObjectID;
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

const albumHandler = require('./albumHandler');
const trackHandler = require('./trackHandler');
const patchHandler = require('./patchHandler');
const padHandler = require('./padHandler');
exports.getMain = catchAsync(async (req, res, next) => {
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "script-src 'self' https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js 'unsafe-inline' 'unsafe-eval';",
      "script-src 'self' https://code.jquery.com/jquery-3.5.1.slim.min.js 'unsafe-inline' 'unsafe-eval';",
      "script-src 'self' https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js 'unsafe-inline' 'unsafe-eval';",
      "script-src 'self' https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js 'unsafe-inline' 'unsafe-eval';"
    );
  res.status(200).render('index', {
    title: 'Welcom to the Admin',
  });
});

//Controllers for Album
//Details are in album handler
exports.getAllAlbums = albumHandler.getAllAlbumsToAdmin;
exports.createNewAlbum = albumHandler.createNewAlbum;
exports.getAlbum = albumHandler.getAlbumToAdmin;
exports.deleteAlbum = albumHandler.deleteAlbums;
exports.updateAlbum = albumHandler.updateAlbum;
exports.albumPostPageRenderer = albumHandler.albumPostPageRenderer;
exports.uploadAlbumImage = albumHandler.uploadAlbumImage;
exports.resizeAlbumImage = albumHandler.resizeAlbumImage;

//Controlers for Track
exports.getAllAlbumsforTrack = trackHandler.getAlbumsAndProForTrack;
exports.getAllTracks = trackHandler.getAllTracksToAdmin;
exports.createNewTrack = trackHandler.createNewTrack;
exports.getTrack = trackHandler.getTrackToAdmin;
exports.trackPostPageRenderer = trackHandler.TrackPostPageRenderer;
exports.trackEditPageRenderer = trackHandler.TrackEditPageRenderer;
exports.deleteTracks = trackHandler.deleteTracks;
exports.updateTrack = trackHandler.updateTrack;
exports.uploadTracks = trackHandler.uploadTrack;
exports.extractZipFile = trackHandler.extractTrack;
exports.mergeTracks = trackHandler.mergeTracks;
exports.createContainer = trackHandler.createContainer;

//Controlers for Patch
exports.getAllProforPatch = patchHandler.getProForPatch;
exports.getAllPatches = patchHandler.getAllPatchesToAdmin;
exports.createNewPatch = patchHandler.createNewPatch;
exports.getPatch = patchHandler.getPatchToAdmin;
exports.patchPostPageRenderer = patchHandler.patchPostPageRenderer;
exports.patchEditPageRenderer = patchHandler.PatchEditPageRenderer;
exports.deletePatches = patchHandler.deletePatches;
exports.updatePatch = patchHandler.updatePatch;
exports.uploadPatch = patchHandler.uploadPatch;
exports.resizePatchImage = patchHandler.resizePatchImage;

//Controlers for Patch
exports.getAllProforPad = padHandler.getProForPad;
exports.getAllPads = padHandler.getAllPadsToAdmin;
exports.createNewPad = padHandler.createNewPad;
exports.getPad = padHandler.getPadToAdmin;
exports.padPostPageRenderer = padHandler.padPostPageRenderer;
exports.padEditPageRenderer = padHandler.padEditPageRenderer;
exports.deletePads = padHandler.deletePads;
exports.updatePad = padHandler.updatePad;
exports.uploadPads = padHandler.uploadPad;
exports.resizePadImage = padHandler.resizePadImage;
exports.extractPadFile = padHandler.extractPad;
// exports.mergeTracks = trackHandler.mergeTracks;

// exports.getAllTracks = catchAsync(async (req, res, next) => {
//   const allData = await Track.find();
//   const features = new APIFeatures(Track, req.query)
//     .search()
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const page = req.query.page;
//   let length = allData.length;
//   const tracks = await features.query;

//   const searchFeature = new APIFeatures(Track, req.query).search();
//   const searchTrack = await searchFeature.query;
//   let query;

//   if (req.query.q) {
//     query = req.query.q;
//     length = searchTrack.length;
//   } else {
//     query = '';
//   }
//   res.status(200).render('product/tracks', {
//     title: 'Tracks',
//     length: length,
//     page: page,
//     query: query,
//     tracks,
//   });
// });

// exports.getTrack = catchAsync(async (req, res, next) => {
//   res.status(200).render('product/tracks', {
//     title: 'Tracks',
//   });
// });

exports.getPad = catchAsync(async (req, res, next) => {
  res.status(200).render('product/pad', {
    title: 'Pad',
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  res.status(200).render('user', {
    title: 'User',
  });
});

exports.getProducer = catchAsync(async (req, res, next) => {
  res.status(200).render('Producer', {
    title: 'Producer',
  });
});

exports.getOrder = catchAsync(async (req, res, next) => {
  res.status(200).render('order', {
    title: 'Order',
  });
});

exports.getLoginForm = (req, res) => {
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "script-src 'self' https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js 'unsafe-inline' 'unsafe-eval';"
    );
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};
