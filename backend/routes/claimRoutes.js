const express = require('express');
const {
  createClaim,
  getMyClaims,
  getClaimsForItem,
  updateClaimStatus,
  withdrawClaim,
  getContactExchange
} = require('../controllers/claimController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.post('/', createClaim);
router.get('/mine', getMyClaims);
router.get('/item/:itemId', getClaimsForItem);
router.patch('/:id/status', updateClaimStatus);
router.get('/:id/contact', getContactExchange);
router.delete('/:id', withdrawClaim);

module.exports = router;
