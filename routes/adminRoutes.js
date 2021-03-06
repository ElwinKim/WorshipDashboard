const express = require('express');
const ObjectID = require('mongodb').ObjectID;
const multer = require('multer');
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const router = express.Router();

router.get('/', adminController.getLoginForm);
router.use(authController.isLoggedIn);
router.use(authController.restrictTo('admin'));
router.get('/main', adminController.getMain);

/************
 * Album API
 *************/
//These routers has rendering task, will not work with another method
router
  .route('/album')
  .get(adminController.getAllAlbums)
  .delete(adminController.deleteAlbum);
router.get('/album/:id', adminController.getAlbum);
router.patch(
  '/album/:id',
  adminController.uploadAlbumImage,
  adminController.resizeAlbumImage,
  adminController.updateAlbum
);

router
  .route('/album-post')
  .get(adminController.albumPostPageRenderer)
  .post(
    adminController.uploadAlbumImage,
    adminController.resizeAlbumImage,
    adminController.createNewAlbum
  );

/************
 * Track API
 *************/

router
  .route('/track')
  .get(adminController.getAllTracks)
  .delete(adminController.deleteTracks);
router.get('/track/:id', adminController.getTrack);
router
  .route('/track-edit/:id')
  .get(adminController.trackEditPageRenderer)
  .patch(
    adminController.generateTrackIdAndContainer,
    adminController.uploadTracks,
    adminController.updateTrack
  );
router
  .route('/track-post')
  .get(
    adminController.getAllAlbumsforTrack,
    adminController.trackPostPageRenderer
  )
  .post(
    adminController.generateTrackIdAndContainer,
    adminController.uploadTracks,
    adminController.createNewTrack
  );

/************
 * Patch API
 *************/

router
  .route('/patch')
  .get(adminController.getAllPatches)
  .delete(adminController.deletePatches);
router.route('/patch/:id').get(adminController.getPatch);
router
  .route('/patch-post')
  .get(adminController.getAllProforPatch, adminController.patchPostPageRenderer)
  .post(
    adminController.generateId,
    adminController.uploadPatch,
    adminController.createNewPatch
  );
router
  .route('/patch-edit/:id')
  .get(adminController.patchEditPageRenderer)
  .patch(
    adminController.generateId,
    adminController.uploadPatch,
    adminController.updatePatch
  );

/************
 * Pad API
 *************/

router
  .route('/pad')
  .get(adminController.getAllPads)
  .delete(adminController.deletePads);
router.route('/pad/:id').get(adminController.getPad);
router
  .route('/pad-post')
  .get(adminController.getAllProforPad, adminController.padPostPageRenderer)
  .post(
    adminController.generatePadIdAndContainer,
    adminController.uploadPads,
    adminController.createNewPad
  );
router
  .route('/pad-edit/:id')
  .get(adminController.padEditPageRenderer)
  .patch(
    adminController.generatePadIdAndContainer,
    adminController.uploadPads,
    adminController.updatePad
  );

router.get('/user', adminController.getUser);
router.get('/producer', adminController.getProducer);

module.exports = router;
