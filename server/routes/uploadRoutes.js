// server/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');

const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'reviews',
      resource_type: 'image'
    });
    res.json({ success: true, url: result.secure_url });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Upload failed' });
  }
});

module.exports = router;e