const express = require('express');
const {
  createItem,
  getItems,
  getItemById,
  getMyItems,
  updateItem,
  changeStatus,
  deleteItem
} = require('../controllers/itemController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getItems);
router.get('/mine', protect, getMyItems);
router.get('/:id', getItemById);
router.post('/', protect, upload.single('image'), createItem);
router.put('/:id', protect, upload.single('image'), updateItem);
router.patch('/:id/status', protect, changeStatus);
router.delete('/:id', protect, deleteItem);

module.exports = router;
