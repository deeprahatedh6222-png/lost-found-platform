const multer = require('multer');

// Use memory storage — files will be uploaded to Supabase Storage from the controller
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = allowed.test(file.originalname.split('.').pop().toLowerCase());
  const mime = allowed.test(file.mimetype);

  if (ext && mime) return cb(null, true);
  cb(new Error('Only JPG, JPEG, PNG and WEBP images are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = upload;
