const supabase = require('../config/supabase');

// ── CREATE CLAIM ──────────────────────────────────────────────
const createClaim = async (req, res, next) => {
  try {
    const { itemId, message } = req.body;
    if (!itemId || !message?.trim()) {
      return res.status(400).json({ message: 'Item and claim message are required' });
    }

    // Fetch the item
    const { data: item, error: itemErr } = await supabase
      .from('items')
      .select('id, user_id, status')
      .eq('id', itemId)
      .single();

    if (itemErr || !item) return res.status(404).json({ message: 'Item report not found' });
    if (item.status === 'resolved') {
      return res.status(400).json({ message: 'This report is already resolved' });
    }
    if (item.user_id === req.user.id) {
      return res.status(400).json({ message: 'You cannot claim your own report' });
    }

    // Check for existing claim
    const { data: existing } = await supabase
      .from('claims')
      .select('id')
      .eq('item_id', itemId)
      .eq('claimant_id', req.user.id)
      .single();

    if (existing) {
      return res.status(409).json({ message: 'You have already sent a claim for this item' });
    }

    const { data: claim, error } = await supabase
      .from('claims')
      .insert({
        item_id: itemId,
        claimant_id: req.user.id,
        message: message.trim()
      })
      .select('*, claimant:users!claims_claimant_id_fkey(id, name), item:items!claims_item_id_fkey(id, title, item_type, status, user_id)')
      .single();

    if (error) throw error;
    res.status(201).json(claim);
  } catch (error) {
    next(error);
  }
};

// ── GET MY CLAIMS ─────────────────────────────────────────────
const getMyClaims = async (req, res, next) => {
  try {
    const { data: claims, error } = await supabase
      .from('claims')
      .select('*, item:items!claims_item_id_fkey(id, title, item_type, status, image_url, location, user_id, user:users!items_user_id_fkey(id, name))')
      .eq('claimant_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(claims || []);
  } catch (error) {
    next(error);
  }
};

// ── GET CLAIMS FOR AN ITEM (owner only) ───────────────────────
const getClaimsForItem = async (req, res, next) => {
  try {
    // Verify ownership
    const { data: item, error: itemErr } = await supabase
      .from('items')
      .select('id, user_id')
      .eq('id', req.params.itemId)
      .single();

    if (itemErr || !item) return res.status(404).json({ message: 'Item report not found' });
    if (item.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Only the report owner can view these claims' });
    }

    const { data: claims, error } = await supabase
      .from('claims')
      .select('*, claimant:users!claims_claimant_id_fkey(id, name)')
      .eq('item_id', item.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(claims || []);
  } catch (error) {
    next(error);
  }
};

// ── UPDATE CLAIM STATUS (accept / reject) ─────────────────────
const updateClaimStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be accepted or rejected' });
    }

    // Fetch the claim with its item
    const { data: claim, error: claimErr } = await supabase
      .from('claims')
      .select('*, item:items!claims_item_id_fkey(id, user_id)')
      .eq('id', req.params.id)
      .single();

    if (claimErr || !claim) return res.status(404).json({ message: 'Claim not found' });
    if (claim.item.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Only the report owner can update this claim' });
    }

    // Update the claim status
    const { data: updated, error } = await supabase
      .from('claims')
      .update({ status })
      .eq('id', req.params.id)
      .select('*, item:items!claims_item_id_fkey(id, title, item_type, status, user_id)')
      .single();

    if (error) throw error;

    // If accepted, mark item as claimed and reject other pending claims
    if (status === 'accepted') {
      await supabase
        .from('items')
        .update({ status: 'claimed' })
        .eq('id', claim.item.id);

      await supabase
        .from('claims')
        .update({ status: 'rejected' })
        .eq('item_id', claim.item.id)
        .neq('id', claim.id)
        .eq('status', 'pending');
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// ── WITHDRAW CLAIM ────────────────────────────────────────────
const withdrawClaim = async (req, res, next) => {
  try {
    const { data: claim, error: fetchErr } = await supabase
      .from('claims')
      .select('id, claimant_id, status')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !claim) return res.status(404).json({ message: 'Claim not found' });
    if (claim.claimant_id !== req.user.id) {
      return res.status(403).json({ message: 'You can withdraw only your own claim' });
    }
    if (claim.status === 'accepted') {
      return res.status(400).json({ message: 'Accepted claims cannot be withdrawn' });
    }

    const { error } = await supabase
      .from('claims')
      .delete()
      .eq('id', claim.id);

    if (error) throw error;
    res.json({ message: 'Claim withdrawn' });
  } catch (error) {
    next(error);
  }
};

// ── CONTACT EXCHANGE ──────────────────────────────────────────
const getContactExchange = async (req, res, next) => {
  try {
    const { data: claim, error: fetchErr } = await supabase
      .from('claims')
      .select('id, status, claimant_id, claimant:users!claims_claimant_id_fkey(id, name, email), item:items!claims_item_id_fkey(id, title, user_id, user:users!items_user_id_fkey(id, name, email))')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !claim) return res.status(404).json({ message: 'Claim not found' });
    if (claim.status !== 'accepted') {
      return res.status(403).json({ message: 'Contact details are available only after a claim is accepted' });
    }

    const currentUserId = req.user.id;
    if (![claim.claimant_id, claim.item.user_id].includes(currentUserId)) {
      return res.status(403).json({ message: 'You are not part of this claim' });
    }

    res.json({
      item: { id: claim.item.id, title: claim.item.title },
      reporter: { name: claim.item.user.name, email: claim.item.user.email },
      claimant: { name: claim.claimant.name, email: claim.claimant.email }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClaim,
  getMyClaims,
  getClaimsForItem,
  updateClaimStatus,
  withdrawClaim,
  getContactExchange
};
